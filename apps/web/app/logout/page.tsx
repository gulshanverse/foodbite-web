"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
export default function LogoutPage() { useEffect(() => { void signOut({ callbackUrl: "/" }); }, []); return <main className="grid min-h-screen place-items-center text-[var(--muted)]">Signing you out…</main>; }
