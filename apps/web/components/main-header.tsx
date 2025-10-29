"use client";

import { useState, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
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

export function MainHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

        <div className="flex lg:hidden">
          <button
            type="button"
            className={`-m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 transition-colors ${
              scrolled
                ? "text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-brisa-800"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">
              {mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            </span>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-semibold leading-6 transition-colors hover:text-[#1ecad3] dark:hover:text-[#7adfe9] ${
                scrolled
                  ? "text-[#0d2944] dark:text-white"
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
                ? "text-[#0d2944] dark:text-white hover:text-[#1ecad3] dark:hover:text-[#7adfe9]"
                : "text-white hover:text-[#a8f5f8]"
            }`}
          >
            Iniciar sesión <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link
            href={{ pathname: "/", hash: "contacto" }}
            className="rounded-full bg-[#0d2944] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0d294433] hover:bg-[#11466d] hover:shadow-xl hover:shadow-[#0d29444d] transition-all"
          >
            Solicitar cotización
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="space-y-2 px-4 pb-6 pt-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-[#ecfcff] dark:hover:bg-[#0d1a2d] ${
                scrolled
                  ? "text-[#0d2944] dark:text-white"
                  : "text-[#0d2944] dark:text-white bg-white/10 backdrop-blur-sm"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-4 space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-[#ecfcff] dark:hover:bg-[#0d1a2d] ${
                scrolled
                  ? "text-[#0d2944] dark:text-white"
                  : "text-[#0d2944] dark:text-white bg-white/10 backdrop-blur-sm"
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              href={{ pathname: "/", hash: "contacto" }}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-full bg-[#0d2944] px-4 py-2.5 text-center text-base font-semibold text-white shadow-lg shadow-[#0d294433] hover:bg-[#11466d]"
            >
              Solicitar cotización
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
