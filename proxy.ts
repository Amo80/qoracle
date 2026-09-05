import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedAdministrator } from "@/lib/auth/admin";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminLogin = request.nextUrl.pathname === "/admin/login";
  const isAuthorizedAdmin = isAuthorizedAdministrator(user);

  if (!user && !isAdminLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && !isAuthorizedAdmin) {
    await supabase.auth.signOut();

    if (isAdminLogin) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "unauthorized-account");
    return NextResponse.redirect(url);
  }

  if (isAuthorizedAdmin && isAdminLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};