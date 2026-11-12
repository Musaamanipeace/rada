import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "localhost",
        port: Number(process.env.EMAIL_SERVER_PORT) || 1025,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASSWORD || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@rada.example",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.AUTH_SECRET,
};
