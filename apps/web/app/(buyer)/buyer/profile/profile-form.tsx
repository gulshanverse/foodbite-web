"use client";
import React, { useState } from "react";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name") }) });
    setMessage(response.ok ? "Profile updated." : "We could not update your profile."); setPending(false);
  }
  return <form onSubmit={submit} className="mt-8 max-w-md space-y-5"><label className="block text-sm font-medium">Name<input name="name" defaultValue={initialName} required minLength={2} maxLength={80} className="mt-2 min-h-11 w-full rounded-lg border border-[#dbe4df] bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#e85d3f]" /></label>{message && <p role="status" className="text-sm text-[#55706c]">{message}</p>}<button disabled={pending} className="min-h-11 rounded-lg bg-[#e85d3f] px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save profile"}</button></form>;
}
