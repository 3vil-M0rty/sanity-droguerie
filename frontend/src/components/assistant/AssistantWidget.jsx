import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, X, Send, Square, RotateCcw, BookOpen } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { lastCompanyId } from "../../pages/purchasing/shared";
import s from "./AssistantWidget.module.css";

const STORE_KEY = "sanity.assistant.chat";
const readChat = () => { try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]"); } catch { return []; } };
const saveChat = (m) => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(m.slice(-30))); } catch { /* private mode */ } };

// Questions people ask on each screen.
const SUGGEST = [
  [/^\/dashboard/, ["dashCycle", "dashGmroi", "dashAbc"]],
  [/^\/stock\/articles/, ["artCreate", "artPhoto", "artSupplier"]],
  [/^\/stock\/levels/, ["lvlRestock", "lvlMin", "lvlTransfer"]],
  [/^\/stock/, ["stockCount", "stockTransfer", "stockCmup"]],
  [/^\/sales\/orders/, ["orderCreate", "orderCredit", "orderBl"]],
  [/^\/sales\/invoices/, ["invPay", "invCredit", "invGroup"]],
  [/^\/sales/, ["orderCreate", "salesLevels", "salesCollect"]],
  [/^\/pos/, ["posOpen", "posMixed", "posClose"]],
  [/^\/logistics/, ["logRound", "logBl", "orderBl"]],
  [/^\/purchasing/, ["purOrder", "purReceive", "purRequest"]],
  [/^\/hr|^\/me/, ["hrPayslip", "hrLeave", "hrPayroll"]],
  [/./, ["orderCreate", "artCreate", "rights"]],
];

/** Tiny, safe Markdown → React (headings, lists, bold, italics, code, in-app links). */
function inline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\(\/(?!\/)[a-z0-9\-/]*\))/gi; // in-app paths only: "(//host)" would leave the app
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) parts.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) parts.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("_")) parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
    else parts.push(<Fragment key={k}>(<Link to={tok.slice(1, -1)}>{tok.slice(1, -1)}</Link>)</Fragment>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Markdown({ text }) {
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push(list); list = null; } };
  text.split("\n").forEach((raw, idx) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || num) {
      const kind = bullet ? "ul" : "ol";
      if (!list || list.kind !== kind) { flush(); list = { kind, items: [], key: `l${idx}` }; }
      list.items.push(<li key={idx}>{inline((bullet || num)[1], `i${idx}`)}</li>);
      return;
    }
    flush();
    if (!line.trim()) return;
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) blocks.push(<h4 key={idx}>{inline(h[1], `h${idx}`)}</h4>);
    else blocks.push(<p key={idx}>{inline(line, `p${idx}`)}</p>);
  });
  flush();
  return blocks.map((b) => (b.kind ? (b.kind === "ul" ? <ul key={b.key}>{b.items}</ul> : <ol key={b.key}>{b.items}</ol>) : b));
}

/**
 * "Assistant Sanity": ask how to do anything in the platform. Answers
 * stream from the server (Claude, grounded in the user guide); without an
 * AI key on the server, the matching sections of the guide come back.
 * It knows the page you're on and what your account can access — not
 * your company's data.
 */
export default function AssistantWidget() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(readChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(""); // a data tool the assistant is using
  const abortRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { saveChat(messages); }, [messages]);
  useEffect(() => {
    if (!open || ai !== null) return;
    api.get("/assistant/status").then((r) => setAi(Boolean(r.data?.data?.ai))).catch(() => setAi(false));
  }, [open, ai]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages, open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    setError("");
    setInput("");
    const history = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const append = (text) => setMessages((m) => {
      const next = m.slice();
      next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + text };
      return next;
    });
    try {
      const res = await fetch(`${api.defaults.baseURL}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          page: { path: location.pathname, title: document.title },
          language,
          companyId: lastCompanyId() || undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || t("ng.assistant.error"));
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut;
        while ((cut = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          const event = block.match(/^event: (.*)$/m)?.[1];
          const data = block.match(/^data: (.*)$/m)?.[1];
          if (!event || !data) continue;
          const payload = JSON.parse(data);
          if (event === "delta") { setReading(""); append(payload.text); }
          if (event === "tool") setReading(payload.label);
          if (event === "done") setAi(payload.mode === "ai");
          if (event === "error") setError(payload.message);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || t("ng.assistant.error"));
    } finally {
      // drop an empty answer bubble (error / stop before any text)
      setMessages((m) => (m.length && m[m.length - 1].role === "assistant" && !m[m.length - 1].content ? m.slice(0, -1) : m));
      setBusy(false);
      setReading("");
      abortRef.current = null;
    }
  }, [busy, messages, location.pathname, language, t]);

  const stop = () => abortRef.current?.abort();
  const reset = () => { stop(); setMessages([]); setError(""); };
  const suggestions = (SUGGEST.find(([re]) => re.test(location.pathname)) || SUGGEST[SUGGEST.length - 1])[1];

  if (!user) return null;

  return (
    <>
      {!open && (
        <button type="button" className={s.fab} onClick={() => setOpen(true)} aria-label={t("ng.assistant.open")}>
          <Sparkles size={20} />
          <span>{t("ng.assistant.button")}</span>
        </button>
      )}
      {open && (
        <section className={s.panel} role="dialog" aria-label={t("ng.assistant.title")} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <header className={s.head}>
            <span className={s.logo}><Sparkles size={16} /></span>
            <div className={s.headText}>
              <strong>{t("ng.assistant.title")}</strong>
              <small>{ai === false ? <><BookOpen size={11} /> {t("ng.assistant.offline")}</> : t("ng.assistant.online")}</small>
            </div>
            {messages.length > 0 && <button type="button" className={s.iconBtn} onClick={reset} title={t("ng.assistant.reset")} aria-label={t("ng.assistant.reset")}><RotateCcw size={15} /></button>}
            <button type="button" className={s.iconBtn} onClick={() => setOpen(false)} title={t("ng.assistant.close")} aria-label={t("ng.assistant.close")}><X size={16} /></button>
          </header>

          <div className={s.list} ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <div className={s.welcome}>
                <p><strong>{t("ng.assistant.hello").replace("{name}", user.firstName || "")}</strong></p>
                <p>{t("ng.assistant.intro")}</p>
                <div className={s.chips}>
                  {suggestions.map((k) => (
                    <button key={k} type="button" className={s.chip} onClick={() => ask(t(`ng.assistant.q.${k}`))}>{t(`ng.assistant.q.${k}`)}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className={m.role === "user" ? s.user : s.bot}>
                {m.role === "user" ? m.content : (m.content ? <Markdown text={m.content} /> : <span className={s.typing}><i /><i /><i /></span>)}
              </div>
            ))}
            {reading && <div className={s.typing} style={{ fontSize: "0.78rem", opacity: 0.8 }}>{t("fx.assistant.reading").replace("{label}", reading)}</div>}
            {error && <div className={s.error}>{error}</div>}
          </div>

          <form className={s.form} onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <textarea ref={inputRef} rows={1} value={input} placeholder={t("ng.assistant.placeholder")} maxLength={4000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
            {busy
              ? <button type="button" className={s.send} onClick={stop} title={t("ng.assistant.stop")} aria-label={t("ng.assistant.stop")}><Square size={14} /></button>
              : <button type="submit" className={s.send} disabled={!input.trim()} title={t("ng.assistant.send")} aria-label={t("ng.assistant.send")}><Send size={15} /></button>}
          </form>
          <p className={s.note}>{t("ng.assistant.note")}</p>
        </section>
      )}
    </>
  );
}
