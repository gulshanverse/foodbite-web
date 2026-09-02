"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const form = new FormData(event.currentTarget);
    if (mode === "signup") {
      if (form.get("password") !== form.get("confirmPassword")) { setError("Passwords do not match."); setPending(false); return; }
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") }) });
      if (!response.ok) { setError("Please check your details and try again."); setPending(false); return; }
    }
    const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
    if (result?.error) setError("We could not sign you in with those details."); else router.push("/account");
    setPending(false);
  }
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"><Link href="/" className="mb-10 text-sm font-bold text-[#173f3b]">← FoodBite</Link><h1 className="text-4xl font-bold tracking-tight text-[#173f3b]">{mode === "login" ? "Welcome back" : "Join FoodBite"}</h1><p className="mt-3 text-[#55706c]">{mode === "login" ? "Sign in to continue." : "Create your account to get started."}</p><form className="mt-8 space-y-5" onSubmit={submit} noValidate>{mode === "signup" && <Field id="name" label="Name" autoComplete="name" required /> }<Field id="email" label="Email" type="email" autoComplete="email" required /><Field id="password" label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />{mode === "signup" && <><Field id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required /><label className="block text-sm font-medium">Role<select name="role" defaultValue="BUYER" className="mt-2 min-h-11 w-full rounded-lg border border-[#dbe4df] bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#e85d3f]"><option value="BUYER">Buyer</option><option value="SELLER">Seller</option></select></label></>}{error && <p role="alert" className="text-sm font-medium text-[#b33f2d]">{error}</p>}<button disabled={pending} className="min-h-11 w-full rounded-lg bg-[#e85d3f] px-5 py-3 font-semibold text-white hover:bg-[#cf4d32] disabled:opacity-60">{pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form><p className="mt-6 text-sm text-[#55706c]">{mode === "login" ? <>New to FoodBite? <Link href="/signup" className="font-semibold underline">Create an account</Link></> : <>Already have an account? <Link href="/login" className="font-semibold underline">Sign in</Link></>}</p></main>;
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) { const { id, label, ...rest } = props; return <label className="block text-sm font-medium">{label}<input name={id} id={id} className="mt-2 min-h-11 w-full rounded-lg border border-[#dbe4df] bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#e85d3f]" {...rest} /></label>; }
