"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ConvexProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}