"use client";

import { useState, useRef, useEffect } from "react";
import { CURRENCIES, currencyFlagUrl } from "@/lib/constants";

const CURRENCY_NAMES: Record<string, string> = {
  EUR: "Euro", USD: "US Dollar", GBP: "British Pound", RSD: "Serbian Dinar",
  CHF: "Swiss Franc", JPY: "Japanese Yen", CNY: "Chinese Yuan",
  AUD: "Australian Dollar", CAD: "Canadian Dollar", SEK: "Swedish Krona",
  NOK: "Norwegian Krone", DKK: "Danish Krone", PLN: "Polish Zloty",
  CZK: "Czech Koruna", HUF: "Hungarian Forint", RON: "Romanian Leu",
  BGN: "Bulgarian Lev", HRK: "Croatian Kuna", TRY: "Turkish Lira",
  BRL: "Brazilian Real", INR: "Indian Rupee", KRW: "South Korean Won",
  MXN: "Mexican Peso", ZAR: "South African Rand",
};

export function CurrencySelect({
  name = "currency",
  value,
  defaultValue = "EUR",
  onChange,
  className = "",
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (code: string) => void;
  className?: string;
}) {
  const [selected, setSelected] = useState(value ?? defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function select(code: string) {
    setSelected(code);
    setOpen(false);
    onChange?.(code);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-sm dark:border-sp-border dark:bg-sp-bg"
      >
        <img
          src={currencyFlagUrl(selected, 40)}
          alt=""
          className="h-[15px] w-[20px] shrink-0 rounded-[2px] object-cover"
        />
        <span className="font-semibold">{selected}</span>
        <span className="text-xs text-gray-400 dark:text-sp-muted">
          {CURRENCY_NAMES[selected] || ""}
        </span>
        <svg
          className={`ml-auto h-3 w-3 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-sp-border dark:bg-sp-bg">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => select(c)}
              className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-sp-surface ${
                c === selected
                  ? "bg-indigo-50 font-semibold text-indigo-600 dark:bg-sp-accent/10 dark:text-sp-accent"
                  : ""
              }`}
            >
              <img
                src={currencyFlagUrl(c, 40)}
                alt=""
                className="h-[15px] w-[20px] shrink-0 rounded-[2px] object-cover"
              />
              <span className="font-semibold">{c}</span>
              <span className="text-xs text-gray-400 dark:text-sp-muted">
                {CURRENCY_NAMES[c] || ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
