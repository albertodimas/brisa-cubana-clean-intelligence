"use client";

import { useState, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

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
          ? "bg-white/95 dark:bg-brisa-950/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4"
        aria-label="Global"
      >
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 group">
            <span className="sr-only">Brisa Cubana Clean Intelligence</span>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brisa-600 to-brisa-400 flex items-center justify-center shadow-lg shadow-brisa-600/20 group-hover:shadow-xl group-hover:shadow-brisa-600/30 transition-shadow">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <span
                className={`font-semibold text-lg transition-colors ${
                  scrolled
                    ? "text-gray-900 dark:text-white"
                    : "text-white dark:text-white"
                }`}
              >
                Brisa Cubana
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile menu button */}
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

        {/* CTA Buttons */}
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
              className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-brisa-50 dark:hover:bg-brisa-900 ${
                scrolled
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-900 dark:text-white bg-white/10 backdrop-blur-sm"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-4 space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-brisa-50 dark:hover:bg-brisa-900 ${
                scrolled
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-900 dark:text-white bg-white/10 backdrop-blur-sm"
              }`}
            >
              Iniciar sesión
            </Link>
            <Link
              href={{ pathname: "/", hash: "contacto" }}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-full bg-brisa-600 px-4 py-2.5 text-center text-base font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700"
            >
              Solicitar cotización
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
