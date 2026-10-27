/**
 * Demo pictures for the droguerie seed: one square image per article family
 * (a lucide icon — ISC licence — on the family colour, shade varied per article)
 * and the shop logo. Drawn as SVG and turned into PNG with sharp, then stored
 * like any uploaded photo (services/storageService.js → Cloudinary when configured).
 * No text in the pictures: they render the same on any server, fonts or not.
 */
const FAMILIES = {"Peinture":{"a":"#c2410c","b":"#fb923c","node":[["path",{"d":"M11 7 6 2"}],["path",{"d":"M18.992 12H2.041"}],["path",{"d":"M21.145 18.38A3.34 3.34 0 0 1 20 16.5a3.3 3.3 0 0 1-1.145 1.88c-.575.46-.855 1.02-.855 1.595A2 2 0 0 0 20 22a2 2 0 0 0 2-2.025c0-.58-.285-1.13-.855-1.595"}],["path",{"d":"m8.5 4.5 2.148-2.148a1.205 1.205 0 0 1 1.704 0l7.296 7.296a1.205 1.205 0 0 1 0 1.704l-7.592 7.592a3.615 3.615 0 0 1-5.112 0l-3.888-3.888a3.615 3.615 0 0 1 0-5.112L5.67 7.33"}]]},"Quincaillerie":{"a":"#475569","b":"#94a3b8","node":[["path",{"d":"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"}],["circle",{"cx":"12","cy":"12","r":"4"}]]},"Plomberie":{"a":"#0369a1","b":"#38bdf8","node":[["path",{"d":"m4 4 2.5 2.5"}],["path",{"d":"M13.5 6.5a4.95 4.95 0 0 0-7 7"}],["path",{"d":"M15 5 5 15"}],["path",{"d":"M14 17v.01"}],["path",{"d":"M10 16v.01"}],["path",{"d":"M13 13v.01"}],["path",{"d":"M16 10v.01"}],["path",{"d":"M11 20v.01"}],["path",{"d":"M17 14v.01"}],["path",{"d":"M20 11v.01"}]]},"Électricité":{"a":"#a16207","b":"#facc15","node":[["path",{"d":"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"}],["path",{"d":"M9 18h6"}],["path",{"d":"M10 22h4"}]]},"Entretien":{"a":"#047857","b":"#34d399","node":[["path",{"d":"M3 3h.01"}],["path",{"d":"M7 5h.01"}],["path",{"d":"M11 7h.01"}],["path",{"d":"M3 7h.01"}],["path",{"d":"M7 9h.01"}],["path",{"d":"M3 11h.01"}],["rect",{"width":"4","height":"4","x":"15","y":"5"}],["path",{"d":"m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2"}],["path",{"d":"m13 14 8-2"}],["path",{"d":"m13 19 8-2"}]]},"Outillage":{"a":"#7c2d12","b":"#f97316","node":[["path",{"d":"m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"}],["path",{"d":"m18 15 4-4"}],["path",{"d":"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"}]]},"logo":{"a":"#1e3a8a","b":"#3b82f6","node":[["path",{"d":"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}],["path",{"d":"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"}],["path",{"d":"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}]]}};

const attrs = (o) => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${v}"`).join(" ");

function svg(family, variant = 0) {
  const f = FAMILIES[family] || FAMILIES.Quincaillerie;
  const tilt = ((variant * 37) % 30) - 15;
  const shapes = f.node.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f.b}"/><stop offset="1" stop-color="${f.a}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="${620 - (variant % 5) * 40}" cy="${170 + (variant % 3) * 30}" r="${150 + (variant % 4) * 20}" fill="#fff" opacity="0.10"/>
  <circle cx="400" cy="400" r="250" fill="#fff" opacity="0.94"/>
  <g transform="translate(400 400) rotate(${tilt}) scale(13) translate(-12 -12)" fill="none" stroke="${f.a}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>
</svg>`;
}

/** PNG picture of an article of this family (variant: the article index, for a little variety). */
async function articlePicture(family, variant) {
  return require("sharp")(Buffer.from(svg(family, variant))).png().toBuffer();
}

/** PNG logo of the demo shop. */
async function shopLogo() {
  return require("sharp")(Buffer.from(svg("logo", 0))).png().toBuffer();
}

module.exports = { articlePicture, shopLogo, FAMILIES };
