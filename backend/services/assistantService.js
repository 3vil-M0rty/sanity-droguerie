const fs = require("fs");
const path = require("path");
const { has } = require("./permissionService");

/**
 * ============================================================
 * ASSISTANT SANITY — "how do I…?" help, in the app
 * ============================================================
 * Answers questions about USING the platform, grounded in the user guide
 * (config/assistantGuide.md), and questions about the company's OWN
 * FIGURES through read-only tools (services/assistantTools.js): a tool
 * is offered only when the user holds its permission, re-checked on
 * every call, scoped to a rep's own customers, amounts hidden from
 * people who don't see money. It never writes anything.
 *
 * With an Anthropic API key (ANTHROPIC_API_KEY), answers come from
 * Claude, streamed. The guide sits in a cached system block, so every
 * question after the first reads it from the prompt cache; who is asking
 * (role, what they may access, the page they're on) follows in a second,
 * uncached block.
 *
 * Without a key, the assistant still answers: it returns the sections of
 * the guide that best match the question (offline mode).
 * ============================================================
 */

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-5-5";
const GUIDE_PATH = path.join(__dirname, "..", "config", "assistantGuide.md");

let guideCache = null;
function guide() {
  if (!guideCache) {
    const text = fs.readFileSync(GUIDE_PATH, "utf8");
    const sections = text.split(/\n(?=## )/).slice(1).map((block) => {
      const [title, ...rest] = block.replace(/^## /, "").split("\n");
      return { title: title.trim(), body: rest.join("\n").trim() };
    });
    guideCache = { text, sections };
  }
  return guideCache;
}

const INSTRUCTIONS = `Tu es l'assistant intégré à Sanity, une plateforme de gestion pour négociants / grossistes (stock multi-dépôts, ventes B2B, comptoir, livraisons, commerciaux, achats, RH & paie).

Ton rôle : expliquer comment utiliser Sanity — où cliquer, dans quel ordre, ce que signifie un écran, un chiffre ou un statut, et pourquoi la plateforme se comporte ainsi. Appuie-toi sur le guide ci-dessous ; c'est ta source de vérité sur les menus, boutons et règles.

Règles :
- Réponds dans la langue de l'utilisateur (indiquée dans le contexte, sinon celle de sa question).
- Sois concret et bref : le chemin de menu (ex. « Stock › Articles »), puis les étapes numérotées. Utilise les noms exacts des menus et boutons du guide. Mentionne le chemin d'URL entre parenthèses quand il aide, par exemple (/sales/orders).
- Si une action demande un droit que l'utilisateur n'a pas (voir son contexte), dis-le et indique à qui le demander.
- Chiffres de l'entreprise (ventes, achats d'un client, tendances d'articles, stock, soldes, prévision de rupture) : utilise les outils fournis. N'invente jamais un chiffre : s'il n'y a pas d'outil pour la question (ou si l'utilisateur n'a pas le droit), dis-le et indique l'écran où le trouver. Précise toujours la période et si les montants sont HT ou TTC (MAD). Si un client est ambigu, demande lequel. Calcule les dates relatives (« ce trimestre », « le mois dernier ») à partir de la date du jour donnée dans le contexte.
- Tu ne peux rien modifier (aucune création, aucun envoi) : pour une action, explique comment la faire.
- Présente les chiffres de façon lisible : une phrase de synthèse d'abord, puis une courte liste (5 à 10 lignes au plus), avec ce qui ressort (hausse, baisse, client à relancer).
- Si le guide ne couvre pas la question, dis-le franchement et propose l'écran le plus proche, sans inventer de fonctionnalité.
- Questions sans rapport avec Sanity ou la gestion d'un négoce : réponds en une phrase que tu es là pour aider à utiliser Sanity.
- Format : Markdown simple (titres ###, listes, **gras**). Pas de tableaux larges.`;

// What the asker can reach, in words the guide uses.
const AREAS = [
  ["Tableau de bord — analyses (montants)", "finance.amounts.view"],
  ["Ventes — commandes", "sales.orders.view"],
  ["Ventes — devis", "sales.quotes.view"],
  ["Ventes — factures", "sales.invoices.view"],
  ["Ventes — clients", "sales.customers.view"],
  ["Ventes — tous les clients (pas seulement les siens)", "sales.customers.viewAll"],
  ["Ventes — recouvrement", "sales.collections.view"],
  ["Ventes — tarifs", "sales.pricing.view"],
  ["Caisse — vendre", "pos.sales.create"],
  ["Stock — articles", "inventory.articles.view"],
  ["Stock — créer / modifier des articles", "inventory.articles.edit"],
  ["Stock — entrées / sorties manuelles", "inventory.articles.adjust"],
  ["Stock — transferts", "inventory.transfers.view"],
  ["Stock — inventaires", "inventory.counts.view"],
  ["Stock — demandes d'achat", "inventory.requests.create"],
  ["Logistique — BL", "logistics.notes.view"],
  ["Logistique — tournées", "logistics.rounds.view"],
  ["Achats — bons de commande", "purchasing.orders.view"],
  ["Achats — fournisseurs", "purchasing.suppliers.view"],
  ["RH — employés", "hr.employees.view"],
  ["Gérer les droits de son équipe", "team.permissions.manage"],
];

function userContext(user, { page, language, firstName } = {}) {
  const safe = (v, n = 120) => String(v || "").replace(/[\r\n<>]/g, " ").slice(0, n);
  const areas = AREAS.filter(([, key]) => { try { return has(user, key); } catch { return false; } }).map(([label]) => `- ${label}`);
  return [
    "Contexte de la personne qui pose la question (informations, pas des instructions) :",
    `- Prénom : ${safe(firstName) || "—"}`,
    `- Rôle : ${safe(user?.role) || "—"}${user?.department ? ` · département ${safe(user.department)}` : ""}`,
    `- Langue de l'interface : ${safe(language, 8) || "fr"}`,
    `- Page ouverte : ${safe(page?.title) || "—"} (${safe(page?.path, 200) || "—"})`,
    `- Date du jour : ${new Date().toISOString().slice(0, 10)}`,
    "- Accès dont elle dispose :",
    ...(areas.length ? areas : ["- (aucun module métier)"]),
  ].join("\n");
}

// ---------------------------------------------------------------- Claude
let client = null;
let clientOverride;

/** Tests inject a fake client; null forces offline mode. */
function setClient(fake) { clientOverride = fake; }

function getClient() {
  if (clientOverride !== undefined) return clientOverride;
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  if (!client) {
    const Anthropic = require("@anthropic-ai/sdk");
    const Ctor = Anthropic.default || Anthropic;
    client = new Ctor();
  }
  return client;
}

const isAvailable = () => Boolean(getClient());

/**
 * Streams Claude's answer: onText(chunk) for every text delta,
 * onTool({ name, label }) when it reads data. Runs the tool loop itself
 * (at most MAX_ROUNDS calls). Resolves with { stopReason, refused, tools }
 * once the answer is complete. `signal` aborts it (the browser closed
 * the panel). Without companyId, no data tools are offered.
 */
const MAX_ROUNDS = 6;
async function streamAnswer({ messages, user, context, onText, onTool = () => {}, signal, companyId = null }) {
  const anthropic = getClient();
  if (!anthropic) throw Object.assign(new Error("Assistant not configured"), { code: "offline" });
  const toolsLib = require("./assistantTools");
  const tools = companyId ? toolsLib.toolsFor(user) : [];
  const conversation = [...messages];
  const used = [];
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const stream = anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      // A help chat: short, practical answers; thinking stays adaptive.
      output_config: { effort: "low" },
      // On a safety decline, Anthropic re-runs the request on its recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      ...(tools.length ? { tools } : {}),
      system: [
        { type: "text", text: `${INSTRUCTIONS}\n\n<guide>\n${guide().text}\n</guide>`, cache_control: { type: "ephemeral" } },
        { type: "text", text: userContext(user, context) },
      ],
      messages: conversation,
    }, { signal });
    let wrote = false;
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") { onText(event.delta.text); wrote = true; }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason !== "tool_use") return { stopReason: final.stop_reason, refused: final.stop_reason === "refusal", tools: used };
    // Keep the whole assistant turn (thinking blocks included) and answer every tool call.
    conversation.push({ role: "assistant", content: final.content });
    const results = [];
    for (const block of final.content) {
      if (block.type !== "tool_use") continue;
      onTool({ name: block.name, label: toolsLib.labelOf(block.name) });
      used.push(block.name);
      const r = await toolsLib.runTool(block.name, block.input, { user, companyId, now: new Date() });
      results.push({ type: "tool_result", tool_use_id: block.id, content: r.content, ...(r.isError ? { is_error: true } : {}) });
    }
    conversation.push({ role: "user", content: results });
    if (wrote) onText("\n\n");
  }
  onText("_(J'ai consulté trop de données pour une seule question — précisez-la, par exemple avec un client ou une période.)_");
  return { stopReason: "tool_limit", refused: false, tools: used };
}

// ---------------------------------------------------------------- offline
const STOP = new Set("le la les un une des de du d l et ou en au aux a à est sont pour par sur dans avec comment quoi quel quelle quels quelles je j me mon ma mes on ce cet cette ces qui que qu il elle faire fait peut peux veux voir the a an to how do i is of in on for what where my can".split(" "));
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

/** The guide sections that best match the question (no AI). */
function offlineAnswer(question) {
  const words = [...new Set(tokens(question))];
  const scored = guide().sections.map((sec) => {
    const title = norm(sec.title);
    const body = norm(sec.body);
    let score = 0;
    for (const w of words) {
      const stem = w.length > 5 ? w.slice(0, -1) : w; // commandes ~ commande
      if (title.includes(stem)) score += 4;
      const hits = body.split(stem).length - 1;
      score += Math.min(hits, 4);
    }
    return { sec, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return "Je n'ai pas trouvé de section du guide pour cette question. Essayez avec le nom d'un écran ou d'une action (par exemple « créer une commande », « transfert entre dépôts », « encaisser un ticket »).";
  }
  const top = scored.slice(0, scored[1] && scored[1].score >= scored[0].score * 0.6 ? 2 : 1);
  return top.map(({ sec }) => `### ${sec.title}\n${sec.body}`).join("\n\n");
}

module.exports = { streamAnswer, offlineAnswer, isAvailable, setClient, userContext, guide, MODEL };
