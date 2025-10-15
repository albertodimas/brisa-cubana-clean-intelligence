"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "./button";

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
};

const DEBOUNCE_MS = 300;

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "Buscar…",
      isLoading = false,
      className = "",
      autoFocus = false,
      disabled = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [internalValue, setInternalValue] = useState(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(internalValue.trimStart());
      }, DEBOUNCE_MS);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [internalValue, onChange]);

    const handleClear = useCallback(() => {
      setInternalValue("");
      onChange("");
      if (onClear) {
        onClear();
      }
      inputRef.current?.focus();
    }, [onChange, onClear]);

    const hasText = internalValue.length > 0;

    return (
      <div
        className={`relative flex items-center rounded-lg border border-brisa-700 bg-brisa-900 focus-within:border-brisa-400 focus-within:ring-2 focus-within:ring-brisa-400 ${className}`}
        aria-busy={isLoading}
      >
        <span className="pl-3 pr-2 text-brisa-400" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="search"
          value={internalValue}
          onChange={(event) => setInternalValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && hasText) {
              event.preventDefault();
              handleClear();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-brisa-50 placeholder-brisa-500 focus:outline-none disabled:opacity-60"
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={placeholder}
        />
        {isLoading ? (
          <svg
            className="mr-3 h-4 w-4 animate-spin text-brisa-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label="Cargando resultados"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : hasText ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mr-1.5 px-2 py-1 text-xs text-brisa-400 hover:text-brisa-200"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </Button>
        ) : null}
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
