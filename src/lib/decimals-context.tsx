"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { fmt } from "@/lib/format";

type DecimalsContextValue = {
  decimals: number;
  setDecimals: (d: number) => void;
  fmtD: (value: number, overrideDecimals?: number) => string;
};

const DecimalsContext = createContext<DecimalsContextValue>({
  decimals: 0,
  setDecimals: () => {},
  fmtD: (v) => fmt(v, 0),
});

export function DecimalsProvider({
  initial,
  children,
}: {
  initial: number;
  children: ReactNode;
}) {
  const [decimals, setDecimals] = useState(initial);

  const fmtD = (value: number, overrideDecimals?: number) =>
    fmt(value, overrideDecimals ?? decimals);

  return (
    <DecimalsContext.Provider value={{ decimals, setDecimals, fmtD }}>
      {children}
    </DecimalsContext.Provider>
  );
}

export function useDecimals() {
  return useContext(DecimalsContext);
}
