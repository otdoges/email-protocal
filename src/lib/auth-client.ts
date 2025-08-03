import { createAuthClient } from "better-auth/client";
import type { Session, User } from "./better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export type { Session, User };