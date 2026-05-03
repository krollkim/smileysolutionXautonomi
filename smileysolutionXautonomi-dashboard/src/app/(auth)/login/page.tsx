"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { t } from "@/lib/i18n/he";

// ─── Inner form — uses useSearchParams, must be inside <Suspense> ─────────────

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle implicit-flow magic link: Supabase puts #access_token in the hash.
  // createBrowserClient (@supabase/ssr) does NOT auto-parse hash tokens, so we
  // do it manually then call setSession to establish the cookie-based session.
  useEffect(() => {
    const supabase = createClient();

    // If user lands here with a hash token (implicit flow magic link)
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.slice(1)); // strip leading #
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (!error) router.replace("/inbox");
          });
        return;
      }
    }

    // Check for an existing session (e.g. already logged in, visiting /login)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/inbox");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived from URL — no useEffect needed
  const errorCode = searchParams.get("error_code");
  const urlError = errorCode
    ? (t.login.errors[errorCode] ?? t.login.errors.fallback)
    : null;

  const visibleError = urlError ?? formError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    setLoading(false);
    if (authError) {
      setFormError(authError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="card p-8">
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <AnimatePresence>
              {visibleError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md bg-amber-400/10 border border-amber-400/30 px-4 py-3"
                >
                  <p className="text-xs text-amber-300 leading-relaxed">{visibleError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label
                htmlFor="email"
                className="block text-xs text-[var(--text-secondary)] mb-2 tracking-wide"
              >
                {t.login.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.login.emailPlaceholder}
                required
                autoFocus
                className="w-full bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-md px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-black font-semibold text-sm py-3 rounded-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t.login.sending : t.login.sendButton}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 space-y-3"
          >
            <div className="text-2xl">✉️</div>
            <p className="text-sm text-[var(--text-primary)] font-medium">
              {t.login.sentTitle}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {t.login.sentBody(email)}
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2 mt-2"
            >
              {t.login.wrongEmail}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page — wraps LoginForm in Suspense so Next.js can prerender the shell ────

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[var(--accent)] opacity-[0.03] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative"
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-1">
            {t.login.title}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] tracking-widest uppercase">
            {t.login.subtitle}
          </p>
        </div>

        {/* Suspense lets Next.js prerender the shell; LoginForm hydrates client-side */}
        <Suspense fallback={<div className="card p-8 h-40" />}>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
