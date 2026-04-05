import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send } from "lucide-react";
import type { Language } from "../types";
import { t } from "../i18n";

interface Props {
  lang: Language;
  onClose: () => void;
  onSignIn: (email: string) => Promise<{ error: string | null }>;
}

export function LoginSheet({ lang, onClose, onSignIn }: Props) {
  const tr = t(lang);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const result = await onSignIn(email.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sheet__handle" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
              {tr.ui.login}
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", padding: 4 }}>
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
              <Mail size={40} color="var(--tile)" strokeWidth={1.5} style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.5 }}>
                {tr.ui.check_email}
              </p>
              <p style={{ fontSize: 13, color: "#aaa", marginTop: 8 }}>{email}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#666" }}>
                {tr.ui.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--sand)",
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  background: "var(--cream)",
                  color: "var(--ink)",
                  outline: "none",
                  marginBottom: 12,
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--sun)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--sand)")}
              />
              {error && (
                <p style={{ fontSize: 13, color: "var(--terracotta)", marginBottom: 10 }}>{error}</p>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !email.trim()}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
              >
                <Send size={15} strokeWidth={2} />
                {tr.ui.send_magic_link}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
