import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "wouter";
import GjsEditor from "@grapesjs/react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { isDynamicCatalogueAttributes, normalizeBuilderHref, sanitizeBuilderAlt } from "@/lib/visualBuilderSafety";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Copy, CopyPlus, Eye, EyeOff, ImagePlus, Layers3, Lock, LockKeyhole, Palette, Plus, Redo2, Save, Sparkles, Trash2, Type, Undo2, Unlock, Video, Wand2 } from "lucide-react";

type BuilderMode = "blank" | "theme" | "clone";
type ImageRole = "free" | "logo" | "banner" | "category";
type BuilderPageSettings = { language: string; description: string; socialCoverUrl: string; faviconUrl: string };
type BuilderPage = { id: string; title: string; slug: string; project: { components?: unknown; styles?: unknown }; settings?: BuilderPageSettings };
type ReusableBuilderComponent = { id: string; name: string; html: string };
type BuilderReviewComment = { id: string; pageId: string; text: string; createdAt: string; resolved: boolean };

const defaultBuilderPage: BuilderPage = { id: "home", title: "Accueil", slug: "/", project: {} };

const modes: Array<{ id: BuilderMode; title: string; eyebrow: string; description: string; icon: typeof Plus; tone: string; steps: string[] }> = [
  { id: "blank", title: "Créer de zéro", eyebrow: "Page vierge", description: "Construisez une boutique à partir d’une structure propre, puis ajoutez progressivement vos sections, images, produits et boutons.", icon: Plus, tone: "violet", steps: ["Choisir une structure de départ", "Ajouter des sections et des blocs", "Personnaliser l’identité visuelle", "Prévisualiser avant publication"] },
  { id: "theme", title: "Modifier un thème", eyebrow: "Base MAZIGHO", description: "Partez d’un thème réutilisable comme Atelier Urbain, Clean Beauty ou Editorial lumineux et adaptez chaque élément.", icon: Palette, tone: "orange", steps: ["Sélectionner un thème", "Choisir la boutique concernée", "Modifier les blocs visuels", "Conserver ou créer une variante"] },
  { id: "clone", title: "Transformer une boutique clonée", eyebrow: "Import contrôlé", description: "Utilisez la structure extraite par le Cloner comme point de départ, puis remplacez les visuels, les textes et les éléments de marque.", icon: CopyPlus, tone: "teal", steps: ["Sélectionner un import terminé", "Convertir la structure en blocs", "Remplacer les contenus de démonstration", "Valider l’aperçu privé"] },
];

const toneClasses: Record<string, { card: string; icon: string; button: string }> = {
  violet: { card: "border-violet-200 bg-violet-50/60", icon: "bg-violet-100 text-violet-800", button: "bg-violet-700 hover:bg-violet-800" },
  orange: { card: "border-orange-200 bg-orange-50/60", icon: "bg-orange-100 text-orange-800", button: "bg-orange-700 hover:bg-orange-800" },
  teal: { card: "border-teal-200 bg-teal-50/60", icon: "bg-teal-100 text-teal-800", button: "bg-teal-700 hover:bg-teal-800" },
};

const editorBlocks = [
  { id: "mazigho-hero", label: "Hero MAZIGHO", category: "MAZIGHO", content: `<section style="padding:72px 32px;background:#172033;color:#fff;text-align:center"><p style="letter-spacing:.18em;text-transform:uppercase;color:#f5b98f">Votre univers</p><h1 style="font-size:42px;margin:14px 0">Une histoire à construire</h1><p style="max-width:560px;margin:0 auto 22px;opacity:.8">Présentez votre marque avec une composition claire, élégante et responsive.</p><a href="#" style="display:inline-block;padding:12px 20px;background:#fff;color:#172033;border-radius:8px;text-decoration:none">Découvrir</a></section>` },
  { id: "mazigho-image", label: "Image autonome", category: "MAZIGHO", content: `<figure style="margin:0;padding:24px;text-align:center"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Crect width='1200' height='700' fill='%23e9e2d9'/%3E%3Ccircle cx='600' cy='300' r='120' fill='%23c9b7a2'/%3E%3Cpath d='M0 560 Q300 380 600 560 T1200 560 V700 H0Z' fill='%23b5c3bd'/%3E%3Ctext x='600' y='620' text-anchor='middle' font-family='Arial' font-size='34' fill='%23343b42'%3EVotre image%3C/text%3E%3C/svg%3E" alt="Image de démonstration à remplacer" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:14px" /></figure>` },
  { id: "mazigho-image-text", label: "Image + texte", category: "MAZIGHO", content: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;padding:48px 28px"><div style="height:260px;background:linear-gradient(135deg,#ead9c9,#b9c8c7);border-radius:14px"></div><div><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Bloc éditorial</p><h2 style="font-size:30px;margin:10px 0">Racontez votre sélection</h2><p style="line-height:1.7;color:#4b5563">Remplacez cette image et ce texte par les contenus propres à votre boutique.</p></div></section>` },
  { id: "mazigho-products", label: "Grille produits", category: "MAZIGHO", content: `<section style="padding:42px 28px"><h2 style="font-size:28px;margin-bottom:20px">Sélection du moment</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><article><div style="height:180px;background:#e7e4df;border-radius:10px"></div><h3>Produit exemple</h3><p>49,00 CHF</p></article><article><div style="height:180px;background:#d9e1df;border-radius:10px"></div><h3>Produit exemple</h3><p>69,00 CHF</p></article><article><div style="height:180px;background:#ded8d1;border-radius:10px"></div><h3>Produit exemple</h3><p>89,00 CHF</p></article></div></section>` },
  { id: "mazigho-banner", label: "Bannière image", category: "MAZIGHO · Image", content: `<section style="padding:54px 28px;background:#f2eee9;text-align:center"><h2 style="font-size:30px">Un message important pour votre boutique</h2><p style="color:#4b5563">Ajoutez une campagne, une collection ou une promesse de marque.</p></section>` },
  { id: "mazigho-heading", label: "Titre + introduction", category: "MAZIGHO · Contenu", content: `<section style="padding:42px 28px;text-align:center"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.16em;font-size:12px">Votre sélection</p><h2 style="font-size:34px;margin:10px 0">Un titre qui attire l’attention</h2><p style="max-width:620px;margin:0 auto;color:#5b6470;line-height:1.7">Présentez une collection, une histoire ou une promesse en quelques mots clairs.</p></section>` },
  { id: "mazigho-button-row", label: "Boutons d’action", category: "MAZIGHO · Conversion", content: `<section style="padding:28px;text-align:center"><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px"><a href="#" style="display:inline-block;padding:13px 22px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Découvrir la collection</a><a href="#" style="display:inline-block;padding:13px 22px;border:1px solid #172033;color:#172033;border-radius:8px;text-decoration:none;font-weight:600">En savoir plus</a></div></section>` },
  { id: "mazigho-testimonial", label: "Témoignage client", category: "MAZIGHO · Conversion", content: `<section style="padding:48px 28px;background:#faf8f5;text-align:center"><blockquote style="max-width:680px;margin:0 auto;font-size:24px;line-height:1.5;color:#172033">“Une expérience simple, élégante et pensée avec soin.”</blockquote><p style="margin:18px 0 0;color:#a45f46;font-weight:700">— Prénom du client</p></section>` },
  { id: "mazigho-newsletter", label: "Inscription newsletter", category: "MAZIGHO · Conversion", content: `<section style="padding:48px 28px;background:#172033;color:#fff;text-align:center"><h2 style="font-size:28px;margin:0 0 10px">Restez informé</h2><p style="max-width:520px;margin:0 auto 22px;opacity:.8">Recevez les nouveautés et les sélections de votre boutique.</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px"><input type="email" placeholder="Votre adresse e-mail" style="min-height:44px;width:280px;padding:0 14px;border:0;border-radius:8px" /><button type="button" style="min-height:44px;padding:0 18px;background:#f5b98f;color:#172033;border:0;border-radius:8px;font-weight:700">S’inscrire</button></div></section>` },
  { id: "mazigho-spacer", label: "Espaceur", category: "MAZIGHO · Mise en page", content: `<div style="height:48px" data-mazigho-spacer="true"></div>` },
  { id: "mazigho-faq", label: "FAQ", category: "MAZIGHO · Contenu", content: `<section style="padding:48px 28px;background:#fff"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Besoin d’aide ?</p><h2 style="font-size:30px;margin:10px 0 24px">Questions fréquentes</h2><div style="max-width:820px;margin:0 auto"><details style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Quels sont les délais de livraison ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Ajoutez ici une réponse claire et utile pour vos clients.</p></details><details style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Comment choisir la bonne option ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Présentez vos conseils, garanties ou conditions.</p></details><details style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Puis-je vous contacter ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Indiquez le canal de contact privilégié de votre boutique.</p></details></div></section>` },
  { id: "mazigho-category-grid", label: "Grille de catégories", category: "MAZIGHO · Catalogue", content: `<section style="padding:48px 28px"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Explorer</p><h2 style="font-size:30px;margin:10px 0 24px">Nos catégories</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px"><a href="#" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#ead9c9;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 1</h3></a><a href="#" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#d9e1df;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 2</h3></a><a href="#" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#e4d9df;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 3</h3></a><a href="#" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#ded8d1;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 4</h3></a></div></section>` },
  { id: "mazigho-promo-bar", label: "Bandeau promotionnel", category: "MAZIGHO · Conversion", content: `<section style="padding:18px 24px;background:#f5b98f;color:#172033;text-align:center"><p style="margin:0;font-size:14px;font-weight:700">Une attention spéciale pour votre prochaine commande · <a href="#" style="color:#172033;text-decoration:underline">Découvrir l’offre</a></p></section>` },
  { id: "mazigho-trust-row", label: "Réassurance", category: "MAZIGHO · Conversion", content: `<section style="padding:30px 24px;border-top:1px solid #e5e1dc;border-bottom:1px solid #e5e1dc"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:center"><div><strong style="display:block;color:#172033">Livraison suivie</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Une expérience claire de la commande à la réception.</span></div><div><strong style="display:block;color:#172033">Paiement sécurisé</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Des moyens de paiement adaptés à votre boutique.</span></div><div><strong style="display:block;color:#172033">Service attentionné</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Une réponse humaine lorsque vous en avez besoin.</span></div></div></section>` },
  { id: "mazigho-steps", label: "Étapes en 3 points", category: "MAZIGHO · Contenu", content: `<section style="padding:52px 28px;background:#faf8f5"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Notre méthode</p><h2 style="font-size:30px;margin:10px 0 26px">Pensé pour vous accompagner</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px"><article style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">01</strong><h3 style="margin:12px 0 8px">Choisir</h3><p style="margin:0;color:#5b6470;line-height:1.6">Explorez la sélection et trouvez ce qui vous correspond.</p></article><article style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">02</strong><h3 style="margin:12px 0 8px">Personnaliser</h3><p style="margin:0;color:#5b6470;line-height:1.6">Composez votre expérience avec des détails qui comptent.</p></article><article style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">03</strong><h3 style="margin:12px 0 8px">Recevoir</h3><p style="margin:0;color:#5b6470;line-height:1.6">Suivez chaque étape jusqu’à votre prochaine découverte.</p></article></div></section>` },
  { id: "mazigho-stats", label: "Chiffres clés", category: "MAZIGHO · Marque", content: `<section style="padding:42px 28px;background:#172033;color:#fff"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center"><div><strong style="display:block;font-size:30px;color:#f5b98f">10+</strong><span style="font-size:12px;opacity:.75">années d’expertise</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">98%</strong><span style="font-size:12px;opacity:.75">clients satisfaits</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">24h</strong><span style="font-size:12px;opacity:.75">pour vous répondre</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">100%</strong><span style="font-size:12px;opacity:.75">sélection soignée</span></div></div></section>` },
  { id: "mazigho-footer", label: "Pied de page éditorial", category: "MAZIGHO · Mise en page", content: `<footer style="padding:42px 28px;background:#f2eee9;color:#172033"><div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:24px"><div><h2 style="margin:0 0 10px;font-size:24px">Votre marque</h2><p style="margin:0;max-width:360px;color:#5b6470;line-height:1.6">Une signature éditoriale claire, avec les informations essentielles à portée de main.</p></div><div><strong>Explorer</strong><a href="/boutique" style="display:block;margin-top:12px;color:#5b6470;text-decoration:none">La boutique</a><a href="/contact" style="display:block;margin-top:8px;color:#5b6470;text-decoration:none">Contact</a></div><div><strong>Suivez-nous</strong><p style="margin:12px 0 0;color:#5b6470">Instagram · Pinterest · Newsletter</p></div></div><p style="margin:30px 0 0;border-top:1px solid #d8d0c7;padding-top:18px;color:#7a7168;font-size:12px">© Votre marque · Tous droits réservés</p></footer>` },
  { id: "mazigho-seo-editorial", label: "Texte éditorial SEO", category: "MAZIGHO · Contenu", content: `<section style="padding:48px 28px;max-width:900px;margin:0 auto"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">L’univers de votre boutique</p><h2 style="font-size:30px;margin:10px 0 18px">Des choix pensés pour votre quotidien</h2><p style="margin:0;color:#5b6470;line-height:1.8">Présentez ici votre expertise, vos matières, votre savoir-faire et les bénéfices de votre sélection. Ce texte peut être adapté avec les mots-clés réellement recherchés par vos clients afin d’améliorer la compréhension de votre offre et le référencement naturel de la page.</p></section>` },
  { id: "mazigho-contact-cta", label: "Appel au contact", category: "MAZIGHO · Conversion", content: `<section style="padding:44px 28px;background:#ead9c9;text-align:center"><h2 style="font-size:30px;margin:0 0 10px;color:#172033">Une question avant de choisir ?</h2><p style="max-width:560px;margin:0 auto 20px;color:#4b5563;line-height:1.6">Notre équipe vous accompagne avec une réponse claire et personnalisée.</p><a href="/contact" style="display:inline-block;padding:13px 22px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Nous contacter</a></section>` },
  { id: "mazigho-review-highlight", label: "Avis mis en avant", category: "MAZIGHO · Conversion", content: `<section style="padding:46px 28px;text-align:center"><div style="display:inline-flex;gap:4px;color:#a45f46;font-size:20px" aria-label="Cinq étoiles">★★★★★</div><blockquote style="max-width:680px;margin:14px auto 0;font-size:22px;line-height:1.55;color:#172033">“Une sélection cohérente, un accompagnement attentif et une commande qui correspond exactement à nos attentes.”</blockquote><p style="margin:14px 0 0;color:#6b6259;font-size:13px">— Client vérifié</p></section>` },
];

function initialComponents(mode: BuilderMode) {
  if (mode === "blank") return `<section style="min-height:420px;padding:100px 32px;text-align:center;background:#fff"><h1>Commencez votre composition</h1><p>Glissez un bloc MAZIGHO depuis la bibliothèque à gauche.</p></section>`;
  if (mode === "theme") return `${editorBlocks[0].content}${editorBlocks[1].content}${editorBlocks[2].content}`;
  return `${editorBlocks[0].content}${editorBlocks[3].content}${editorBlocks[2].content}`;
}

function themedStoreComponents(source: any) {
  const brand = escapeHtml(source?.store?.displayName || source?.profile?.brandName || "Votre boutique");
  const title = escapeHtml(source?.profile?.highlightTitle || `Bienvenue chez ${brand}`);
  const text = escapeHtml(source?.profile?.highlightText || "Présentez votre univers avec une composition MAZIGHO claire et élégante.");
  return `<section style="padding:72px 32px;background:#172033;color:#fff;text-align:center"><p style="letter-spacing:.18em;text-transform:uppercase;color:#f5b98f">${brand}</p><h1 style="font-size:42px;margin:14px 0">${title}</h1><p style="max-width:560px;margin:0 auto 22px;opacity:.8">${text}</p><a href="/boutique" style="display:inline-block;padding:12px 20px;background:#fff;color:#172033;border-radius:8px;text-decoration:none">Découvrir la boutique</a></section>${editorBlocks[1].content}${editorBlocks[2].content}`;
}

const responsiveEditorCss = `*{box-sizing:border-box}img,video{max-width:100%;height:auto}a,button,input,textarea,select{max-width:100%;overflow-wrap:anywhere}table{display:block;max-width:100%;overflow-x:auto}pre{max-width:100%;overflow-x:auto;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:767px){section{padding-left:18px !important;padding-right:18px !important}section[style*="grid-template-columns"],section > div[style*="grid-template-columns"]{grid-template-columns:1fr !important}section > div[style*="display:flex"]{flex-direction:column !important;align-items:stretch !important}section input,section button,section a{width:100% !important;margin-left:0 !important;margin-right:0 !important}}`;
const responsiveEditorCssWithAnimations = `${responsiveEditorCss}@keyframes mazighoFadeIn{from{opacity:0}to{opacity:1}}@keyframes mazighoRiseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes mazighoZoomIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){[style*="animation"],[class*="mazigho-animate"]{animation:none !important;transition:none !important}}`;
const animationPresets = [{ id: "none", label: "Aucune" }, { id: "mazighoFadeIn", label: "Fondu" }, { id: "mazighoRiseIn", label: "Apparition vers le haut" }, { id: "mazighoZoomIn", label: "Zoom léger" }] as const;

function normalizeBuilderPages(value: unknown): BuilderPage[] {
  if (!Array.isArray(value) || value.length === 0) return [{ ...defaultBuilderPage, project: {} }];
  return value.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const page = item as Partial<BuilderPage>;
    if (typeof page.id !== "string" || typeof page.title !== "string" || typeof page.slug !== "string") return [];
    const settings = page.settings && typeof page.settings === "object" ? page.settings as Partial<BuilderPageSettings> : {};
    return [{ id: page.id, title: page.title, slug: page.slug, project: page.project && typeof page.project === "object" ? page.project : {}, settings: { language: typeof settings.language === "string" ? settings.language : "fr", description: typeof settings.description === "string" ? settings.description : "", socialCoverUrl: typeof settings.socialCoverUrl === "string" ? settings.socialCoverUrl : "", faviconUrl: typeof settings.faviconUrl === "string" ? settings.faviconUrl : "" } }];
  });
}

function flattenLayerRows(models: any[], depth = 0, seen = new Set<any>()): Array<{ component: any; depth: number }> {
  if (depth > 12) return [];
  return models.flatMap(component => {
    if (!component || seen.has(component)) return [];
    seen.add(component);
    return [{ component, depth }, ...flattenLayerRows(component.components?.()?.models ?? [], depth + 1, seen)];
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

function imageMarkup(url: string, role: ImageRole) {
  const styles: Record<ImageRole, string> = {
    free: "display:block;width:100%;max-height:520px;object-fit:cover;border-radius:14px",
    logo: "display:block;width:auto;max-width:260px;height:96px;object-fit:contain;margin:0 auto",
    banner: "display:block;width:100%;aspect-ratio:16/6;object-fit:cover;object-position:center;border-radius:14px",
    category: "display:block;width:100%;aspect-ratio:4/3;object-fit:cover;object-position:center;border-radius:14px",
  };
  const labels: Record<ImageRole, string> = { free: "Image ajoutée dans le constructeur", logo: "Logo de la boutique", banner: "Bannière de la boutique", category: "Image de catégorie" };
  return `<figure data-mazigho-image-role="${role}" style="margin:0;padding:24px;text-align:center"><img src="${escapeHtml(url)}" alt="${labels[role]}" style="${styles[role]}" /></figure>`;
}

function videoMarkup(url: string, contentType: string) {
  return `<figure data-mazigho-video="true" style="margin:0;padding:24px;text-align:center"><video controls playsinline preload="metadata" style="display:block;width:100%;max-height:560px;border-radius:14px;background:#172033"><source src="${escapeHtml(url)}" type="${escapeHtml(contentType)}" /></video><figcaption style="margin-top:8px;color:#5b6470;font-size:12px">Vidéo de la boutique</figcaption></figure>`;
}

function clonedSourceComponents(source: any) {
  const brand = escapeHtml(source.store?.displayName || source.profile?.brandName || "Votre boutique");
  const banner = source.banners?.[0];
  const heroImage = banner?.imageUrl || source.profile?.highlightImageUrl || source.profile?.storyImageUrl;
  const heroTitle = escapeHtml(banner?.title || source.profile?.highlightTitle || `Bienvenue chez ${brand}`);
  const heroText = escapeHtml(banner?.subtitle || source.profile?.highlightText || "Une première composition issue de votre boutique clonée.");
  const categories = (source.categories || []).slice(0, 6).map((category: any) => `<article style="padding:18px;background:#f3eee8;border-radius:14px"><div style="height:120px;background:${category.imageUrl ? `url('${escapeHtml(category.imageUrl)}') center/cover` : "#ddd4cb"};border-radius:10px"></div><h3 style="margin:12px 0 0">${escapeHtml(category.name)}</h3></article>`).join("");
  const products = (source.products || []).slice(0, 6).map((product: any) => `<article><div style="height:190px;background:${product.images?.[0] ? `url('${escapeHtml(product.images[0])}') center/cover` : "#e5e1dc"};border-radius:10px"></div><h3 style="margin:12px 0 4px">${escapeHtml(product.name)}</h3><p style="margin:0;color:#6b6259">${(Number(product.price || 0) / 100).toFixed(2)} CHF</p></article>`).join("");
  return `<section style="padding:76px 32px;color:#fff;background:${heroImage ? `linear-gradient(90deg,rgba(20,26,38,.78),rgba(20,26,38,.22)),url('${escapeHtml(heroImage)}') center/cover` : "#172033"}"><p style="letter-spacing:.18em;text-transform:uppercase;color:#f5b98f">${brand}</p><h1 style="font-size:44px;max-width:700px;margin:14px 0">${heroTitle}</h1><p style="max-width:600px;line-height:1.7;opacity:.9">${heroText}</p></section>${categories ? `<section style="padding:48px 28px"><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Explorer</p><h2 style="font-size:30px;margin:8px 0 22px">Nos univers</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${categories}</div></section>` : ""}${products ? `<section style="padding:48px 28px;background:#faf8f5"><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Sélection</p><h2 style="font-size:30px;margin:8px 0 22px">Les pièces à découvrir</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${products}</div></section>` : ""}`;
}

function catalogueSourceComponents(source: any, storeId: number | null) {
  const categories = (source?.categories || []).slice(0, 6).map((category: any) => `<article style="padding:18px;background:#f3eee8;border-radius:14px"><div style="height:120px;background:${category.imageUrl ? `url('${escapeHtml(category.imageUrl)}') center/cover` : "#ddd4cb"};border-radius:10px"></div><h3 style="margin:12px 0 0">${escapeHtml(category.name)}</h3></article>`).join("");
  const products = (source?.products || []).slice(0, 6).map((product: any) => `<article><div style="height:190px;background:${product.images?.[0] ? `url('${escapeHtml(product.images[0])}') center/cover` : "#e5e1dc"};border-radius:10px"></div><h3 style="margin:12px 0 4px">${escapeHtml(product.name)}</h3><p style="margin:0;color:#6b6259">${(Number(product.price || 0) / 100).toFixed(2)} CHF</p></article>`).join("");
  const marker = storeId ? `data-mazigho-dynamic="catalogue" data-mazigho-store-id="${storeId}"` : `data-mazigho-dynamic="catalogue"`;
  return `${categories ? `<section ${marker} data-mazigho-catalogue-kind="categories" style="padding:48px 28px"><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Catalogue réel</p><h2 style="font-size:30px;margin:8px 0 22px">Nos catégories</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${categories}</div></section>` : ""}${products ? `<section ${marker} data-mazigho-catalogue-kind="products" style="padding:48px 28px;background:#faf8f5"><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Catalogue réel</p><h2 style="font-size:30px;margin:8px 0 22px">Nos produits</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${products}</div></section>` : ""}`;
}

export default function AdminStudioVisualBuilder() {
  const [selectedMode, setSelectedMode] = useState<BuilderMode>("blank");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [videoUploadError, setVideoUploadError] = useState("");
  const [imageRole, setImageRole] = useState<ImageRole>("free");
  const [imageZoom, setImageZoom] = useState(100);
  const [imageFocal, setImageFocal] = useState<"left" | "center" | "right">("center");
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [selectedTagName, setSelectedTagName] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedStyles, setSelectedStyles] = useState({ color: "", backgroundColor: "", fontSize: "", padding: "", borderRadius: "", textAlign: "", lineHeight: "", letterSpacing: "" });
  const [selectedLocked, setSelectedLocked] = useState(false);
  const [selectedHref, setSelectedHref] = useState("");
  const [selectedAlt, setSelectedAlt] = useState("");
  const [layerRevision, setLayerRevision] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");
  const [preflightIssues, setPreflightIssues] = useState<string[]>([]);
  const [preflightChecked, setPreflightChecked] = useState(false);
  const [preflightRunning, setPreflightRunning] = useState(false);
  const [activeDevice, setActiveDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [contentEditMode, setContentEditMode] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState("none");
  const [activePanel, setActivePanel] = useState<"properties" | "blocks" | "media" | "layers" | "styles" | "pages" | "review">("properties");
  const [pages, setPages] = useState<BuilderPage[]>([defaultBuilderPage]);
  const [activePageId, setActivePageId] = useState("home");
  const [pageTitle, setPageTitle] = useState("Accueil");
  const [pageSlug, setPageSlug] = useState("/");
  const [pageDescription, setPageDescription] = useState("");
  const [pageLanguage, setPageLanguage] = useState("fr");
  const [socialCoverUrl, setSocialCoverUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [reusableComponents, setReusableComponents] = useState<ReusableBuilderComponent[]>([]);
  const [reviewComments, setReviewComments] = useState<BuilderReviewComment[]>([]);
  const [newReviewComment, setNewReviewComment] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const draggedLayerRef = useRef<any>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImageRef = useRef<any>(null);
  const uploadIntentRef = useRef<"add" | "replace">("add");
  const uploadRoleRef = useRef<ImageRole>("free");
  const selected = modes.find(mode => mode.id === selectedMode) ?? modes[0];
  const tone = toneClasses[selected.tone];
  const Icon = selected.icon;
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery({ includeAllForInternalProjection: true, page: 1, pageSize: 100 }, { refetchOnWindowFocus: false });
  const stores = inventoryQuery.data?.stores ?? [];
  const projectQuery = trpc.admin.studio.getVisualBuilderProject.useQuery({ storeId: selectedStoreId ?? 0 }, { enabled: selectedStoreId !== null, refetchOnWindowFocus: false });
  const cloneSourceQuery = trpc.admin.studio.getVisualBuilderCloneSource.useQuery({ storeId: selectedStoreId ?? 0 }, { enabled: selectedStoreId !== null, refetchOnWindowFocus: false });
  const saveProjectMutation = trpc.admin.studio.saveVisualBuilderProject.useMutation({ onSuccess: () => { setHasUnsavedChanges(false); setSaveError(""); setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })); }, onError: error => setSaveError(error.message || "La sauvegarde n’a pas abouti.") });
  const createVersionMutation = trpc.admin.studio.createVisualBuilderVersion.useMutation({ onSuccess: () => { setHasUnsavedChanges(false); setSaveError(""); setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })); void projectQuery.refetch(); }, onError: error => setSaveError(error.message || "La création de version a échoué.") });
  const restoreVersionMutation = trpc.admin.studio.restoreVisualBuilderVersion.useMutation({ onSuccess: result => { editorRef.current?.loadProjectData({ components: result.project.components, styles: result.project.styles } as Parameters<Editor["loadProjectData"]>[0]); setSelectedMode(result.mode as BuilderMode); setSelectedComponent(null); setHasUnsavedChanges(false); setSaveError(""); void projectQuery.refetch(); }, onError: error => setSaveError(error.message || "La restauration a échoué.") });
  const publishProjectMutation = trpc.admin.studio.publishVisualBuilderProject.useMutation({ onSuccess: () => { setSaveError(""); setHasUnsavedChanges(false); setLastSavedAt(`publié à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`); }, onError: error => setSaveError(error.message || "La publication a échoué.") });
  const uploadImageMutation = trpc.admin.studio.uploadVisualBuilderImage.useMutation({
    onSuccess: result => {
      const role = uploadRoleRef.current;
      if (uploadIntentRef.current === "replace" && selectedImageRef.current) {
        const image = selectedImageRef.current;
        image.addAttributes({ src: result.url, alt: role === "free" ? "Image remplacée dans le constructeur" : `${role} de la boutique` });
        image.addStyle(role === "logo" ? "width:auto;max-width:260px;height:96px;object-fit:contain;margin:0 auto" : role === "banner" ? "width:100%;aspect-ratio:16/6;object-fit:cover;object-position:center" : role === "category" ? "width:100%;aspect-ratio:4/3;object-fit:cover;object-position:center" : "width:100%;max-height:520px;object-fit:cover");
      } else {
        editorRef.current?.addComponents(imageMarkup(result.url, role));
      }
      selectedImageRef.current = null;
      setHasSelectedImage(false);
      setImageUploadError("");
    },
  });
  const uploadVideoMutation = trpc.admin.studio.uploadVisualBuilderVideo.useMutation({
    onSuccess: result => {
      editorRef.current?.addComponents(videoMarkup(result.url, result.contentType));
      setVideoUploadError("");
    },
    onError: error => setVideoUploadError(error.message || "Téléversement vidéo impossible."),
  });
  const editorOptions = useMemo(() => ({ height: "650px", storageManager: false, noticeOnUnload: false, components: initialComponents(selectedMode), style: responsiveEditorCss, blockManager: { blocks: editorBlocks }, deviceManager: { devices: [{ id: "desktop", name: "Ordinateur", width: "" }, { id: "tablet", name: "Tablette", width: "768px", widthMedia: "992px" }, { id: "mobile", name: "Téléphone", width: "320px", widthMedia: "480px" }] } }), [selectedMode]);

  useEffect(() => {
    if (selectedStoreId === null && stores.length > 0) {
      const preferred = stores.find(store => !store.isPlatformStore) ?? stores[0];
      setSelectedStoreId(preferred.id);
    }
  }, [selectedStoreId, stores]);

  useEffect(() => {
    const editor = editorRef.current;
    const savedProject = projectQuery.data?.project;
    if (!editor || projectQuery.isFetching) return;
    if (savedProject) editor.loadProjectData(savedProject as Parameters<Editor["loadProjectData"]>[0]);
    else if (selectedMode !== "clone") editor.setComponents(initialComponents(selectedMode));
  }, [projectQuery.data, projectQuery.isFetching, selectedMode]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || selectedStoreId === null) return;
    editor.setComponents(initialComponents("blank"));
    editor.select(undefined);
    setSelectedComponent(null);
    setHasUnsavedChanges(false);
  }, [selectedStoreId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || selectedMode === "blank") return;
    if (cloneSourceQuery.isFetching) return;
    if (selectedMode === "clone") {
      if (cloneSourceQuery.isFetching) return;
      if (cloneSourceQuery.data) editor.setComponents(clonedSourceComponents(cloneSourceQuery.data));
      return;
    }
    editor.setComponents(cloneSourceQuery.data ? themedStoreComponents(cloneSourceQuery.data) : initialComponents("theme"));
  }, [cloneSourceQuery.data, selectedMode]);

  const handleEditor = (editor: Editor) => {
    editorRef.current = editor;
    editor.on("component:selected", (component: any) => {
      const isImage = component?.get?.("type") === "image" || component?.get?.("tagName") === "img";
      selectedImageRef.current = isImage ? component : null;
      setHasSelectedImage(isImage);
      setImageZoom(100);
      setImageFocal("center");
      handleSelectedComponent(component);
      setLayerRevision(previous => previous + 1);
    });
    editor.on("component:add component:remove component:update", () => { setLayerRevision(previous => previous + 1); setHasUnsavedChanges(true); setPreflightChecked(false); });
    editor.on("component:deselected", () => {
      selectedImageRef.current = null;
      setHasSelectedImage(false);
      setSelectedComponent(null);
      setSelectedTagName("");
      setSelectedText("");
      setSelectedLocked(false);
      setSelectedHref("");
      setSelectedAlt("");
    });
    const savedProject = projectQuery.data?.project as Record<string, unknown> | undefined;
    if (savedProject) {
      const loadedPages = normalizeBuilderPages(savedProject.pages);
      const loadedPageId = typeof savedProject.activePageId === "string" && loadedPages.some(page => page.id === savedProject.activePageId) ? savedProject.activePageId : loadedPages[0].id;
      const loadedPage = loadedPages.find(page => page.id === loadedPageId) ?? loadedPages[0];
      setPages(loadedPages);
      setActivePageId(loadedPage.id);
      setPageTitle(loadedPage.title);
      setPageSlug(loadedPage.slug);
      setPageLanguage(loadedPage.settings?.language ?? "fr");
      setPageDescription(loadedPage.settings?.description ?? (typeof savedProject.pageDescription === "string" ? savedProject.pageDescription : ""));
      setSocialCoverUrl(loadedPage.settings?.socialCoverUrl ?? "");
      setFaviconUrl(loadedPage.settings?.faviconUrl ?? "");
      setReusableComponents(Array.isArray(savedProject.reusableComponents) ? savedProject.reusableComponents.filter((item): item is ReusableBuilderComponent => Boolean(item && typeof item === "object" && typeof (item as any).id === "string" && typeof (item as any).name === "string" && typeof (item as any).html === "string")) : []);
      setReviewComments(Array.isArray(savedProject.reviewComments) ? savedProject.reviewComments.filter((item): item is BuilderReviewComment => Boolean(item && typeof item === "object" && typeof (item as any).id === "string" && typeof (item as any).pageId === "string" && typeof (item as any).text === "string" && typeof (item as any).createdAt === "string")).map(item => ({ ...item, resolved: Boolean(item.resolved) })) : []);
      editor.loadProjectData(Object.keys(loadedPage.project).length > 0 ? loadedPage.project as Parameters<Editor["loadProjectData"]>[0] : savedProject as Parameters<Editor["loadProjectData"]>[0]); setHasUnsavedChanges(false); setLastSavedAt(projectQuery.data?.updatedAt ? new Date(projectQuery.data.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null);
    }
    else if (selectedMode === "clone" && cloneSourceQuery.data) editor.setComponents(clonedSourceComponents(cloneSourceQuery.data));
  };

  const currentPageSettings = (): BuilderPageSettings => ({ language: pageLanguage, description: pageDescription, socialCoverUrl, faviconUrl });

  const capturePages = () => {
    const currentProject = editorRef.current?.getProjectData() as BuilderPage["project"] | undefined;
    return pages.map(page => page.id === activePageId ? { ...page, title: pageTitle, slug: pageSlug, project: currentProject ?? page.project, settings: currentPageSettings() } : page);
  };

  const getProjectPayload = () => ({ ...(editorRef.current?.getProjectData() as Record<string, unknown>), pages: capturePages(), activePageId, pageDescription, reusableComponents, reviewComments });

  const addReviewComment = () => {
    const text = newReviewComment.trim();
    if (!text) return;
    setReviewComments(previous => [...previous, { id: `comment-${Date.now()}`, pageId: activePageId, text: text.slice(0, 500), createdAt: new Date().toISOString(), resolved: false }]);
    setNewReviewComment("");
    setHasUnsavedChanges(true);
  };

  const saveReusableComponent = () => {
    const html = selectedComponent?.toHTML?.();
    if (!html) return;
    const name = window.prompt("Nom du composant réutilisable", `Composant ${reusableComponents.length + 1}`)?.trim();
    if (!name) return;
    setReusableComponents(previous => [...previous, { id: `component-${Date.now()}`, name: name.slice(0, 80), html }]);
    setHasUnsavedChanges(true);
  };

  const insertReusableComponent = (component: ReusableBuilderComponent) => {
    editorRef.current?.addComponents(component.html);
    setHasUnsavedChanges(true);
  };

  const switchPage = (pageId: string) => {
    const target = pages.find(page => page.id === pageId);
    if (!target || !editorRef.current || pageId === activePageId) return;
    const nextPages = capturePages();
    setPages(nextPages);
    setActivePageId(pageId);
    setPageTitle(target.title);
    setPageSlug(target.slug);
    setPageLanguage(target.settings?.language ?? "fr");
    setPageDescription(target.settings?.description ?? "");
    setSocialCoverUrl(target.settings?.socialCoverUrl ?? "");
    setFaviconUrl(target.settings?.faviconUrl ?? "");
    const project = target.project && Object.keys(target.project).length > 0 ? target.project : { components: initialComponents("blank"), styles: responsiveEditorCssWithAnimations };
    editorRef.current.loadProjectData(project as Parameters<Editor["loadProjectData"]>[0]);
    setSelectedComponent(null);
    setHasUnsavedChanges(true);
  };

  const createPage = () => {
    if (!editorRef.current) return;
    const id = `page-${Date.now()}`;
    const nextPage: BuilderPage = { id, title: `Page ${pages.length + 1}`, slug: `/page-${pages.length + 1}`, project: { components: initialComponents("blank"), styles: responsiveEditorCss }, settings: { language: "fr", description: "", socialCoverUrl: "", faviconUrl: "" } };
    setPages(previous => [...capturePages(), nextPage]);
    setActivePageId(id);
    setPageTitle(nextPage.title);
    setPageSlug(nextPage.slug);
    editorRef.current.loadProjectData(nextPage.project as Parameters<Editor["loadProjectData"]>[0]);
    setSelectedComponent(null);
    setHasUnsavedChanges(true);
  };

  const saveProject = () => {
    if (!selectedStoreId || !editorRef.current) return;
    setSaveError("");
    saveProjectMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: getProjectPayload() });
  };

  const createVersion = () => {
    if (!selectedStoreId || !editorRef.current) return;
    createVersionMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: getProjectPayload() });
  };

  const restoreVersion = (versionId: string) => {
    if (!selectedStoreId || !versionId || !window.confirm("Restaurer cette version privée dans le brouillon actuel ?")) return;
    restoreVersionMutation.mutate({ storeId: selectedStoreId, versionId });
  };

  const publishProject = () => {
    if (!selectedStoreId || !editorRef.current || !preflightChecked || preflightIssues.length > 0 || !window.confirm("Publier cette composition sur la vitrine publique ?")) return;
    publishProjectMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: getProjectPayload(), html: editorRef.current.getHtml(), css: `${editorRef.current.getCss() || ""}\n${responsiveEditorCssWithAnimations}` });
  };

  const resetDraft = () => {
    if (!editorRef.current || !window.confirm("Réinitialiser le brouillon de cette boutique ? Les modifications non enregistrées seront perdues.")) return;
    const source = selectedMode === "clone" ? cloneSourceQuery.data : cloneSourceQuery.data;
    const components = selectedMode === "clone" && source ? clonedSourceComponents(source) : selectedMode === "theme" && source ? themedStoreComponents(source) : initialComponents(selectedMode);
    editorRef.current.setComponents(components);
    editorRef.current.select(undefined);
    setSelectedComponent(null);
    setHasUnsavedChanges(true);
    setSaveError("");
  };

  const exportProject = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const documentHtml = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${editor.getCss()}</style></head><body>${editor.getHtml()}</body></html>`;
    const url = URL.createObjectURL(new Blob([documentHtml], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mazigho-brouillon.html";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const checkImageUrl = (url: string) => new Promise<boolean>(resolve => {
    const image = new Image();
    const timeout = window.setTimeout(() => { image.onload = null; image.onerror = null; resolve(false); }, 8_000);
    image.onload = () => { window.clearTimeout(timeout); resolve(true); };
    image.onerror = () => { window.clearTimeout(timeout); resolve(false); };
    image.src = url;
  });

  const auditResponsiveLayout = () => {
    const editor = editorRef.current as any;
    const frame = editor?.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const documentBody = frame?.contentDocument?.body;
    const issues: string[] = [];
    if (documentBody && documentBody.scrollWidth > Math.max(documentBody.clientWidth, 320) + 8) issues.push("La composition déborde horizontalement dans le canvas.");
    const html = editor?.getHtml?.() || "";
    if (/<(?:section|div|table|img|video)\b[^>]*style=["'][^"']*(?:min-width\s*:\s*\d{3,}px|width\s*:\s*\d{4,}px)/i.test(html)) issues.push("Un élément possède une largeur fixe susceptible de dépasser l’écran mobile.");
    if (/<table\b(?![^>]*style=["'][^"']*max-width)/i.test(html)) issues.push("Un tableau sans conteneur responsive peut provoquer un défilement horizontal sur mobile.");
    if (/white-space\s*:\s*nowrap/i.test(html)) issues.push("Un texte en nowrap peut dépasser la largeur d’un écran mobile.");
    return issues;
  };

  const runPreflight = async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setPreflightRunning(true);
    const html = editor.getHtml();
    const issues: string[] = [];
    if (!html.trim()) issues.push("La page ne contient encore aucun contenu.");
    if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(html) || /<img\b[^>]*\balt=["']\s*["']/i.test(html)) issues.push("Une image semble dépourvue de texte alternatif.");
    if ((html.match(/href=["']#["']/gi) || []).length > 0) issues.push("Un ou plusieurs boutons utilisent encore le lien de démonstration #.");
    if (/Votre image|Produit exemple|Votre marque|Prénom du client|à remplacer|texte de démonstration/i.test(html)) issues.push("Des contenus de démonstration doivent être remplacés avant publication.");
    const imageUrls = Array.from(html.matchAll(/<(?:img[^>]*\bsrc|[^>]*style=["'][^"']*background(?:-image)?\s*:\s*url\(['"]?)(https?:\/\/[^'"\s)]+)/gi), match => match[1]).filter(Boolean);
    const uniqueImageUrls = Array.from(new Set(imageUrls));
    const imageResults = await Promise.all(uniqueImageUrls.map(async url => ({ url, valid: await checkImageUrl(url) })));
    const brokenImages = imageResults.filter(result => !result.valid);
    if (brokenImages.length > 0) issues.push(`${brokenImages.length} image(s) ne se chargent pas. Remplacez-les avant publication.`);
    issues.push(...auditResponsiveLayout());
    setPreflightIssues(issues);
    setPreflightChecked(true);
    setPreflightRunning(false);
  };

  const switchDevice = (device: "desktop" | "tablet" | "mobile") => {
    editorRef.current?.setDevice(device);
    setActiveDevice(device);
  };

  const insertRealCatalogue = () => {
    const content = catalogueSourceComponents(cloneSourceQuery.data, selectedStoreId);
    if (content) editorRef.current?.addComponents(content);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveProject();
      } else if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        editorRef.current?.runCommand(event.shiftKey ? "core:redo" : "core:undo");
      } else if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        editorRef.current?.runCommand("core:redo");
      } else if (event.key === "Escape") {
        if (isPreviewing) {
          editorRef.current?.stopCommand("core:preview");
          setIsPreviewing(false);
        } else editorRef.current?.select(undefined);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isPreviewing, selectedStoreId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges || !selectedStoreId) return;
    const timer = window.setInterval(() => {
      if (editorRef.current && !saveProjectMutation.isPending) saveProject();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [hasUnsavedChanges, selectedStoreId, saveProjectMutation.isPending]);

  useEffect(() => {
    if (!isPreviewing) return;
    editorRef.current?.stopCommand("core:preview");
    setIsPreviewing(false);
  }, [selectedMode, selectedStoreId]);

  const togglePreview = () => {
    if (!editorRef.current) return;
    if (isPreviewing) editorRef.current.stopCommand("core:preview");
    else editorRef.current.runCommand("core:preview");
    setIsPreviewing(previous => !previous);
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedStoreId) return;
    const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    if (!acceptedTypes.has(file.type)) {
      setImageUploadError("Format refusé. Utilisez PNG, JPEG, WebP ou GIF.");
      return;
    }
    if (file.size > 5_000_000) {
      setImageUploadError("Image trop volumineuse. La limite est de 5 Mo.");
      return;
    }
    setImageUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") uploadImageMutation.mutate({ storeId: selectedStoreId, dataUrl: reader.result, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const uploadVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedStoreId) return;
    const acceptedTypes = new Set(["video/mp4", "video/webm", "video/ogg"]);
    if (!acceptedTypes.has(file.type)) {
      setVideoUploadError("Format refusé. Utilisez MP4, WebM ou Ogg.");
      return;
    }
    if (file.size > 25_000_000) {
      setVideoUploadError("Vidéo trop volumineuse. La limite est de 25 Mo.");
      return;
    }
    setVideoUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") uploadVideoMutation.mutate({ storeId: selectedStoreId, dataUrl: reader.result, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const openImagePicker = (intent: "add" | "replace") => {
    uploadIntentRef.current = intent;
    uploadRoleRef.current = imageRole;
    uploadInputRef.current?.click();
  };

  const applyImageCrop = (zoom = imageZoom, focal = imageFocal) => {
    const image = selectedImageRef.current;
    if (!image) return;
    image.addStyle({ transform: `scale(${zoom / 100})`, transformOrigin: focal, objectPosition: focal });
  };

  const resetImageCrop = () => {
    setImageZoom(100);
    setImageFocal("center");
    applyImageCrop(100, "center");
  };

  const readSelectedText = (component: any) => component?.components?.().models
    ?.filter((child: any) => child.get?.("type") === "textnode")
    ?.map((child: any) => child.get?.("content") || "")
    ?.join("") || "";

  const handleSelectedComponent = (component: any) => {
    const tagName = String(component?.get?.("tagName") || component?.get?.("type") || "element").toLowerCase();
    const styles = component?.getStyle?.() || {};
    setSelectedComponent(component);
    setSelectedTagName(tagName);
    setSelectedText(readSelectedText(component));
    setSelectedLocked(component?.get?.("removable") === false);
    setSelectedAnimation(String(styles.animationName || "none"));
    const attributes = component?.getAttributes?.() || {};
    setSelectedHref(String(attributes.href || ""));
    setSelectedAlt(String(attributes.alt || ""));
    setSelectedStyles({
      color: String(styles.color || ""),
      backgroundColor: String(styles.backgroundColor || ""),
      fontSize: String(styles.fontSize || ""),
      padding: String(styles.padding || ""),
      borderRadius: String(styles.borderRadius || ""),
      textAlign: String(styles.textAlign || ""),
      lineHeight: String(styles.lineHeight || ""),
      letterSpacing: String(styles.letterSpacing || ""),
    });
  };

  const updateSelectedText = (value: string) => {
    const safeValue = value.replace(/[<>]/g, "");
    setSelectedText(safeValue);
    if (selectedComponent?.components) selectedComponent.components(safeValue);
  };

  const updateSelectedAnimation = (value: string) => {
    if (contentEditMode || !animationPresets.some(preset => preset.id === value)) return;
    setSelectedAnimation(value);
    selectedComponent?.addStyle?.({ animationName: value === "none" ? undefined : value, animationDuration: value === "none" ? undefined : "650ms", animationTimingFunction: value === "none" ? undefined : "cubic-bezier(.23,1,.32,1)", animationFillMode: value === "none" ? undefined : "both" });
    setHasUnsavedChanges(true);
  };

  const updateSelectedStyle = (key: keyof typeof selectedStyles, value: string) => {
    if (contentEditMode) return;
    setSelectedStyles(previous => ({ ...previous, [key]: value }));
    if (selectedComponent?.addStyle) selectedComponent.addStyle({ [key]: value || undefined });
  };

  const updateSelectedAttribute = (key: "href" | "alt", value: string) => {
    const safeValue = key === "href" ? normalizeBuilderHref(value) : sanitizeBuilderAlt(value);
    if (key === "href") setSelectedHref(safeValue);
    else setSelectedAlt(safeValue);
    if (selectedComponent?.addAttributes) selectedComponent.addAttributes({ [key]: safeValue });
  };

  const resetSelectedStyles = () => {
    if (contentEditMode) return;
    const defaults = { color: "", backgroundColor: "", fontSize: "", padding: "", borderRadius: "", textAlign: "", lineHeight: "", letterSpacing: "" };
    setSelectedStyles(defaults);
    selectedComponent?.setStyle?.(defaults);
  };

  const duplicateSelected = () => {
    if (contentEditMode) return;
    const clone = selectedComponent?.clone?.();
    const parent = selectedComponent?.parent?.();
    if (clone && parent) {
      parent.append(clone);
      editorRef.current?.select(clone);
    }
  };

  const removeSelected = () => {
    if (!selectedComponent || selectedLocked || contentEditMode) return;
    if (!window.confirm("Supprimer définitivement cet élément du brouillon ?")) return;
    selectedComponent.remove?.();
    setSelectedComponent(null);
  };

  const toggleSelectedLock = () => {
    if (!selectedComponent?.set || contentEditMode) return;
    const nextLocked = !selectedLocked;
    selectedComponent.set({ removable: !nextLocked, draggable: !nextLocked, copyable: !nextLocked, selectable: true });
    setSelectedLocked(nextLocked);
  };

  const runEditorCommand = (command: "core:undo" | "core:redo") => {
    editorRef.current?.runCommand(command);
  };

  const layerItems = useMemo(() => editorRef.current?.getWrapper?.()?.components?.()?.models ?? [], [layerRevision, selectedComponent]);
  const layerRows = useMemo(() => flattenLayerRows(layerItems), [layerItems]);
  const selectLayer = (component: any) => editorRef.current?.select(component);
  const moveLayer = (component: any, direction: -1 | 1) => {
    if (contentEditMode) return;
    const parent = component?.parent?.();
    const collection = parent?.components?.();
    const index = collection?.indexOf?.(component);
    if (!parent || !collection || typeof index !== "number") return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= collection.length) return;
    collection.remove(component);
    collection.add(component, { at: nextIndex });
    editorRef.current?.select(component);
    setLayerRevision(previous => previous + 1);
  };

  const renameLayer = (component: any) => {
    if (contentEditMode) return;
    const current = String(component?.get?.("name") || component?.get?.("tagName") || component?.get?.("type") || "élément");
    const next = window.prompt("Nom du calque", current)?.trim();
    if (!next || !component?.set) return;
    component.set({ name: next.slice(0, 80) });
    setLayerRevision(previous => previous + 1);
    setHasUnsavedChanges(true);
  };

  const moveLayerTo = (component: any, target: any) => {
    if (contentEditMode) return;
    const parent = component?.parent?.();
    const collection = parent?.components?.();
    if (!parent || !collection || target?.parent?.() !== parent || component === target) return;
    const from = collection.indexOf(component);
    const to = collection.indexOf(target);
    if (from < 0 || to < 0) return;
    collection.remove(component);
    collection.add(component, { at: to > from ? to - 1 : to });
    editorRef.current?.select(component);
    setLayerRevision(previous => previous + 1);
    setHasUnsavedChanges(true);
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><Layers3 className="mr-1.5 h-3.5 w-3.5" /> MAZIGHO Studio</Badge><Badge variant="outline" className="border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950">Constructeur open source</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Constructeur visuel</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Un canvas inspiré des meilleurs éditeurs visuels, construit sur GrapesJS open source et spécialisé pour les boutiques MAZIGHO.</p></div><Link href="/admin/studio"><Button type="button" variant="outline" className="min-h-11 w-fit">Retour au Studio</Button></Link></header>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">Point de départ</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Comment voulez-vous commencer ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le choix recharge une composition de démonstration dans le canvas privé.</p></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">Étape 1 · Choisir une base</Badge></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{modes.map(mode => { const ModeIcon = mode.icon; const active = selectedMode === mode.id; const modeTone = toneClasses[mode.tone]; return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? `${modeTone.card} ring-2 ring-slate-950/10` : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${modeTone.icon}`}><ModeIcon className="h-5 w-5" /></span>{active && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{mode.eyebrow}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{mode.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{mode.description}</p><span className={`mt-5 inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${active ? modeTone.button : "bg-slate-700 hover:bg-slate-800"}`}>{active ? "Parcours sélectionné" : "Choisir ce parcours"}<ArrowRight className="ml-2 h-4 w-4" /></span></button>; })}</div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Étape 2 · Boutique cible</p><h2 className="mt-1 text-xl font-bold text-slate-950">Où enregistrer ce brouillon ?</h2><p className="mt-1 text-sm text-slate-600">Le projet reste isolé dans les réglages privés de la boutique choisie.</p></div><select value={selectedStoreId ?? ""} onChange={event => setSelectedStoreId(Number(event.target.value) || null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-950/20"><option value="">Sélectionner une boutique</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName} · {store.primaryDomain}</option>)}</select></div></section>
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Canvas privé · {selected.title}</p><h2 className="mt-1 text-xl font-bold text-slate-950">Composition MAZIGHO</h2></div></div><p className="mt-3 text-sm text-slate-600">Choisissez un rôle d’image pour appliquer automatiquement ses proportions et son recadrage.</p></div><div className="flex flex-wrap items-center gap-2"><input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={uploadImage} /><input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={uploadVideo} />{videoUploadError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{videoUploadError}</p>}{imageUploadError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{imageUploadError}</p>}<select value={imageRole} onChange={event => setImageRole(event.target.value as ImageRole)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="free">Image libre</option><option value="logo">Logo</option><option value="banner">Bannière</option><option value="category">Catégorie</option></select>{hasSelectedImage && <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"><span className="text-[11px] font-semibold text-slate-500">Zoom</span><input aria-label="Zoom de l’image" type="range" min="100" max="180" step="5" value={imageZoom} onChange={event => { const value = Number(event.target.value); setImageZoom(value); applyImageCrop(value, imageFocal); }} className="w-20" /><span className="w-8 text-right text-[11px] font-semibold text-slate-600">{imageZoom}%</span><select aria-label="Point focal de l’image" value={imageFocal} onChange={event => { const value = event.target.value as "left" | "center" | "right"; setImageFocal(value); applyImageCrop(imageZoom, value); }} className="rounded border border-slate-300 bg-white px-1 py-1 text-xs"><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select><button type="button" onClick={resetImageCrop} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Réinitialiser</button></div>}<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">{projectQuery.data?.updatedAt ? "Brouillon chargé" : "Nouveau brouillon"}</Badge><Badge variant="outline" className={hasUnsavedChanges ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>{hasUnsavedChanges ? "Modifications non enregistrées" : lastSavedAt ? `Enregistré à ${lastSavedAt}` : "Prêt à enregistrer"}</Badge><Button type="button" variant="outline" onClick={togglePreview} disabled={!editorRef.current} className="min-h-10">{isPreviewing ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{isPreviewing ? "Quitter l’aperçu" : "Aperçu"}</Button>{saveError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{saveError}</p>}<Button type="button" variant="outline" onClick={resetDraft} disabled={!editorRef.current} className="min-h-10">Réinitialiser</Button><Button type="button" variant="outline" onClick={createVersion} disabled={!selectedStoreId || !editorRef.current || createVersionMutation.isPending} className="min-h-10">{createVersionMutation.isPending ? "Versionnement…" : "Créer une version"}</Button>{(projectQuery.data?.versions?.length ?? 0) > 0 && <select aria-label="Restaurer une version privée" defaultValue="" onChange={event => { const value = event.target.value; event.target.value = ""; restoreVersion(value); }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="">Restaurer une version…</option>{projectQuery.data?.versions?.map(version => <option key={version.id} value={version.id}>{new Date(version.createdAt).toLocaleString("fr-FR")}</option>)}</select>}<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Aperçu responsive"><button type="button" onClick={() => switchDevice("desktop")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "desktop" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Ordinateur</button><button type="button" onClick={() => switchDevice("tablet")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "tablet" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Tablette</button><button type="button" onClick={() => switchDevice("mobile")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "mobile" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Téléphone</button></div><Button type="button" variant="outline" onClick={runPreflight} disabled={!editorRef.current || preflightRunning} className="min-h-10">{preflightRunning ? "Vérification…" : "Contrôler"}</Button><Button type="button" variant="outline" onClick={exportProject} disabled={!editorRef.current} className="min-h-10">Exporter HTML</Button><Button type="button" variant="outline" onClick={insertRealCatalogue} disabled={!selectedStoreId || cloneSourceQuery.isLoading || (!cloneSourceQuery.data?.categories?.length && !cloneSourceQuery.data?.products?.length)} className="min-h-10">Catalogue réel</Button><Button type="button" variant="outline" onClick={() => openImagePicker("add")} disabled={!selectedStoreId || uploadImageMutation.isPending} className="min-h-10"><ImagePlus className="mr-2 h-4 w-4" />Ajouter</Button><Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={!selectedStoreId || uploadVideoMutation.isPending} className="min-h-10"><Video className="mr-2 h-4 w-4" />Vidéo</Button><Button type="button" variant="outline" onClick={() => openImagePicker("replace")} disabled={!hasSelectedImage || uploadImageMutation.isPending} className="min-h-10"><ImagePlus className="mr-2 h-4 w-4" />Remplacer</Button><Button type="button" onClick={publishProject} disabled={!selectedStoreId || !editorRef.current || !preflightChecked || preflightIssues.length > 0 || publishProjectMutation.isPending} className="min-h-10 bg-emerald-700 text-white hover:bg-emerald-800">{publishProjectMutation.isPending ? "Publication…" : "Publier"}</Button><Button type="button" onClick={saveProject} disabled={!selectedStoreId || saveProjectMutation.isPending} className="min-h-10 bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" />{saveProjectMutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button></div></div><div className="border-t border-slate-200 px-5 py-3">{preflightChecked && <div role="status" className={`rounded-xl border px-3 py-2 text-xs ${preflightIssues.length ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><strong>{preflightIssues.length ? `${preflightIssues.length} point(s) à vérifier avant publication` : "Contrôle qualité réussi : la composition est prête pour une revue finale"}</strong>{preflightIssues.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-4">{preflightIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}</div>}</div><div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-2xl bg-white"><GjsEditor grapesjs={grapesjs} options={editorOptions} onEditor={handleEditor} /></div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Panneaux du constructeur visuel">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-fuchsia-700" /><h3 className="font-semibold text-slate-950">Panneau de travail</h3></div><button type="button" onClick={() => setContentEditMode(previous => !previous)} className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${contentEditMode ? "bg-emerald-100 text-emerald-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{contentEditMode ? "Mode contenu actif" : "Mode contenu"}</button><div className="flex items-center gap-1"><button type="button" onClick={() => runEditorCommand("core:undo")} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" title="Annuler"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={() => runEditorCommand("core:redo")} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" title="Rétablir"><Redo2 className="h-4 w-4" /></button></div></div>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Outils du constructeur">{([{ id: "pages", label: "Pages" }, { id: "blocks", label: "Blocs" }, { id: "media", label: "Média" }, { id: "layers", label: "Calques" }, { id: "styles", label: "Styles" }, { id: "review", label: "Revue" }, { id: "properties", label: "Propriétés" }] as const).map(panel => <button key={panel.id} type="button" role="tab" aria-selected={activePanel === panel.id} onClick={() => setActivePanel(panel.id)} className={`rounded-lg px-2 py-2 text-xs font-semibold ${activePanel === panel.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{panel.label}</button>)}</div>
          {activePanel === "review" && <div className="mt-4 space-y-3"><div><p className="text-xs font-semibold text-slate-800">Revue privée Studio</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Notes internes enregistrées avec le brouillon. Elles ne sont jamais publiées dans la vitrine.</p></div><textarea value={newReviewComment} onChange={event => setNewReviewComment(event.target.value)} rows={3} maxLength={500} placeholder="Ex. Vérifier le cadrage mobile de la bannière…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" /><button type="button" onClick={addReviewComment} disabled={!newReviewComment.trim()} className="w-full rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Ajouter une note</button><div className="space-y-2">{reviewComments.filter(comment => comment.pageId === activePageId).map(comment => <div key={comment.id} className={`rounded-lg border p-3 ${comment.resolved ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><p className="text-xs leading-5 text-slate-700">{comment.text}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleString("fr-FR")}</span><div className="flex gap-1"><button type="button" onClick={() => { setReviewComments(previous => previous.map(item => item.id === comment.id ? { ...item, resolved: !item.resolved } : item)); setHasUnsavedChanges(true); }} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700">{comment.resolved ? "Rouvrir" : "Résoudre"}</button><button type="button" onClick={() => { setReviewComments(previous => previous.filter(item => item.id !== comment.id)); setHasUnsavedChanges(true); }} className="rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700">Supprimer</button></div></div></div>)}{reviewComments.filter(comment => comment.pageId === activePageId).length === 0 && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">Aucune note sur cette page.</p>}</div></div>}
          {activePanel === "pages" && <div className="mt-4 space-y-3"><div className="flex items-center justify-between"><p className="text-xs leading-5 text-slate-500">Pages privées de cette boutique</p><button type="button" onClick={createPage} className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">+ Nouvelle page</button></div><div className="space-y-2">{pages.map(page => <button key={page.id} type="button" onClick={() => switchPage(page.id)} className={`w-full rounded-lg border px-3 py-2 text-left ${page.id === activePageId ? "border-fuchsia-300 bg-fuchsia-50" : "border-slate-200 bg-white hover:border-slate-300"}`}><span className="block text-xs font-semibold text-slate-800">{page.title}</span><span className="block text-[11px] text-slate-500">{page.slug}</span></button>)}</div><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Titre de page</span><input value={pageTitle} onChange={event => { setPageTitle(event.target.value); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Chemin</span><input value={pageSlug} onChange={event => { setPageSlug(event.target.value.startsWith("/") ? event.target.value : `/${event.target.value}`); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Description SEO</span><textarea value={pageDescription} onChange={event => { setPageDescription(event.target.value); setHasUnsavedChanges(true); }} rows={3} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Langue</span><select value={pageLanguage} onChange={event => { setPageLanguage(event.target.value); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="fr">Français</option><option value="de">Deutsch</option><option value="en">English</option><option value="it">Italiano</option></select></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Image sociale (URL HTTPS)</span><input value={socialCoverUrl} onChange={event => { setSocialCoverUrl(normalizeBuilderHref(event.target.value)); setHasUnsavedChanges(true); }} placeholder="https://..." className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Favicon (URL HTTPS)</span><input value={faviconUrl} onChange={event => { setFaviconUrl(normalizeBuilderHref(event.target.value)); setHasUnsavedChanges(true); }} placeholder="https://..." className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs" /></label></div>}
          {activePanel === "blocks" && <div className="mt-4 max-h-[520px] overflow-y-auto"><p className="text-xs leading-5 text-slate-500">Les blocs MAZIGHO restent responsive et peuvent être combinés avec le catalogue réel.</p>{selectedComponent && <button type="button" onClick={saveReusableComponent} className="mt-3 w-full rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-fuchsia-900 hover:bg-fuchsia-100">+ Enregistrer la sélection comme composant</button>}<div className="mt-3 space-y-2">{reusableComponents.length > 0 && <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mes composants</p>}{reusableComponents.map(component => <div key={component.id} className="flex items-center gap-2"><button type="button" onClick={() => insertReusableComponent(component)} className="min-w-0 flex-1 truncate rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-left text-xs font-semibold text-fuchsia-900 hover:bg-fuchsia-100">{component.name}</button><button type="button" onClick={() => { setReusableComponents(previous => previous.filter(item => item.id !== component.id)); setHasUnsavedChanges(true); }} className="rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" aria-label={`Supprimer ${component.name}`}>×</button></div>)}<p className="pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Blocs MAZIGHO</p>{editorBlocks.map(block => <button key={block.id} type="button" onClick={() => { editorRef.current?.addComponents(block.content); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-fuchsia-300 hover:bg-fuchsia-50">{block.label}<span className="mt-0.5 block text-[10px] font-normal text-slate-500">{block.category}</span></button>)}</div></div>}
          {activePanel === "media" && <div className="mt-4 space-y-3"><p className="text-xs leading-5 text-slate-500">Ajoutez une image ou une vidéo à la boutique sélectionnée. Les fichiers restent isolés par boutique.</p><div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => openImagePicker("add")} disabled={!selectedStoreId || uploadImageMutation.isPending} className="min-h-10"><ImagePlus className="mr-2 h-4 w-4" />Image</Button><Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={!selectedStoreId || uploadVideoMutation.isPending} className="min-h-10"><Video className="mr-2 h-4 w-4" />Vidéo</Button></div>{imageUploadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{imageUploadError}</p>}{videoUploadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{videoUploadError}</p>}<select value={imageRole} onChange={event => setImageRole(event.target.value as ImageRole)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="free">Image libre</option><option value="logo">Logo</option><option value="banner">Bannière</option><option value="category">Catégorie</option></select></div>}
          {activePanel === "styles" && <p className="mt-4 text-sm leading-6 text-slate-500">Sélectionnez un élément dans le canvas ou les calques pour modifier sa couleur, son fond, sa typographie et ses espacements.</p>}
          {activePanel === "properties" && (selectedComponent ? <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-500">Élément sélectionné : <span className="font-semibold text-slate-800">{selectedTagName}</span></p>{contentEditMode && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">Mode contenu actif : le texte, les liens et les textes alternatifs sont modifiables. Les styles, calques et actions structurelles sont protégés.</p>}
            <div className="flex flex-wrap gap-2"><button type="button" onClick={duplicateSelected} disabled={selectedLocked || contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Copy className="h-3.5 w-3.5" />Dupliquer</button><button type="button" onClick={removeSelected} disabled={selectedLocked || contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Supprimer</button><button type="button" onClick={toggleSelectedLock} disabled={contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{selectedLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{selectedLocked ? "Déverrouiller" : "Verrouiller"}</button></div>
            <label className="block space-y-1.5"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Type className="h-3.5 w-3.5" />Texte</span><textarea value={selectedText} onChange={event => updateSelectedText(event.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700">Lien</span><input type="text" value={selectedHref} onChange={event => updateSelectedAttribute("href", event.target.value)} placeholder="/boutique ou https://…" className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /><span className="text-[11px] text-slate-500">Chemins internes, HTTPS, e-mail et téléphone uniquement.</span></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700">Texte alternatif de l’image</span><input type="text" value={selectedAlt} onChange={event => updateSelectedAttribute("alt", event.target.value)} placeholder="Décrivez l’image" className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label><label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700">Animation sûre</span><select value={selectedAnimation} onChange={event => updateSelectedAnimation(event.target.value)} disabled={contentEditMode} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs disabled:opacity-50">{animationPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select><span className="text-[11px] text-slate-500">CSS uniquement, désactivée automatiquement si le visiteur préfère réduire les mouvements.</span></label>
            <div className="grid grid-cols-2 gap-2">{([['color','Texte'],['backgroundColor','Fond']] as const).map(([key,label]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">{label}</span><input type="text" value={selectedStyles[key]} onChange={event => updateSelectedStyle(key, event.target.value)} placeholder="#172033" className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label>)}</div>
            <div className="grid grid-cols-2 gap-2">{([['fontSize','Taille'],['borderRadius','Arrondi'],['lineHeight','Interligne'],['letterSpacing','Lettres']] as const).map(([key,label]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">{label}</span><input type="text" value={selectedStyles[key]} onChange={event => updateSelectedStyle(key, event.target.value)} placeholder={key === 'fontSize' ? '32px' : key === 'lineHeight' ? '1.5' : key === 'letterSpacing' ? '0.04em' : '12px'} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label>)}</div>
            <div className="grid grid-cols-2 gap-2"><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Alignement</span><select value={selectedStyles.textAlign} onChange={event => updateSelectedStyle('textAlign', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="">Par défaut</option><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option><option value="justify">Justifié</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Espacement interne</span><input type="text" value={selectedStyles.padding} onChange={event => updateSelectedStyle('padding', event.target.value)} placeholder="24px" className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label></div>
            <button type="button" onClick={resetSelectedStyles} disabled={contentEditMode} className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Réinitialiser les styles</button>
            <p className="text-[11px] leading-5 text-slate-500">Les changements restent dans le brouillon privé jusqu’à l’enregistrement.</p>
          </div> : <p className="mt-4 text-sm leading-6 text-slate-500">Sélectionnez un titre, un bouton, une image ou une section dans le canvas pour modifier ses propriétés.</p>)}
          {activePanel === "layers" && <div className="mt-5 border-t border-slate-200 pt-4"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-slate-950">Structure de la page</h4><span className="text-[11px] text-slate-500">{layerItems.length} section{layerItems.length > 1 ? "s" : ""}</span></div><p className="mt-1 text-[11px] text-slate-500">Double-cliquez pour renommer · glissez un calque sur un autre pour le déplacer.</p><div className="mt-3 max-h-[520px] space-y-1.5 overflow-y-auto pr-1">{layerItems.length > 0 ? layerRows.map(({ component: layer, depth }, index) => { const label = String(layer.get?.("name") || layer.get?.("tagName") || layer.get?.("type") || "élément").toLowerCase(); const dynamic = isDynamicCatalogueAttributes(layer.getAttributes?.()); const active = layer === selectedComponent; return <div key={layer.cid || index} draggable onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedLayerRef.current) moveLayerTo(draggedLayerRef.current, layer); draggedLayerRef.current = null; }} onDragStart={event => { event.dataTransfer.setData("text/plain", String(layer.cid || index)); draggedLayerRef.current = layer; }} className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${active ? "border-fuchsia-300 bg-fuchsia-50" : "border-slate-200 bg-white"}`}><button type="button" onDoubleClick={() => renameLayer(layer)} onClick={() => selectLayer(layer)} style={{ paddingLeft: `${depth * 12}px` }} title="Double-cliquez pour renommer" className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-slate-700">{index + 1}. {label}{dynamic ? <span className="ml-1.5 rounded bg-emerald-100 px-1 py-0.5 text-[10px] text-emerald-800">dynamique</span> : null}</button><button type="button" onClick={() => moveLayer(layer, -1)} disabled={index === 0} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Monter"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveLayer(layer, 1)} disabled={index === layerItems.length - 1} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Descendre"><ArrowDown className="h-3.5 w-3.5" /></button></div>; }) : <p className="text-xs text-slate-500">Ajoutez une section pour voir sa structure ici.</p>}</div></div>}
        </aside>
      </div></section>
    <Card className="border-sky-200 bg-sky-50"><CardContent className="flex flex-col gap-3 p-5 text-sm leading-6 text-sky-950 md:flex-row md:items-start"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Sauvegarde privée uniquement</p><p>Le projet est enregistré dans les réglages isolés de la boutique. Cette étape ne publie rien, ne change aucun domaine et n’active aucun paiement.</p></div></CardContent></Card>
  </main></DashboardLayout>;
}
