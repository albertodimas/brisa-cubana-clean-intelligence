"use client";

import { useState, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/logo";

type NavigationItem = {
  name: string;
  href: Route | { pathname: Route; hash?: string };
};

const navigation: readonly NavigationItem[] = [
  { name: "Servicios", href: { pathname: "/", hash: "servicios" } },
  { name: "Precios", href: { pathname: "/", hash: "precios" } },
  { name: "Portal Cliente", href: "/clientes" },
  { name: "FAQ", href: { pathname: "/", hash: "faq" } },
  { name: "Contacto", href: { pathname: "/", hash: "contacto" } },
];

export function MainHeaderSimple() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-brisa-950/95 backdrop-blur-md shadow-lg shadow-brisa-800/10"
          : "bg-gradient-to-b from-black/10 via-black/0 to-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4"
        aria-label="Global"
      >
        <div className="flex lg:flex-1">
          <BrandLogo
            showWordmark
            invert={!scrolled}
            className="-m-1.5 p-1.5 pl-0"
            contentClassName="group"
          />
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 transition-colors hover:text-brisa-600 dark:hover:text-brisa-400 ${
                scrolled
                  ? "text-gray-900 dark:text-white"
                  : "text-white dark:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link
            href="/login"
            className={`text-sm font-semibold leading-6 transition-colors ${
              scrolled
                ? "text-gray-900 dark:text-white hover:text-brisa-600 dark:hover:text-brisa-400"
                : "text-white hover:text-brisa-200"
            }`}
          >
            Iniciar sesión <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link
            href={{ pathname: "/", hash: "contacto" }}
            className="rounded-full bg-brisa-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700 hover:shadow-xl hover:shadow-brisa-600/30 transition-all"
          >
            Solicitar cotización
          </Link>
        </div>
      </nav>
    </header>
  );
}
