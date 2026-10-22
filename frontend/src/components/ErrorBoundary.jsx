import { Component } from "react";
import { reportError } from "../utils/errorReporter";

/**
 * Catches a crash while drawing a page: instead of a blank screen the
 * user gets a short message and a reload button, and the error goes to
 * the platform's error monitoring.
 */
const TEXT = {
  fr: ["Cette page a rencontré un problème.", "L'erreur a été signalée automatiquement. Rechargez la page ; si le problème revient, contactez le support.", "Recharger la page", "Retour au tableau de bord"],
  en: ["This page ran into a problem.", "The error was reported automatically. Reload the page; if it happens again, contact support.", "Reload the page", "Back to the dashboard"],
  ar: ["واجهت هذه الصفحة مشكلة.", "تم الإبلاغ عن الخطأ تلقائياً. أعد تحميل الصفحة، وإذا تكرر الأمر اتصل بالدعم.", "إعادة تحميل الصفحة", "العودة إلى لوحة القيادة"],
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    let lang = "fr";
    try { lang = localStorage.getItem("language") || "fr"; } catch { /* default */ }
    const [title, body, reload, home] = TEXT[lang] || TEXT.fr;
    return (
      <div role="alert" style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24, color: "var(--color-text-primary)" }}>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>{title}</h1>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 18 }}>{body}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btnPrimary" onClick={() => window.location.reload()}>{reload}</button>
            <button type="button" className="btnEdit" onClick={() => { window.location.href = "/dashboard"; }}>{home}</button>
          </div>
        </div>
      </div>
    );
  }
}
