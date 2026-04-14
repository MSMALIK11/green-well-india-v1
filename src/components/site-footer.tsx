import Link from "next/link";
import { Facebook, Globe, Instagram, Mail, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E8F5E9] bg-[#1B5E20] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">
              Green Well LLP
            </p>
            <p className="mt-1 text-sm text-[#C8E6C9]">
              Pure Natural Nutrition
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <a
              href="tel:+918433250993"
              className="flex items-center gap-2 text-[#E8F5E9] transition hover:text-white"
            >
              <Phone className="h-4 w-4 shrink-0" />
              +91 8433250993
            </a>
            <a
              href="mailto:Greenwellindia25@gmail.com"
              className="flex items-center gap-2 text-[#E8F5E9] transition hover:text-white"
            >
              <Mail className="h-4 w-4 shrink-0" />
              Greenwellindia25@gmail.com
            </a>
            <span className="flex items-center gap-2 text-[#C8E6C9]">
              <Globe className="h-4 w-4 shrink-0" />
              www.greenwellindia.in
            </span>
          </div>
          <div className="flex gap-3">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 p-2 transition hover:bg-white/10"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 p-2 transition hover:bg-white/10"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-white/15 pt-8 text-center text-xs text-[#A5D6A7]">
          <p>© {new Date().getFullYear()} Green Well Nutrition. All Rights Reserved.</p>
          <p className="mt-2">
            <Link href="/contact" className="underline-offset-2 hover:underline">
              Contact
            </Link>
            {" · "}
            <Link href="/login" className="underline-offset-2 hover:underline">
              Partner login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
