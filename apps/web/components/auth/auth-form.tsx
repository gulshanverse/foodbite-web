"use client";

import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake, MapPin, ShieldCheck, Sparkles, Store } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const signup = mode === "signup";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      if (signup) {
        if (form.get("password") !== form.get("confirmPassword")) {
          setError("Passwords do not match. Please enter the same password in both fields.");
          return;
        }
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") }),
        });
        if (!response.ok) {
          setError(response.status === 429 ? "Too many attempts. Please wait a little and try again." : "We couldn't create that account. Check your details and try again.");
          return;
        }
      }
      const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
      if (result?.error) {
        setError("We couldn't sign you in with those details. Check your email and password and try again.");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong while connecting to FoodBite. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-visual" aria-hidden="true">
          <div className="auth-visual-inner">
            <Link href="/" className="brand auth-brand"><span className="brand-mark">F</span><span>FoodBite</span></Link>
            <div>
              <span className="auth-kicker"><Sparkles className="size-3.5" /> Good Food. Less Waste.</span>
              <h2>{signup ? "Make room for a better food system." : "Give good food a better next chapter."}</h2>
              <p className="auth-visual-copy">{signup ? "Join a calmer marketplace built around nearby discovery, clear availability, and responsible surplus food workflows." : "Discover eligible surplus food nearby, or help your food business turn surplus into value."}</p>
              <div className="auth-benefits">
                <div className="auth-benefit"><MapPin className="size-4" /><strong>Nearby first</strong><span>Pickup-led discovery</span></div>
                <div className="auth-benefit"><Store className="size-4" /><strong>Seller-led</strong><span>Real supply & windows</span></div>
                <div className="auth-benefit"><HeartHandshake className="size-4" /><strong>Responsible</strong><span>Trust by design</span></div>
              </div>
            </div>
            <span className="auth-legal">An India-first surplus food marketplace.</span>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-card">
            <div className="auth-card-mark">F</div>
            <p className="page-kicker mt-5">{signup ? "Create your account" : "Welcome back"}</p>
            <h1>{signup ? "Join FoodBite" : "Welcome back"}</h1>
            <p className="auth-card-subtitle">{signup ? "Choose how you want to use FoodBite and start with a better next chapter." : "Sign in to continue to your FoodBite account."}</p>

            <form onSubmit={submit} noValidate>
              {signup && <Field id="name" label="Full name" placeholder="Your name" autoComplete="name" required />}
              <Field id="email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" required />
              <PasswordField id="password" label="Password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required shown={showPassword} onToggle={() => setShowPassword(value => !value)} />
              {signup && <PasswordField id="confirmPassword" label="Confirm password" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" autoComplete="new-password" required shown={showConfirmPassword} onToggle={() => setShowConfirmPassword(value => !value)} />}
              {signup && <fieldset className="mt-5"><legend className="auth-field">I’m joining as</legend><div className="auth-role-grid"><RoleOption value="BUYER" title="Buyer" description="Find good food nearby" icon={MapPin} /><RoleOption value="SELLER" title="Seller" description="Turn surplus into value" icon={Store} /></div></fieldset>}
              {error && <div role="alert" className="auth-error">{error}</div>}
              <button type="submit" disabled={pending} className="auth-submit">{pending ? "Please wait…" : signup ? "Create my account" : "Sign in"}{!pending && <ArrowRight className="size-4" />}</button>
            </form>

            <div className="auth-divider"><span>FoodBite</span></div>
            <p className="auth-footer-link">{signup ? "Already have an account? " : "New to FoodBite? "}<Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
            <p className="auth-note"><ShieldCheck className="mr-1 inline size-3" /> We use your account details only to operate the FoodBite experience.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  const { id, label, ...rest } = props;
  return <label htmlFor={id} className="auth-field"><span>{label}</span><input name={id} id={id} {...rest} /></label>;
}

function PasswordField({ shown, onToggle, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; shown: boolean; onToggle: () => void }) {
  const { id, label, ...rest } = props;
  return <label htmlFor={id} className="auth-field"><span>{label}</span><span className="auth-password"><input name={id} id={id} {...rest} /><button type="button" onClick={onToggle} aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{shown ? <><EyeOff className="mr-1 inline size-3.5" />Hide</> : <><Eye className="mr-1 inline size-3.5" />Show</>}</button></span></label>;
}

function RoleOption({ value, title, description, icon: Icon }: { value: "BUYER" | "SELLER"; title: string; description: string; icon: typeof MapPin }) {
  return <label className="auth-role"><input type="radio" name="role" value={value} defaultChecked={value === "BUYER"} /><span><Icon className="mb-2 size-4 text-[var(--accent)]" /><strong>{title}</strong><small>{description}</small></span></label>;
}
