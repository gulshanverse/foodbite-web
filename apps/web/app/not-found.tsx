import Link from "next/link";
export default function NotFound() { return <main className="grid min-h-screen place-items-center px-6 text-center"><div><p className="text-sm font-semibold text-[#e85d3f]">404</p><h1 className="mt-2 text-4xl font-bold text-[#173f3b]">Page not found</h1><Link className="mt-6 inline-block underline" href="/">Return home</Link></div></main>; }
