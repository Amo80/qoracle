import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthorization =
  | { authorized: true; user: User }
  | {
      authorized: false;
      reason: "unauthenticated" | "forbidden" | "misconfigured";
    };

function getConfiguredAdminUserId() {
  const adminUserId = process.env.ADMIN_USER_ID?.trim();

  if (
    !adminUserId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      adminUserId
    )
  ) {
    return null;
  }

  return adminUserId;
}

export function isAuthorizedAdministrator(user: Pick<User, "id"> | null) {
  const adminUserId = getConfiguredAdminUserId();
  return Boolean(adminUserId && user?.id === adminUserId);
}

export async function getAdminAuthorization(): Promise<AdminAuthorization> {
  const adminUserId = getConfiguredAdminUserId();

  if (!adminUserId) {
    return { authorized: false, reason: "misconfigured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, reason: "unauthenticated" };
  }

  if (user.id !== adminUserId) {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, user };
}

export async function requireAdminPage() {
  const authorization = await getAdminAuthorization();

  if (!authorization.authorized) {
    const reason =
      authorization.reason === "unauthenticated"
        ? "login-required"
        : "unauthorized-account";
    redirect(`/admin/login?error=${reason}`);
  }

  return authorization.user;
}

export async function requireAdminApi() {
  const authorization = await getAdminAuthorization();

  if (authorization.authorized) {
    return { user: authorization.user, response: null };
  }

  const status = authorization.reason === "unauthenticated" ? 401 : 403;
  return {
    user: null,
    response: NextResponse.json(
      {
        error:
          status === 401
            ? "Unauthorized"
            : "This account is not authorized for administrator access",
      },
      { status }
    ),
  };
}