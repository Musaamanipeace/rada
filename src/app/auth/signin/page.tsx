"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { t } from "@/lib/i18n";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await signIn("email", { email, redirect: false });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {t.auth.signInTitle}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t.auth.guestNotice}
        </p>

        {submitted ? (
          <div className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
            {t.auth.checkEmail}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
                {t.auth.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading ? t.common.loading : t.auth.sendMagicLink}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
