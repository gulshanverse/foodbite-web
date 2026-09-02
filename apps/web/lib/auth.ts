import type { AccountStatus, UserRole } from "@prisma/client";
import type { AuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@foodbite/validation";

export type AppUser = { id: string; email: string; role: UserRole; status: AccountStatus; name?: string };

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [CredentialsProvider({
    name: "Email and password",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findFirst({ where: { email, deletedAt: null }, include: { buyerProfile: true } });
      if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return null;
      if (["BANNED", "DEACTIVATED"].includes(user.status)) return null;
      return { id: user.id, email: user.email, name: user.buyerProfile?.name, role: user.role, status: user.status };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.sub = user.id; token.role = (user as AppUser).role; token.status = (user as AppUser).status; }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as AccountStatus;
      }
      return session;
    },
  },
};

export async function getCurrentUser(): Promise<AppUser | null> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions) as (Session & { user?: AppUser }) | null;
  if (!session?.user?.id) return null;
  const user = await prisma.user.findFirst({ where: { id: session.user.id, deletedAt: null }, select: { id: true, email: true, role: true, status: true, buyerProfile: { select: { name: true } } } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.buyerProfile?.name, role: user.role, status: user.status };
}
