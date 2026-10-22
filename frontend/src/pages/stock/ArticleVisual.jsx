import {
  Droplet, ShowerHead, Bath, Toilet, Cylinder, Heater, Waves, Spline, Lightbulb, Cable, Plug, Zap, ToggleRight, Battery,
  PaintBucket, PaintRoller, Paintbrush, Layers, Nut, Lock, KeyRound, Drill, Ruler, Hammer, Wrench, SprayCan, Package, LampCeiling,
} from "lucide-react";
import { getInventoryIcon } from "../../utils/inventoryIcons";
import c from "./Catalog.module.css";

// Words in the article name → an illustration, when there's no photo.
const BY_WORD = [
  [/douche|shower/i, ShowerHead], [/mitigeur|robinet|mélangeur|vanne/i, Droplet], [/baignoire|receveur|bath/i, Bath],
  [/\bwc\b|cuvette|toilette|pack/i, Toilet], [/lavabo|vasque|évier/i, Waves], [/coude|té |raccord|manchon/i, Spline],
  [/tube|tuyau|ppr/i, Cylinder], [/chauffe|chaudière/i, Heater],
  [/ampoule|led|spot|lampe|réglette/i, Lightbulb], [/plafonnier|luminaire/i, LampCeiling], [/câble|fil |cable|couronne/i, Cable],
  [/prise/i, Plug], [/interrupteur|va-et-vient|bouton/i, ToggleRight], [/disjoncteur|différentiel|coffret|tableau/i, Battery],
  [/rouleau/i, PaintRoller], [/brosse|pinceau/i, Paintbrush], [/peinture|laque|vernis|acrylique|vinylique/i, PaintBucket],
  [/enduit|plâtre|ciment/i, Layers], [/silicone|mastic|colle|sikaflex/i, SprayCan], [/cheville|vis |boulon|écrou|clou/i, Nut],
  [/cylindre|serrure|cadenas/i, Lock], [/clé|cle /i, KeyRound], [/perceuse|visseuse|meuleuse/i, Drill], [/mètre|niveau|ruban/i, Ruler],
  [/marteau|burin/i, Hammer], [/pince|clé à|tournevis/i, Wrench], [/électr|volt|watt/i, Zap],
];

export function iconFor(article) {
  const name = String(article?.name || "");
  const hit = BY_WORD.find(([re]) => re.test(name));
  if (hit) return hit[1];
  return getInventoryIcon(article?.category?.icon) || Package;
}

/**
 * Photo of the article, or an illustrated tile in its family's colour.
 * Lists and cards only ever get the small thumbnail (`thumbnail` from the
 * list API); the full picture (`image.url`) is used on the article page
 * (size="full"). Always lazy-loaded.
 */
export default function ArticleVisual({ article, size = "card", color }) {
  const fam = color || article?.category?.color || "#4c8dff";
  const Icon = iconFor(article);
  const url = size === "full" ? article?.image?.url : article?.thumbnail || article?.image?.thumbUrl || "";
  return (
    <div className={`${c.visual} ${size === "small" ? c.small : size === "tiny" ? c.tiny : ""}`} style={{ "--fam": fam }}>
      {url ? (
        <img src={url} alt={article.name} loading="lazy" decoding="async" />
      ) : (
        <div className={c.placeholder}>
          <div className={c.placeholderInner}>
            <Icon size={size === "tiny" ? 18 : size === "small" ? 26 : 46} strokeWidth={1.6} />
            {(size === "card" || size === "full") && article?.brand?.name && <span>{article.brand.name}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
