import React, { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("inline-flex min-h-11 items-center justify-center rounded-lg bg-[#e85d3f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf4d32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e85d3f] focus-visible:ring-offset-2 active:scale-[.98] disabled:opacity-50", className)} {...props} />; }
