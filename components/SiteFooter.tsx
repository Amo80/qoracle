"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const policyLinks = [
  ["Shipping", "/policies/shipping"],
  ["Returns & Refunds", "/policies/returns"],
  ["Privacy", "/policies/privacy"],
  ["Terms", "/policies/terms"],
  ["Contact & Support", "/policies/contact"],
];

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-policy-footer">
      <nav aria-label="Customer policies and support">
        {policyLinks.map(([label, href]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <p>© {new Date().getFullYear()} The QRystal Balls</p>
    </footer>
  );
}