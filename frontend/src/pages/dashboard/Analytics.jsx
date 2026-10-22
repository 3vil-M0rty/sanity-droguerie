import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line, AreaChart, Area, ReferenceLine, LabelList,
} from "recharts";
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Info, Table2, BarChart3, ArrowRight, Timer, Gauge, TrendingUp, Coins } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useTheme } from "../../hooks/useTheme";
import { getAnalytics } from "../../services/negoceService";
import { formatMoney, formatDate, fmtQty, errorText } from "../negoce/common";
import { vizPalette, STATUS } from "./vizPalette";
import a from "./Analytics.module.css";

const fmtK = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3).toLocaleString("fr-FR")} k`;
  return Math.round(n).toLocaleString("fr-FR");
};
const pct = (v, d = 1) => (v === null || v === undefined ? "—" : `${Number(v).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`);
const monthLabel = (period, lang) => {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { month: "short" }).replace(".", "");
};
const TONE = {
  critical: { icon: AlertOctagon, color: STATUS.critical },
  warning: { icon: AlertTriangle, color: STATUS.warning },
  good: { icon: CheckCircle2, color: STATUS.good },
  info: { icon: Info, color: STATUS.info },
};

/** A chart card with a table-view twin (every value readable without hovering). */
function ChartCard({ title, subtitle, legend, table, children, wide = false, t }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`${a.card} ${wide ? a.wide : ""}`}>
      <header className={a.cardHead}>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {table && (
          <button type="button" className={a.viewToggle} onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} title={asTable ? t("ng.analytics.showChart") : t("ng.analytics.showTable")}>
            {asTable ? <BarChart3 size={14} /> : <Table2 size={14} />}
          </button>
        )}
      </header>
      {legend && !asTable && <div className={a.legend}>{legend}</div>}
      {asTable ? <div className={a.tableWrap}>{table}</div> : children}
    </section>
  );
}

function Tip({ active, payload, label, rows }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={a.tip}>
      <strong>{d.fullLabel || label}</strong>
      {rows(d).map(([k, v, color]) => (
        <div key={k} className={a.tipRow}>
          {color && <i style={{ background: color }} />}
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

const Swatch = ({ color, label }) => <span className={a.swatch}><i style={{ background: color }} />{label}</span>;

export default function Analytics({ companyId }) {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const pal = vizPalette(theme);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (fresh = false) => {
    if (!companyId) return;
    setLoading(true);
    try {
      setData(await getAnalytics(companyId, fresh));
      setError("");
    } catch (err) {
      setError(errorText(err, t, "sales.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);
  useEffect(() => { load(); }, [load]);

  const monthly = useMemo(() => (data?.monthly || []).map((m, i, arr) => ({
    ...m,
    label: monthLabel(m.period, language),
    fullLabel: `${monthLabel(m.period, language)} ${m.period.slice(0, 4)}${i === arr.length - 1 ? ` (${t("ng.analytics.inProgress")})` : ""}`,
    current: i === arr.length - 1,
  })), [data, language, t]);

  const rateData = monthly.filter((m) => m.marginRate !== null);

  if (error) return <div className="errorMessage">{error}</div>;
  if (!data) {
    return (
      <div className={a.wrap} aria-busy="true">
        <div className={a.sectionHead}><h2><Sparkles size={18} /> {t("ng.analytics.title")}</h2></div>
        <div className={a.grid}>{Array.from({ length: 4 }, (_, i) => <div key={i} className={a.skeleton} />)}</div>
      </div>
    );
  }

  const { projection: pr, cashCycle: cc, abc } = data;
  const margin12 = monthly.reduce((s, m) => s + m.margin, 0);
  const sales12 = monthly.reduce((s, m) => s + m.total, 0);
  const progress = pr.lastMonth ? Math.min(100, (pr.toDate / pr.lastMonth) * 100) : 0;
  const projectedPos = pr.lastMonth ? Math.min(100, (pr.projected / pr.lastMonth) * 100) : 0;
  const ccTotal = (cc.dio || 0) + (cc.dso || 0);

  return (
    <div className={`${a.wrap} ${loading ? a.stale : ""}`}>
      <div className={a.sectionHead}>
        <div>
          <h2><Sparkles size={18} /> {t("ng.analytics.title")}</h2>
          <p>{t("ng.analytics.subtitle")}</p>
        </div>
        <button type="button" className="btnEdit" onClick={() => load(true)} disabled={loading}><RefreshCw size={14} className={loading ? a.spin : ""} /> {t("ng.analytics.refresh")}</button>
      </div>

      {/* ---- insights */}
      {data.insights?.length > 0 && (
        <div className={a.insights}>
          {data.insights.slice(0, 6).map((x) => {
            const tone = TONE[x.tone] || TONE.info;
            const Icon = tone.icon;
            return (
              <Link key={x.kind} to={x.to || "#"} className={a.insight} style={{ "--tone": tone.color }}>
                <span className={a.insightIcon}><Icon size={16} /></span>
                <span className={a.insightBody}>
                  <span className={a.insightTone}>{t(`ng.analytics.tone.${x.tone}`)}</span>
                  <strong>{x.title}</strong>
                  <small>{x.detail}</small>
                </span>
                <ArrowRight size={14} className={a.insightGo} />
              </Link>
            );
          })}
        </div>
      )}

      {/* ---- hero tiles */}
      <div className={a.tiles}>
        <div className={a.tile}>
          <span className={a.tileLabel}><TrendingUp size={14} /> {t("ng.analytics.projection")}</span>
          <strong className={a.hero}>{formatMoney(pr.projected, "DH")}</strong>
          <span className={a.tileSub}>{t("ng.analytics.toDate")} {formatMoney(pr.toDate, "DH")} · {t("ng.analytics.dayOf").replace("{d}", pr.daysElapsed).replace("{n}", pr.daysInMonth)}</span>
          {pr.lastMonth > 0 && (
            <div className={a.progress} title={`${t("ng.analytics.lastMonth")} ${formatMoney(pr.lastMonth, "DH")}`}>
              <span className={a.progressFill} style={{ width: `${progress}%`, background: pal.series1 }} />
              <span className={a.progressMark} style={{ left: `${projectedPos}%` }} />
              <small>{t("ng.analytics.vsLastMonth")} {formatMoney(pr.lastMonth, "DH")} · {pct(((pr.projected - pr.lastMonth) / pr.lastMonth) * 100, 0)}</small>
            </div>
          )}
        </div>
        <div className={a.tile}>
          <span className={a.tileLabel}><Timer size={14} /> {t("ng.analytics.cashCycle")}</span>
          <strong className={a.hero}>{cc.days ?? "—"} <span>{t("ng.analytics.days")}</span></strong>
          <span className={a.tileSub}>{t("ng.analytics.cashCycleHint")}</span>
          {ccTotal > 0 && (
            <>
              <div className={a.split}>
                <span style={{ width: `${(cc.dio / ccTotal) * 100}%`, background: pal.series1 }} />
                <span style={{ width: `${(cc.dso / ccTotal) * 100}%`, background: pal.series2 }} />
              </div>
              <div className={a.splitLegend}>
                <Swatch color={pal.series1} label={`${t("ng.analytics.dio")} ${cc.dio} ${t("ng.analytics.daysShort")}`} />
                <Swatch color={pal.series2} label={`${t("ng.analytics.dso")} ${cc.dso} ${t("ng.analytics.daysShort")}`} />
              </div>
            </>
          )}
        </div>
        <div className={a.tile}>
          <span className={a.tileLabel}><Gauge size={14} /> GMROI</span>
          <strong className={a.hero}>{data.gmroi !== null ? data.gmroi.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</strong>
          <span className={a.tileSub}>{t("ng.analytics.gmroiHint")}</span>
          <span className={a.tileFoot}>{t("ng.stock.value")} {formatMoney(cc.stockValue, "DH")}</span>
        </div>
        <div className={a.tile}>
          <span className={a.tileLabel}><Coins size={14} /> {t("ng.analytics.margin12")}</span>
          <strong className={a.hero}>{formatMoney(margin12, "DH")}</strong>
          <span className={a.tileSub}>{pct(sales12 ? (margin12 / sales12) * 100 : null)} {t("ng.analytics.ofSales")} {formatMoney(sales12, "DH")}</span>
          <span className={a.tileFoot}>{t("ng.analytics.receivables")} {formatMoney(cc.receivables, "DH")}</span>
        </div>
      </div>

      <div className={a.grid}>
        {/* ---- 12 months of sales by channel */}
        <ChartCard wide t={t} title={t("ng.analytics.sales12")} subtitle={t("ng.analytics.sales12Hint")}
          legend={<><Swatch color={pal.series1} label={t("ng.analytics.b2b")} /><Swatch color={pal.series2} label={t("ng.analytics.counter")} /></>}
          table={(
            <table className={a.table}>
              <thead><tr><th>{t("ng.analytics.month")}</th><th>{t("ng.analytics.b2b")}</th><th>{t("ng.analytics.counter")}</th><th>{t("ng.analytics.total")}</th><th>{t("ng.common.margin")}</th><th>%</th></tr></thead>
              <tbody>{monthly.map((m) => <tr key={m.period}><td>{m.fullLabel}</td><td>{fmtK(m.b2b)}</td><td>{fmtK(m.counter)}</td><td>{fmtK(m.total)}</td><td>{fmtK(m.margin)}</td><td>{pct(m.marginRate)}</td></tr>)}</tbody>
            </table>
          )}>
          <div className={a.chart} style={{ height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={pal.grid} />
                <XAxis dataKey="label" tick={{ fill: pal.axis, fontSize: 11 }} axisLine={{ stroke: pal.grid }} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: pal.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip cursor={{ fill: "rgba(127,127,127,0.08)" }} content={<Tip rows={(d) => [
                  [t("ng.analytics.b2b"), formatMoney(d.b2b, "DH"), pal.series1],
                  [t("ng.analytics.counter"), formatMoney(d.counter, "DH"), pal.series2],
                  [t("ng.analytics.total"), formatMoney(d.total, "DH")],
                  [t("ng.common.margin"), `${formatMoney(d.margin, "DH")} · ${pct(d.marginRate)}`],
                ]} />} />
                <Bar dataKey="b2b" stackId="s" fill={pal.series1} stroke={pal.surface} strokeWidth={1}>
                  {monthly.map((m) => <Cell key={m.period} fillOpacity={m.current ? 0.45 : 1} />)}
                </Bar>
                <Bar dataKey="counter" stackId="s" fill={pal.series2} stroke={pal.surface} strokeWidth={1} radius={[4, 4, 0, 0]}>
                  {monthly.map((m) => <Cell key={m.period} fillOpacity={m.current ? 0.45 : 1} />)}
                  <LabelList dataKey="total" position="top" content={({ x, y, width, index }) => {
                    const m = monthly[index];
                    const best = monthly.reduce((b, v) => (v.total > b.total ? v : b), monthly[0]);
                    if (!m || (m.period !== best.period && !m.current)) return null;
                    return <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={pal.ink2} fontSize={11}>{m.current ? t("ng.analytics.inProgress") : fmtK(m.total)}</text>;
                  }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ---- margin rate (its own chart: no second axis) */}
        <ChartCard t={t} title={t("ng.analytics.marginRate")} subtitle={t("ng.analytics.marginRateHint")}
          table={(
            <table className={a.table}><thead><tr><th>{t("ng.analytics.month")}</th><th>%</th></tr></thead>
              <tbody>{monthly.map((m) => <tr key={m.period}><td>{m.fullLabel}</td><td>{pct(m.marginRate)}</td></tr>)}</tbody></table>
          )}>
          <div className={a.chart} style={{ height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateData} margin={{ top: 18, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={pal.grid} />
                <XAxis dataKey="label" tick={{ fill: pal.axis, fontSize: 11 }} axisLine={{ stroke: pal.grid }} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[(min) => Math.floor(min - 2), (max) => Math.ceil(max + 2)]} tickFormatter={(v) => `${Math.round(v)} %`} tick={{ fill: pal.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip cursor={{ stroke: pal.axis, strokeWidth: 1 }} content={<Tip rows={(d) => [[t("ng.analytics.marginRate"), pct(d.marginRate), pal.series1], [t("ng.common.margin"), formatMoney(d.margin, "DH")]]} />} />
                <Line type="linear" dataKey="marginRate" stroke={pal.series1} strokeWidth={2} isAnimationActive={false}
                  dot={{ r: 4, fill: pal.series1, stroke: pal.surface, strokeWidth: 2 }} activeDot={{ r: 6, fill: pal.series1, stroke: pal.surface, strokeWidth: 2 }}>
                  <LabelList dataKey="marginRate" content={({ x, y, index, value }) => (index === rateData.length - 1
                    ? <text x={x + 8} y={y + 4} fill={pal.ink} fontSize={11} fontWeight={700}>{pct(value)}</text> : null)} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ---- ABC / Pareto */}
        <ChartCard wide t={t} title={t("ng.analytics.abc")} subtitle={t("ng.analytics.abcHint").replace("{a}", abc.classes.A.count).replace("{n}", abc.articlesWithMargin)}
          table={(
            <table className={a.table}><thead><tr><th>#</th><th>{t("ng.articles.name")}</th><th>{t("ng.common.margin")}</th><th>%</th><th>{t("ng.analytics.class")}</th></tr></thead>
              <tbody>{abc.top.map((r, i) => <tr key={r._id}><td>{i + 1}</td><td>{r.name}</td><td>{fmtK(r.margin)}</td><td>{pct(r.share)}</td><td>{r.cls}</td></tr>)}</tbody></table>
          )}>
          <div className={a.abcLayout}>
            <div className={a.chart} style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={abc.curve} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke={pal.grid} />
                  <XAxis type="number" dataKey="articlesPct" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v) => `${v} %`} tick={{ fill: pal.axis, fontSize: 11 }} axisLine={{ stroke: pal.grid }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 50, 80, 100]} tickFormatter={(v) => `${v} %`} tick={{ fill: pal.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                  <ReferenceLine y={80} stroke={pal.axis} strokeWidth={1} label={{ value: t("ng.analytics.classA"), position: "insideBottomRight", fill: pal.ink2, fontSize: 11 }} />
                  <Tooltip cursor={{ stroke: pal.axis, strokeWidth: 1 }} content={<Tip rows={(d) => [[t("ng.analytics.articlesShare"), pct(d.articlesPct, 0)], [t("ng.analytics.marginShare"), pct(d.marginPct, 0), pal.series1]]} />} />
                  <Area type="monotone" dataKey="marginPct" stroke={pal.series1} strokeWidth={2} fill={pal.series1} fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={a.abcSide}>
              <div className={a.classes}>
                {["A", "B", "C"].map((k) => (
                  <div key={k} className={a.cls}>
                    <b>{k}</b>
                    <span>{abc.classes[k].count} {t("ng.catalog.articlesCount")}</span>
                    <small>{pct(abc.totalMargin ? (abc.classes[k].margin / abc.totalMargin) * 100 : 0, 0)} {t("ng.analytics.ofMargin")}</small>
                  </div>
                ))}
              </div>
              <ol className={a.top}>
                {abc.top.slice(0, 5).map((r) => (
                  <li key={r._id}><Link to={`/stock/articles/${r._id}`}>{r.name}</Link><span>{pct(r.share)}</span></li>
                ))}
              </ol>
            </div>
          </div>
        </ChartCard>

        {/* ---- families */}
        <ChartCard t={t} title={t("ng.analytics.families")} subtitle={t("ng.analytics.familiesHint")}
          table={(
            <table className={a.table}><thead><tr><th>{t("ng.articles.family")}</th><th>{t("ng.analytics.total")}</th><th>{t("ng.common.margin")}</th><th>%</th></tr></thead>
              <tbody>{data.families.map((f) => <tr key={f._id}><td>{f.name}</td><td>{fmtK(f.revenue)}</td><td>{fmtK(f.margin)}</td><td>{pct(f.marginRate)}</td></tr>)}</tbody></table>
          )}>
          <div className={a.chart} style={{ height: Math.max(160, data.families.length * 46 + 20) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.families} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 4 }} barCategoryGap="32%">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fill: pal.ink2, fontSize: 12 }} axisLine={false} tickLine={false} width={96} />
                <Tooltip cursor={{ fill: "rgba(127,127,127,0.08)" }} content={<Tip rows={(d) => [[t("ng.analytics.total"), formatMoney(d.revenue, "DH"), pal.series1], [t("ng.common.margin"), `${formatMoney(d.margin, "DH")} · ${pct(d.marginRate)}`]]} />} />
                <Bar dataKey="revenue" fill={pal.series1} radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="marginRate" position="right" content={({ x, y, width, height, value }) => <text x={x + width + 6} y={y + height / 2 + 4} fill={pal.ink2} fontSize={11}>{pct(value)}</text>} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ---- stock age (ordered buckets → ordinal ramp) */}
        <ChartCard t={t} title={t("ng.analytics.stockAge")} subtitle={t("ng.analytics.stockAgeHint")}
          table={(
            <table className={a.table}><thead><tr><th>{t("ng.analytics.lastSale")}</th><th>{t("ng.stock.value")}</th><th>%</th><th>{t("ng.catalog.articlesCount")}</th></tr></thead>
              <tbody>{data.stockAge.buckets.map((b) => <tr key={b.key}><td>{t(`ng.analytics.age.${b.key}`)}</td><td>{fmtK(b.value)}</td><td>{pct(b.share)}</td><td>{b.count}</td></tr>)}</tbody></table>
          )}>
          <div className={a.chart} style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockAge.buckets.map((b) => ({ ...b, label: t(`ng.analytics.age.${b.key}`) }))} layout="vertical" margin={{ top: 4, right: 56, left: 0, bottom: 4 }} barCategoryGap="28%">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{ fill: pal.ink2, fontSize: 12 }} axisLine={false} tickLine={false} width={104} />
                <Tooltip cursor={{ fill: "rgba(127,127,127,0.08)" }} content={<Tip rows={(d) => [[t("ng.stock.value"), formatMoney(d.value, "DH")], [t("ng.catalog.articlesCount"), fmtQty(d.count)]]} />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.stockAge.buckets.map((b, i) => <Cell key={b.key} fill={pal.stockAge[i]} />)}
                  <LabelList dataKey="share" content={({ x, y, width, height, value }) => <text x={x + width + 6} y={y + height / 2 + 4} fill={pal.ink2} fontSize={11}>{pct(value, 0)}</text>} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.stockAge.dormant.length > 0 && (
            <ul className={a.miniList}>
              {data.stockAge.dormant.slice(0, 3).map((d) => <li key={d._id}><Link to={`/stock/articles/${d._id}`}>{d.name}</Link><span>{formatMoney(d.value, "DH")}</span></li>)}
            </ul>
          )}
        </ChartCard>

        {/* ---- receivables aging (ordered buckets → ordinal ramp) */}
        <ChartCard t={t} title={t("ng.analytics.aging")} subtitle={t("ng.analytics.agingHint")}
          table={(
            <table className={a.table}><thead><tr><th>{t("ng.analytics.overdueBy")}</th><th>{t("ng.analytics.due")}</th><th>{t("ng.analytics.invoices")}</th></tr></thead>
              <tbody>{data.aging.map((b) => <tr key={b.key}><td>{t(`ng.analytics.agingBucket.${b.key}`)}</td><td>{formatMoney(b.amount, "DH")}</td><td>{b.count}</td></tr>)}</tbody></table>
          )}>
          <div className={a.chart} style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.aging.map((b) => ({ ...b, label: t(`ng.analytics.agingBucket.${b.key}`) }))} margin={{ top: 18, right: 8, left: 0, bottom: 0 }} barCategoryGap="26%">
                <CartesianGrid vertical={false} stroke={pal.grid} />
                <XAxis dataKey="label" tick={{ fill: pal.axis, fontSize: 11 }} axisLine={{ stroke: pal.grid }} tickLine={false} interval={0} />
                <YAxis tickFormatter={fmtK} tick={{ fill: pal.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip cursor={{ fill: "rgba(127,127,127,0.08)" }} content={<Tip rows={(d) => [[t("ng.analytics.due"), formatMoney(d.amount, "DH")], [t("ng.analytics.invoices"), d.count]]} />} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {data.aging.map((b, i) => <Cell key={b.key} fill={pal.aging[i]} />)}
                  <LabelList dataKey="amount" content={({ x, y, width, value }) => (value > 0 ? <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={pal.ink2} fontSize={11}>{fmtK(value)}</text> : null)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ---- stockouts */}
        <section className={a.card}>
          <header className={a.cardHead}>
            <div>
              <h3>{t("ng.analytics.stockouts")}</h3>
              <p>{t("ng.analytics.stockoutsHint").replace("{n}", data.stockoutCount)}</p>
            </div>
          </header>
          {data.stockouts.length === 0 ? <p className={a.empty}><CheckCircle2 size={16} style={{ color: STATUS.good }} /> {t("ng.analytics.noStockout")}</p> : (
            <ul className={a.stockouts}>
              {data.stockouts.map((s) => (
                <li key={s._id}>
                  <Link to={`/stock/articles/${s._id}`} className={a.soName}>{s.name}</Link>
                  <span className={a.soBar}><span style={{ width: `${Math.max(4, (s.days / 21) * 100)}%`, background: s.days <= 7 ? STATUS.critical : STATUS.warning }} /></span>
                  <span className={a.soDays}>{s.days} {t("ng.analytics.daysShort")}</span>
                  <small>{fmtQty(s.quantity)} {s.unit} · {fmtQty(s.perDay)}/{t("ng.analytics.daysShort")} · {t("ng.analytics.outOn")} {formatDate(s.date)}{s.reorder > 0 ? ` · ${t("ng.analytics.reorder")} ${fmtQty(s.reorder)}` : ""}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- reps vs target */}
        {data.reps.length > 0 && (
          <section className={a.card}>
            <header className={a.cardHead}>
              <div>
                <h3>{t("ng.analytics.reps")}</h3>
                <p>{t("ng.analytics.repsHint")}</p>
              </div>
            </header>
            <ul className={a.reps}>
              {data.reps.map((r) => {
                const max = Math.max(r.target, r.projected, r.sales, 1);
                return (
                  <li key={r._id}>
                    <div className={a.repHead}><strong>{r.name}</strong><span>{formatMoney(r.sales, "DH")}{r.target ? ` / ${fmtK(r.target)}` : ""}</span></div>
                    <div className={a.bullet}>
                      <span className={a.bulletProj} style={{ width: `${(r.projected / max) * 100}%`, background: pal.series1 }} />
                      <span className={a.bulletDone} style={{ width: `${(r.sales / max) * 100}%`, background: pal.series1 }} />
                      {r.target > 0 && <span className={a.bulletTarget} style={{ left: `${(r.target / max) * 100}%` }} title={t("ng.analytics.target")} />}
                    </div>
                    <small>{t("ng.analytics.projectedShort")} {formatMoney(r.projected, "DH")}{r.target ? ` · ${pct((r.projected / r.target) * 100, 0)} ${t("ng.analytics.ofTarget")}` : ""}</small>
                  </li>
                );
              })}
            </ul>
            <div className={a.legend}><Swatch color={pal.series1} label={t("ng.analytics.done")} /><span className={a.swatch}><i style={{ background: pal.series1, opacity: 0.3 }} />{t("ng.analytics.projectedShort")}</span><span className={a.swatch}><i className={a.targetSwatch} />{t("ng.analytics.target")}</span></div>
          </section>
        )}
      </div>
      <p className={a.asOf}>{t("ng.analytics.asOf")} {new Date(data.asOf).toLocaleString(language === "en" ? "en-GB" : "fr-FR")}</p>
    </div>
  );
}
