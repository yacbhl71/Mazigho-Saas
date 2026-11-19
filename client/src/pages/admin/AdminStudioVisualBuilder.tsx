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
type LibraryImage = { id: string; family: string; label: string; alt: string; url: string; sourceUrl: string };

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
  { id: "mazigho-hero", label: "Hero MAZIGHO", category: "MAZIGHO", content: `<section data-mazigho-hero="true" style="padding:86px 32px;background:linear-gradient(135deg,#172033 0%,#263653 58%,#3d5269 100%);color:#fff"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.15fr .85fr;gap:42px;align-items:center"><div><p style="margin:0;color:#f5b98f;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">Votre univers · Votre signature</p><h1 style="font-size:clamp(38px,6vw,66px);line-height:1.05;margin:16px 0 18px;color:#fff">Une histoire à construire</h1><p style="max-width:590px;margin:0 0 26px;color:#e6ebf2;line-height:1.75;font-size:17px">Présentez votre marque, votre association ou votre projet avec une composition claire, élégante et responsive.</p><div style="display:flex;flex-wrap:wrap;gap:12px"><a href="/boutique" style="display:inline-block;padding:13px 21px;background:#fff;color:#172033;border-radius:8px;text-decoration:none;font-weight:800">Découvrir</a><a href="/a-propos" style="display:inline-block;padding:12px 20px;border:1px solid rgba(255,255,255,.65);color:#fff;border-radius:8px;text-decoration:none;font-weight:700">En savoir plus</a></div></div><div data-mazigho-hero-image-zone="true" style="position:relative;min-height:250px;padding:16px;border:1px solid rgba(255,255,255,.25);border-radius:22px;background:linear-gradient(145deg,rgba(245,185,143,.22),rgba(255,255,255,.06));box-shadow:0 24px 60px rgba(0,0,0,.18)"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='620' viewBox='0 0 900 620'%3E%3Crect width='900' height='620' fill='%233d5269'/%3E%3Ccircle cx='450' cy='250' r='130' fill='%23f5b98f' fill-opacity='.55'/%3E%3Cpath d='M0 500 Q230 340 450 500 T900 500 V620 H0Z' fill='%23172033' fill-opacity='.65'/%3E%3Ctext x='450' y='560' text-anchor='middle' font-family='Arial' font-size='28' fill='%23ffffff'%3EImage du Hero%3C/text%3E%3C/svg%3E" alt="Image du Hero à remplacer" data-mazigho-hero-image="true" style="display:block;width:100%;max-width:100%;height:250px;object-fit:cover;border-radius:16px" /><p style="margin:12px 0 0;color:#f0d3bd;font-size:12px;text-align:center">Sélectionnez cette image puis utilisez « Remplacer » ou la Médiathèque.</p></div></div></section>` },
  { id: "mazigho-header", label: "Navbar / menu", category: "MAZIGHO · Mise en page", content: `<header data-mazigho-header="true" style="padding:16px 28px;background:#fff;color:#172033;border-bottom:1px solid #e8e3dd"><div style="max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:22px"><a href="/" aria-label="Accueil" style="display:inline-flex;align-items:center;gap:10px;color:#172033;text-decoration:none;font-weight:800;font-size:20px;letter-spacing:.02em">Votre marque</a><nav aria-label="Navigation principale" data-mazigho-desktop-nav="true" style="display:flex;align-items:center;justify-content:center;gap:20px;flex:1"><a href="/" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Accueil</a><a href="/a-propos" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">À propos</a><a href="/services" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Nos actions</a><a href="/contact" style="color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/contact" data-mazigho-header-cta="true" style="display:inline-block;padding:10px 16px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap">Nous contacter</a><details data-mazigho-mobile-menu="true" style="display:none;position:relative"><summary aria-label="Ouvrir le menu" style="cursor:pointer;list-style:none;padding:9px 11px;border:1px solid #d8d0c7;border-radius:8px;font-size:0"><span style="font-size:18px">☰</span></summary><div style="position:absolute;right:0;top:46px;z-index:10;min-width:190px;padding:12px;background:#fff;border:1px solid #e8e3dd;border-radius:10px;box-shadow:0 12px 30px rgba(23,32,51,.14)"><a href="/" style="display:block;padding:10px 8px;color:#172033;text-decoration:none">Accueil</a><a href="/a-propos" style="display:block;padding:10px 8px;color:#172033;text-decoration:none">À propos</a><a href="/services" style="display:block;padding:10px 8px;color:#172033;text-decoration:none">Nos actions</a><a href="/contact" style="display:block;padding:10px 8px;color:#172033;text-decoration:none">Contact</a></div></details></div></header>` },
  { id: "mazigho-header-advanced", label: "Navbar avancée + sous-menus", category: "MAZIGHO · Mise en page", content: `<header data-mazigho-advanced-header="true" style="padding:16px 28px;background:#fff;color:#172033;border-bottom:1px solid #e8e3dd"><div style="max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap"><a href="/" aria-label="Accueil" style="color:#172033;text-decoration:none;font-weight:800;font-size:20px;letter-spacing:.02em">Votre association</a><nav aria-label="Navigation principale" style="display:flex;align-items:center;justify-content:center;gap:8px;flex:1;flex-wrap:wrap"><a href="/" style="padding:9px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">Accueil</a><a href="/actualites" style="padding:9px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">Actualités</a><details data-mazigho-submenu="true" style="position:relative"><summary style="cursor:pointer;list-style:none;padding:9px 12px;color:#172033;font-size:14px;font-weight:600">Nos activités⌄</summary><div style="position:absolute;left:0;top:42px;z-index:20;min-width:210px;padding:8px;background:#fff;border:1px solid #e8e3dd;border-radius:10px;box-shadow:0 12px 30px rgba(23,32,51,.14)"><a href="/activites/ateliers" style="display:block;padding:10px 12px;color:#172033;text-decoration:none;font-size:14px">Ateliers</a><a href="/activites/evenements" style="display:block;padding:10px 12px;color:#172033;text-decoration:none;font-size:14px">Événements</a><a href="/activites/partenaires" style="display:block;padding:10px 12px;color:#172033;text-decoration:none;font-size:14px">Partenaires</a></div></details><details data-mazigho-submenu="true" style="position:relative"><summary style="cursor:pointer;list-style:none;padding:9px 12px;color:#172033;font-size:14px;font-weight:600">Ressources⌄</summary><div style="position:absolute;left:0;top:42px;z-index:20;min-width:210px;padding:8px;background:#fff;border:1px solid #e8e3dd;border-radius:10px;box-shadow:0 12px 30px rgba(23,32,51,.14)"><a href="/ressources/documents" style="display:block;padding:10px 12px;color:#172033;text-decoration:none;font-size:14px">Documents</a><a href="/ressources/faq" style="display:block;padding:10px 12px;color:#172033;text-decoration:none;font-size:14px">FAQ</a></div></details><a href="/a-propos" style="padding:9px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">L’association</a><a href="/contact" style="padding:9px 12px;color:#172033;text-decoration:none;font-size:14px;font-weight:600">Contact</a></nav><a href="/don" style="display:inline-block;padding:10px 16px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap">Nous soutenir</a></div></header>` },
  { id: "mazigho-image", label: "Image autonome", category: "MAZIGHO", content: `<figure style="margin:0;padding:24px;text-align:center"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Crect width='1200' height='700' fill='%23e9e2d9'/%3E%3Ccircle cx='600' cy='300' r='120' fill='%23c9b7a2'/%3E%3Cpath d='M0 560 Q300 380 600 560 T1200 560 V700 H0Z' fill='%23b5c3bd'/%3E%3Ctext x='600' y='620' text-anchor='middle' font-family='Arial' font-size='34' fill='%23343b42'%3EVotre image%3C/text%3E%3C/svg%3E" alt="Image de démonstration à remplacer" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:14px" /></figure>` },
  { id: "mazigho-image-text", label: "Image + texte", category: "MAZIGHO", content: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;padding:48px 28px"><div style="height:260px;background:linear-gradient(135deg,#ead9c9,#b9c8c7);border-radius:14px"></div><div><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Bloc éditorial</p><h2 style="font-size:30px;margin:10px 0">Racontez votre sélection</h2><p style="line-height:1.7;color:#4b5563">Remplacez cette image et ce texte par les contenus propres à votre boutique.</p></div></section>` },
  { id: "mazigho-products", label: "Grille produits", category: "MAZIGHO", content: `<section style="padding:42px 28px"><h2 style="font-size:28px;margin-bottom:20px">Sélection du moment</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><article><div style="height:180px;background:#e7e4df;border-radius:10px"></div><h3>Produit exemple</h3><p>49,00 CHF</p></article><article><div style="height:180px;background:#d9e1df;border-radius:10px"></div><h3>Produit exemple</h3><p>69,00 CHF</p></article><article><div style="height:180px;background:#ded8d1;border-radius:10px"></div><h3>Produit exemple</h3><p>89,00 CHF</p></article></div></section>` },
  { id: "mazigho-banner", label: "Bannière de campagne", category: "MAZIGHO · Image", content: `<section data-mazigho-banner="true" style="padding:58px 28px;background:linear-gradient(100deg,#ead9c9 0%,#f5eee7 52%,#d9e1df 100%);color:#172033"><div style="max-width:980px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:28px;flex-wrap:wrap"><div style="flex:1 1 520px"><p style="margin:0;color:#9b563e;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase">Message à mettre en avant</p><h2 style="font-size:clamp(28px,4vw,42px);line-height:1.12;margin:12px 0;color:#172033">Une annonce qui se remarque</h2><p style="max-width:650px;margin:0;color:#3f4a56;line-height:1.7;font-size:16px">Présentez une campagne, une collection, un événement ou une promesse importante sans perdre en lisibilité.</p></div><a href="/collections" style="display:inline-block;padding:13px 20px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-weight:800;white-space:nowrap">Découvrir l’annonce</a></div></section>` },
  { id: "mazigho-heading", label: "Titre + introduction", category: "MAZIGHO · Contenu", content: `<section style="padding:42px 28px;text-align:center"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.16em;font-size:12px">Votre sélection</p><h2 style="font-size:34px;margin:10px 0">Un titre qui attire l’attention</h2><p style="max-width:620px;margin:0 auto;color:#5b6470;line-height:1.7">Présentez une collection, une histoire ou une promesse en quelques mots clairs.</p></section>` },
  { id: "mazigho-button-row", label: "Boutons d’action", category: "MAZIGHO · Conversion", content: `<section style="padding:28px;text-align:center"><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px"><a href="/boutique" style="display:inline-block;padding:13px 22px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Découvrir la collection</a><a href="/a-propos" style="display:inline-block;padding:13px 22px;border:1px solid #172033;color:#172033;border-radius:8px;text-decoration:none;font-weight:600">En savoir plus</a></div></section>` },
  { id: "mazigho-testimonial", label: "Témoignage client", category: "MAZIGHO · Conversion", content: `<section style="padding:48px 28px;background:#faf8f5;text-align:center"><blockquote style="max-width:680px;margin:0 auto;font-size:24px;line-height:1.5;color:#172033">“Une expérience simple, élégante et pensée avec soin.”</blockquote><p style="margin:18px 0 0;color:#a45f46;font-weight:700">— Prénom du client</p></section>` },
  { id: "mazigho-newsletter", label: "Inscription newsletter", category: "MAZIGHO · Conversion", content: `<section style="padding:48px 28px;background:#172033;color:#fff;text-align:center"><h2 style="font-size:28px;margin:0 0 10px">Restez informé</h2><p style="max-width:520px;margin:0 auto 22px;opacity:.8">Recevez les nouveautés et les sélections de votre boutique.</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px"><input type="email" aria-label="Votre adresse e-mail" placeholder="Votre adresse e-mail" style="min-height:44px;width:280px;padding:0 14px;border:0;border-radius:8px" /><button type="button" style="min-height:44px;padding:0 18px;background:#f5b98f;color:#172033;border:0;border-radius:8px;font-weight:700">S’inscrire</button></div></section>` },
  { id: "mazigho-spacer", label: "Espaceur", category: "MAZIGHO · Mise en page", content: `<div style="height:48px" data-mazigho-spacer="true"></div>` },
  { id: "mazigho-faq", label: "FAQ", category: "MAZIGHO · Contenu", content: `<section style="padding:48px 28px;background:#fff"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Besoin d’aide ?</p><h2 style="font-size:30px;margin:10px 0 24px">Questions fréquentes</h2><div data-mazigho-repeatable="faq" style="max-width:820px;margin:0 auto"><details data-mazigho-repeatable-item="faq" style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Quels sont les délais de livraison ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Ajoutez ici une réponse claire et utile pour vos clients.</p></details><details data-mazigho-repeatable-item="faq" style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Comment choisir la bonne option ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Présentez vos conseils, garanties ou conditions.</p></details><details data-mazigho-repeatable-item="faq" style="border-top:1px solid #d8dce2;padding:18px 0"><summary style="cursor:pointer;font-weight:700;color:#172033">Puis-je vous contacter ?</summary><p style="margin:12px 0 0;color:#5b6470;line-height:1.7">Indiquez le canal de contact privilégié de votre boutique.</p></details></div></section>` },
  { id: "mazigho-category-grid", label: "Grille de catégories", category: "MAZIGHO · Catalogue", content: `<section style="padding:48px 28px"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Explorer</p><h2 style="font-size:30px;margin:10px 0 24px">Nos catégories</h2><div data-mazigho-repeatable="categories" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px"><a data-mazigho-repeatable-item="categories" href="/categories/1" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#ead9c9;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 1</h3></a><a data-mazigho-repeatable-item="categories" href="/categories/2" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#d9e1df;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 2</h3></a><a data-mazigho-repeatable-item="categories" href="/categories/3" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#e4d9df;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 3</h3></a><a data-mazigho-repeatable-item="categories" href="/categories/4" style="display:block;color:#172033;text-decoration:none"><div style="height:150px;background:#ded8d1;border-radius:12px"></div><h3 style="margin:10px 0 0;font-size:16px">Catégorie 4</h3></a></div></section>` },
  { id: "mazigho-promo-bar", label: "Bandeau promotionnel", category: "MAZIGHO · Conversion", content: `<section style="padding:18px 24px;background:#f5b98f;color:#172033;text-align:center"><p style="margin:0;font-size:14px;font-weight:700">Une attention spéciale pour votre prochaine commande · <a href="/promotions" style="color:#172033;text-decoration:underline">Découvrir l’offre</a></p></section>` },
  { id: "mazigho-trust-row", label: "Réassurance", category: "MAZIGHO · Conversion", content: `<section style="padding:30px 24px;border-top:1px solid #e5e1dc;border-bottom:1px solid #e5e1dc"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;text-align:center"><div><strong style="display:block;color:#172033">Livraison suivie</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Une expérience claire de la commande à la réception.</span></div><div><strong style="display:block;color:#172033">Paiement sécurisé</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Des moyens de paiement adaptés à votre boutique.</span></div><div><strong style="display:block;color:#172033">Service attentionné</strong><span style="display:block;margin-top:6px;color:#6b6259;font-size:13px">Une réponse humaine lorsque vous en avez besoin.</span></div></div></section>` },
  { id: "mazigho-steps", label: "Étapes en 3 points", category: "MAZIGHO · Contenu", content: `<section style="padding:52px 28px;background:#faf8f5"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">Notre méthode</p><h2 style="font-size:30px;margin:10px 0 26px">Pensé pour vous accompagner</h2><div data-mazigho-repeatable="steps" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px"><article data-mazigho-repeatable-item="steps" style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">01</strong><h3 style="margin:12px 0 8px">Choisir</h3><p style="margin:0;color:#5b6470;line-height:1.6">Explorez la sélection et trouvez ce qui vous correspond.</p></article><article data-mazigho-repeatable-item="steps" style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">02</strong><h3 style="margin:12px 0 8px">Personnaliser</h3><p style="margin:0;color:#5b6470;line-height:1.6">Composez votre expérience avec des détails qui comptent.</p></article><article data-mazigho-repeatable-item="steps" style="padding:22px;background:#fff;border-radius:14px"><strong style="font-size:28px;color:#a45f46">03</strong><h3 style="margin:12px 0 8px">Recevoir</h3><p style="margin:0;color:#5b6470;line-height:1.6">Suivez chaque étape jusqu’à votre prochaine découverte.</p></article></div></section>` },
  { id: "mazigho-stats", label: "Chiffres clés", category: "MAZIGHO · Marque", content: `<section style="padding:42px 28px;background:#172033;color:#fff"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center"><div><strong style="display:block;font-size:30px;color:#f5b98f">10+</strong><span style="font-size:12px;opacity:.75">années d’expertise</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">98%</strong><span style="font-size:12px;opacity:.75">clients satisfaits</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">24h</strong><span style="font-size:12px;opacity:.75">pour vous répondre</span></div><div><strong style="display:block;font-size:30px;color:#f5b98f">100%</strong><span style="font-size:12px;opacity:.75">sélection soignée</span></div></div></section>` },
  { id: "mazigho-footer", label: "Pied de page éditorial", category: "MAZIGHO · Mise en page", content: `<footer style="padding:42px 28px;background:#f2eee9;color:#172033"><div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:24px"><div><h2 style="margin:0 0 10px;font-size:24px">Votre marque</h2><p style="margin:0;max-width:360px;color:#5b6470;line-height:1.6">Une signature éditoriale claire, avec les informations essentielles à portée de main.</p></div><div><strong>Explorer</strong><a href="/boutique" style="display:block;margin-top:12px;color:#5b6470;text-decoration:none">La boutique</a><a href="/contact" style="display:block;margin-top:8px;color:#5b6470;text-decoration:none">Contact</a></div><div><strong>Suivez-nous</strong><p style="margin:12px 0 0;color:#5b6470">Instagram · Pinterest · Newsletter</p></div></div><p style="margin:30px 0 0;border-top:1px solid #d8d0c7;padding-top:18px;color:#7a7168;font-size:12px">© Votre marque · Tous droits réservés</p></footer>` },
  { id: "mazigho-footer-advanced", label: "Footer avancé / colonnes", category: "MAZIGHO · Mise en page", content: `<footer data-mazigho-advanced-footer="true" style="padding:54px 28px 22px;background:#172033;color:#fff"><div style="max-width:1180px;margin:0 auto"><div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1.4fr;gap:28px"><div><h2 style="margin:0 0 12px;font-size:25px">Votre association</h2><p style="margin:0;max-width:290px;color:#cbd2dc;line-height:1.7">Présentez votre mission, vos valeurs et l’impact de vos actions en quelques mots.</p><p style="margin:18px 0 0;color:#f5b98f;font-weight:700">Instagram · Facebook · LinkedIn</p></div><div><h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#f5b98f">L’association</h3><a href="/a-propos" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Qui sommes-nous ?</a><a href="/equipe" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Notre équipe</a><a href="/contact" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Contact</a></div><div><h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#f5b98f">Participer</h3><a href="/activites" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Nos activités</a><a href="/benevolat" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Devenir bénévole</a><a href="/don" style="display:block;margin-top:9px;color:#fff;text-decoration:none">Faire un don</a></div><div><h3 style="margin:0 0 12px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#f5b98f">Recevoir nos nouvelles</h3><p style="margin:0 0 14px;color:#cbd2dc;line-height:1.6">Ajoutez ici votre promesse de newsletter.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><input type="email" aria-label="Votre adresse e-mail" placeholder="Votre e-mail" style="min-height:42px;min-width:0;flex:1;padding:0 12px;border:0;border-radius:7px;background:#fff;color:#172033" /><button type="button" style="min-height:42px;padding:0 14px;border:0;border-radius:7px;background:#f5b98f;color:#172033;font-weight:700">S’inscrire</button></div></div></div><div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:42px;padding-top:18px;border-top:1px solid rgba(255,255,255,.18);color:#aeb8c5;font-size:12px"><span>© Votre association · Tous droits réservés</span><span><a href="/mentions-legales" style="color:#aeb8c5;text-decoration:none">Mentions légales</a> · <a href="/confidentialite" style="color:#aeb8c5;text-decoration:none">Confidentialité</a></span></div></div></footer>` },
  { id: "mazigho-seo-editorial", label: "Texte éditorial SEO", category: "MAZIGHO · Contenu", content: `<section style="padding:48px 28px;max-width:900px;margin:0 auto"><p style="margin:0;color:#a45f46;text-transform:uppercase;letter-spacing:.14em;font-size:12px">L’univers de votre boutique</p><h2 style="font-size:30px;margin:10px 0 18px">Des choix pensés pour votre quotidien</h2><p style="margin:0;color:#5b6470;line-height:1.8">Présentez ici votre expertise, vos matières, votre savoir-faire et les bénéfices de votre sélection. Ce texte peut être adapté avec les mots-clés réellement recherchés par vos clients afin d’améliorer la compréhension de votre offre et le référencement naturel de la page.</p></section>` },
  { id: "mazigho-contact-cta", label: "Appel au contact", category: "MAZIGHO · Conversion", content: `<section style="padding:44px 28px;background:#ead9c9;text-align:center"><h2 style="font-size:30px;margin:0 0 10px;color:#172033">Une question avant de choisir ?</h2><p style="max-width:560px;margin:0 auto 20px;color:#4b5563;line-height:1.6">Notre équipe vous accompagne avec une réponse claire et personnalisée.</p><a href="/contact" style="display:inline-block;padding:13px 22px;background:#172033;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Nous contacter</a></section>` },
  { id: "mazigho-review-highlight", label: "Avis mis en avant", category: "MAZIGHO · Conversion", content: `<section style="padding:46px 28px;text-align:center"><div style="display:inline-flex;gap:4px;color:#a45f46;font-size:20px" aria-label="Cinq étoiles">★★★★★</div><blockquote style="max-width:680px;margin:14px auto 0;font-size:22px;line-height:1.55;color:#172033">“Une sélection cohérente, un accompagnement attentif et une commande qui correspond exactement à nos attentes.”</blockquote><p style="margin:14px 0 0;color:#6b6259;font-size:13px">— Client vérifié</p></section>` },
];

const imageLibrary: LibraryImage[] = [
  { id: "linen-studio", family: "Mode & lifestyle", label: "Atelier lumineux", alt: "Atelier lumineux avec matières naturelles", url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/fashion-studio" },
  { id: "neutral-fashion", family: "Mode & lifestyle", label: "Détails mode", alt: "Détails d’une tenue dans des tons neutres", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/fashion" },
  { id: "beauty-bottle", family: "Beauté & bien-être", label: "Soin minimal", alt: "Flacon de soin posé sur une surface claire", url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/skincare" },
  { id: "botanical-care", family: "Beauté & bien-être", label: "Botanique", alt: "Feuilles et produits de soin naturels", url: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/natural-beauty" },
  { id: "ceramic-home", family: "Maison & décoration", label: "Objet déco", alt: "Objet de décoration en céramique dans un intérieur clair", url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/home-decor" },
  { id: "interior-light", family: "Maison & décoration", label: "Intérieur clair", alt: "Intérieur lumineux aux lignes épurées", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/interior" },
  { id: "food-market", family: "Épicerie & terroir", label: "Sélection gourmande", alt: "Sélection de produits gourmands sur une table", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/market" },
  { id: "travel-coast", family: "Voyage & expériences", label: "Évasion", alt: "Paysage côtier lumineux", url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=72&fm=webp", sourceUrl: "https://unsplash.com/s/photos/travel" },
];

const imageFamilies = ["Toutes", ...Array.from(new Set(imageLibrary.map(image => image.family)))];

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

const responsiveEditorCss = `*{box-sizing:border-box}figure[data-mazigho-image-frame]{max-width:100%;margin-left:auto !important;margin-right:auto !important}img,video{max-width:100%;height:auto}a,button,input,textarea,select{max-width:100%;overflow-wrap:anywhere}table{display:block;max-width:100%;overflow-x:auto}pre{max-width:100%;overflow-x:auto;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:767px){section{padding-left:18px !important;padding-right:18px !important}section[style*="grid-template-columns"],section > div[style*="grid-template-columns"]{grid-template-columns:1fr !important}section > div[style*="display:flex"]{flex-direction:column !important;align-items:stretch !important}section input,section button,section a{width:100% !important;margin-left:0 !important;margin-right:0 !important}[data-mazigho-header] > div{gap:12px !important}[data-mazigho-desktop-nav],[data-mazigho-header-cta]{display:none !important}[data-mazigho-mobile-menu]{display:block !important}[data-mazigho-mobile-menu] a{width:auto !important;margin:0 !important}[data-mazigho-advanced-header] nav{width:100% !important;justify-content:flex-start !important}[data-mazigho-advanced-header] nav > a,[data-mazigho-advanced-header] summary{padding:9px 8px !important}[data-mazigho-advanced-header] [data-mazigho-submenu] > div{position:static !important;box-shadow:none !important;margin:4px 0 8px !important;width:100% !important}[data-mazigho-hero-image]{height:220px !important;width:100% !important}}@media(max-width:767px){[data-mazigho-advanced-footer]{padding:38px 18px 18px !important}[data-mazigho-advanced-footer] > div > div:first-child{grid-template-columns:1fr !important;gap:24px !important}[data-mazigho-advanced-footer] input{width:auto !important;flex:1 1 150px !important;margin:0 !important}[data-mazigho-advanced-footer] button{width:auto !important;margin:0 !important}[data-mazigho-advanced-footer] > div > div:last-child{margin-top:28px !important}}`;
const responsiveEditorCssWithAnimations = `${responsiveEditorCss}@keyframes mazighoFadeIn{from{opacity:0}to{opacity:1}}@keyframes mazighoRiseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes mazighoZoomIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}@media(prefers-reduced-motion:reduce){[style*="animation"],[class*="mazigho-animate"]{animation:none !important;transition:none !important}}`;
const animationPresets = [{ id: "none", label: "Aucune" }, { id: "mazighoFadeIn", label: "Fondu" }, { id: "mazighoRiseIn", label: "Apparition vers le haut" }, { id: "mazighoZoomIn", label: "Zoom léger" }] as const;
const panelToneClasses = {
  pages: "bg-sky-600 text-white shadow-sm ring-2 ring-sky-300",
  blocks: "bg-violet-600 text-white shadow-sm ring-2 ring-violet-300",
  media: "bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300",
  layers: "bg-teal-600 text-white shadow-sm ring-2 ring-teal-300",
  styles: "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300",
  review: "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300",
  properties: "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300",
} as const;

const panelInactiveToneClasses = {
  pages: "border border-sky-200/80 bg-sky-50/70 text-sky-900 hover:bg-sky-100/80",
  blocks: "border border-violet-200/80 bg-violet-50/70 text-violet-900 hover:bg-violet-100/80",
  media: "border border-amber-200/80 bg-amber-50/70 text-amber-950 hover:bg-amber-100/80",
  layers: "border border-teal-200/80 bg-teal-50/70 text-teal-900 hover:bg-teal-100/80",
  styles: "border border-indigo-200/80 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/80",
  review: "border border-rose-200/80 bg-rose-50/70 text-rose-900 hover:bg-rose-100/80",
  properties: "border border-emerald-200/80 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/80",
} as const;

const panelDotClasses = {
  pages: "bg-sky-400",
  blocks: "bg-violet-400",
  media: "bg-amber-400",
  layers: "bg-teal-400",
  styles: "bg-indigo-400",
  review: "bg-rose-400",
  properties: "bg-emerald-400",
} as const;

const panelBannerMeta = {
  pages: { title: "Organisation & SEO", subtitle: "Gérez vos pages, permaliens et métadonnées de partage.", className: "border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-950", badge: "bg-sky-100 text-sky-800" },
  blocks: { title: "Bibliothèque de blocs", subtitle: "Ajoutez des sections prêtes à l’emploi en un clic.", className: "border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-950", badge: "bg-violet-100 text-violet-800" },
  media: { title: "Médiathèque & Vidéo", subtitle: "Insérez des visuels WebP optimisés ou vos propres médias.", className: "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950", badge: "bg-amber-100 text-amber-900" },
  layers: { title: "Structure & Calques", subtitle: "Repérez chaque élément par couleur et réorganisez la page.", className: "border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-950", badge: "bg-teal-100 text-teal-800" },
  styles: { title: "Palette & Style rapide", subtitle: "Harmonisez les couleurs, polices et espacements de l’élément.", className: "border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-950", badge: "bg-indigo-100 text-indigo-800" },
  review: { title: "Revue & Vérification", subtitle: "Recherchez/remplacez du texte et notez vos retours privés.", className: "border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-950", badge: "bg-rose-100 text-rose-800" },
  properties: { title: "Propriétés de l’élément", subtitle: "Modifiez le texte, le lien, l’animation et la typographie.", className: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950", badge: "bg-emerald-100 text-emerald-800" },
} as const;

function getLayerToneMeta(rawLabel: string) {
  const clean = rawLabel.trim().toLowerCase();
  if (["section", "header", "footer", "main", "article", "nav", "div", "aside"].includes(clean)) {
    return {
      family: "Conteneur",
      rowClass: "border-l-4 border-l-violet-500 border-violet-200 bg-violet-50/60 hover:bg-violet-100/70 text-violet-950",
      badgeClass: "bg-violet-100 text-violet-800 border border-violet-200",
      dotClass: "bg-violet-500",
    };
  }
  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(clean)) {
    return {
      family: "Titre",
      rowClass: "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-950",
      badgeClass: "bg-amber-100 text-amber-900 border border-amber-200",
      dotClass: "bg-amber-500",
    };
  }
  if (["img", "picture", "figure", "video", "svg"].includes(clean) || clean.includes("image")) {
    return {
      family: "Média",
      rowClass: "border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950",
      badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      dotClass: "bg-emerald-500",
    };
  }
  if (["a", "button", "input", "form", "select"].includes(clean) || clean.includes("link")) {
    return {
      family: "Action",
      rowClass: "border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-950",
      badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
      dotClass: "bg-rose-500",
    };
  }
  return {
    family: "Texte",
    rowClass: "border-l-4 border-l-sky-500 border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 text-sky-950",
    badgeClass: "bg-sky-100 text-sky-800 border border-sky-200",
    dotClass: "bg-sky-500",
  };
}

function getFriendlyLayerLabel(component: any) {
  const raw = String(component?.get?.("name") || component?.get?.("tagName") || component?.get?.("type") || "element").trim();
  const customName = String(component?.get?.("name") || "").trim();
  const tag = String(component?.get?.("tagName") || component?.get?.("type") || "").toLowerCase();
  if (customName && customName.toLowerCase() !== tag) return customName;
  const labels: Record<string, string> = {
    body: "Page entière", header: "En-tête / menu", footer: "Pied de page", main: "Contenu principal", section: "Section de contenu", article: "Article", nav: "Menu de navigation", aside: "Colonne latérale", div: "Bloc de contenu", details: "Menu déroulant", summary: "Titre du sous-menu", a: "Lien / bouton", button: "Bouton", input: "Champ de saisie", form: "Formulaire", select: "Liste de choix", img: "Image", picture: "Image", figure: "Illustration", video: "Vidéo", svg: "Icône", p: "Paragraphe", textnode: "Texte", text: "Texte", h1: "Grand titre", h2: "Titre", h3: "Sous-titre", h4: "Petit titre", h5: "Petit titre", h6: "Petit titre"
  };
  return labels[tag] || labels[raw.toLowerCase()] || raw;
}
function getBlockCategoryTone(category: string) {
  if (category.includes("Conversion")) {
    return { card: "border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/40 hover:bg-rose-50", badge: "bg-rose-100 text-rose-800" };
  }
  if (category.includes("Catalogue")) {
    return { card: "border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50", badge: "bg-emerald-100 text-emerald-800" };
  }
  if (category.includes("Image")) {
    return { card: "border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40 hover:bg-amber-50", badge: "bg-amber-100 text-amber-900" };
  }
  if (category.includes("Contenu")) {
    return { card: "border-l-4 border-l-sky-500 border-sky-200 bg-sky-50/40 hover:bg-sky-50", badge: "bg-sky-100 text-sky-800" };
  }
  if (category.includes("Mise en page")) {
    return { card: "border-l-4 border-l-teal-500 border-teal-200 bg-teal-50/40 hover:bg-teal-50", badge: "bg-teal-100 text-teal-800" };
  }
  return { card: "border-l-4 border-l-violet-500 border-violet-200 bg-violet-50/40 hover:bg-violet-50", badge: "bg-violet-100 text-violet-800" };
}

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
    free: "display:block;width:100%;max-width:100%;height:auto;max-height:520px;object-fit:cover;border-radius:14px",
    logo: "display:block;width:auto;max-width:260px;height:96px;object-fit:contain;margin:0 auto",
    banner: "display:block;width:100%;aspect-ratio:16/6;object-fit:cover;object-position:center;border-radius:14px",
    category: "display:block;width:100%;aspect-ratio:4/3;object-fit:cover;object-position:center;border-radius:14px",
  };
  const labels: Record<ImageRole, string> = { free: "Image ajoutée dans le constructeur", logo: "Logo de la boutique", banner: "Bannière de la boutique", category: "Image de catégorie" };
  return `<figure data-mazigho-image-frame="true" data-mazigho-image-role="${role}" style="max-width:100%;margin:0 auto;padding:24px;text-align:center"><img src="${escapeHtml(url)}" alt="${labels[role]}" loading="lazy" decoding="async" sizes="(max-width: 767px) 100vw, 800px" style="${styles[role]}" /></figure>`;
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
  const [saveTarget, setSaveTarget] = useState<"store" | "independent">("store");
  const [independentProjectTitle, setIndependentProjectTitle] = useState("Projet Studio indépendant");
  const [independentProjectId, setIndependentProjectId] = useState<number | null>(null);
  const [attachStoreId, setAttachStoreId] = useState<number | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [videoUploadError, setVideoUploadError] = useState("");
  const [imageRole, setImageRole] = useState<ImageRole>("free");
  const [imageFamily, setImageFamily] = useState("Toutes");
  const [imageZoom, setImageZoom] = useState(100);
  const [imageFocal, setImageFocal] = useState<"left" | "center" | "right">("center");
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [selectedTagName, setSelectedTagName] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedStyles, setSelectedStyles] = useState({ color: "", backgroundColor: "", fontSize: "", padding: "", borderRadius: "", textAlign: "", lineHeight: "", letterSpacing: "", fontFamily: "", fontWeight: "", width: "", maxWidth: "", height: "", objectFit: "", position: "", top: "", right: "", bottom: "", left: "", zIndex: "", transform: "" });
  const [videoSettings, setVideoSettings] = useState({ controls: false, autoplay: false, loop: false, muted: false, poster: "" });
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
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [contentEditMode, setContentEditMode] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState("none");
  const [activePanel, setActivePanel] = useState<"properties" | "blocks" | "media" | "layers" | "styles" | "pages" | "review">("properties");
  const [blockSearch, setBlockSearch] = useState("");
  const [blockCategoryFilter, setBlockCategoryFilter] = useState("Toutes");
  const [pageSearch, setPageSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
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
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [replaceCount, setReplaceCount] = useState<number | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const draggedLayerRef = useRef<any>(null);
  const renderingPagesRef = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const selectedImageRef = useRef<any>(null);
  const uploadIntentRef = useRef<"add" | "replace">("add");
  const uploadRoleRef = useRef<ImageRole>("free");
  const selected = modes.find(mode => mode.id === selectedMode) ?? modes[0];
  const tone = toneClasses[selected.tone];
  const Icon = selected.icon;
  const visibleLibraryImages = useMemo(() => {
    const needle = mediaSearch.trim().toLowerCase();
    return imageLibrary.filter(image => (imageFamily === "Toutes" || image.family === imageFamily) && (!needle || `${image.label} ${image.family} ${image.alt}`.toLowerCase().includes(needle)));
  }, [imageFamily, mediaSearch]);
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery({ includeAllForInternalProjection: true, page: 1, pageSize: 100 }, { refetchOnWindowFocus: false });
  const stores = inventoryQuery.data?.stores ?? [];
  const projectQuery = trpc.admin.studio.getVisualBuilderProject.useQuery({ storeId: selectedStoreId ?? 0 }, { enabled: selectedStoreId !== null, refetchOnWindowFocus: false });
  const independentProjectsQuery = trpc.admin.studio.listIndependentVisualProjects.useQuery(undefined, { refetchOnWindowFocus: false });
  const independentProjectQuery = trpc.admin.studio.getIndependentVisualProject.useQuery({ id: independentProjectId ?? 0 }, { enabled: independentProjectId !== null, refetchOnWindowFocus: false });
  const cloneSourceQuery = trpc.admin.studio.getVisualBuilderCloneSource.useQuery({ storeId: selectedStoreId ?? 0 }, { enabled: selectedStoreId !== null, refetchOnWindowFocus: false });
  const saveProjectMutation = trpc.admin.studio.saveVisualBuilderProject.useMutation({ onSuccess: () => { setHasUnsavedChanges(false); setSaveError(""); setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })); }, onError: error => setSaveError(error.message?.startsWith("Failed query") ? "La sauvegarde a été refusée par le stockage. Rechargez la page puis réessayez ; aucune publication n’a été effectuée." : error.message || "La sauvegarde n’a pas abouti.") });
  const saveIndependentProjectMutation = trpc.admin.studio.saveIndependentVisualProject.useMutation({ onSuccess: result => { setHasUnsavedChanges(false); setSaveError(""); setLastSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })); void independentProjectsQuery.refetch(); setIndependentProjectId(result.id); setIndependentProjectTitle(result.title); }, onError: error => setSaveError(error.message || "La sauvegarde du projet indépendant n’a pas abouti.") });
  const deleteIndependentProjectMutation = trpc.admin.studio.deleteIndependentVisualProject.useMutation({ onSuccess: () => { setIndependentProjectId(null); setIndependentProjectTitle("Projet Studio indépendant"); void independentProjectsQuery.refetch(); }, onError: error => setSaveError(error.message || "La suppression du projet indépendant a échoué.") });
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
  const editorOptions = useMemo(() => ({ height: "650px", storageManager: false, noticeOnUnload: false, components: initialComponents(selectedMode), style: responsiveEditorCssWithAnimations, blockManager: { blocks: editorBlocks }, deviceManager: { devices: [{ id: "desktop", name: "Ordinateur", width: "" }, { id: "tablet", name: "Tablette", width: "768px", widthMedia: "992px" }, { id: "mobile", name: "Téléphone", width: "320px", widthMedia: "480px" }] } }), [selectedMode]);

  useEffect(() => {
    if (saveTarget === "store" && selectedStoreId === null && stores.length > 0) {
      const preferred = stores.find(store => !store.isPlatformStore) ?? stores[0];
      setSelectedStoreId(preferred.id);
    }
  }, [saveTarget, selectedStoreId, stores]);

  useEffect(() => {
    const editor = editorRef.current;
    if (saveTarget !== "independent" || !editor || independentProjectQuery.isFetching || !independentProjectQuery.data?.project) return;
    editor.loadProjectData(independentProjectQuery.data.project as Parameters<Editor["loadProjectData"]>[0]);
    setSelectedMode((independentProjectQuery.data.mode as BuilderMode) || "blank");
    setIndependentProjectTitle(independentProjectQuery.data.title);
    setHasUnsavedChanges(false);
    setSelectedComponent(null);
  }, [saveTarget, independentProjectQuery.data, independentProjectQuery.isFetching]);

  useEffect(() => {
    const editor = editorRef.current;
    const savedProject = projectQuery.data?.project as Record<string, unknown> | null | undefined;
    if (!editor || projectQuery.isFetching) return;
    if (savedProject) {
      const loadedPages = normalizeBuilderPages(savedProject.pages);
      const loadedPageId = typeof savedProject.activePageId === "string" && loadedPages.some(page => page.id === savedProject.activePageId)
        ? savedProject.activePageId
        : loadedPages[0].id;
      const loadedPage = loadedPages.find(page => page.id === loadedPageId) ?? loadedPages[0];
      setPages(loadedPages);
      setActivePageId(loadedPage.id);
      setPageTitle(loadedPage.title);
      setPageSlug(loadedPage.slug);
      setPageLanguage(loadedPage.settings?.language ?? "fr");
      setPageDescription(loadedPage.settings?.description ?? (typeof savedProject.pageDescription === "string" ? savedProject.pageDescription : ""));
      setSocialCoverUrl(loadedPage.settings?.socialCoverUrl ?? "");
      setFaviconUrl(loadedPage.settings?.faviconUrl ?? "");
      const project = Object.keys(loadedPage.project).length > 0 ? loadedPage.project : savedProject;
      editor.loadProjectData(project as Parameters<Editor["loadProjectData"]>[0]);
    } else if (selectedMode !== "clone") {
      setPages([{ ...defaultBuilderPage, project: {} }]);
      setActivePageId("home");
      setPageTitle("Accueil");
      setPageSlug("/");
      setPageDescription("");
      setSocialCoverUrl("");
      setFaviconUrl("");
      editor.setComponents(initialComponents(selectedMode));
    }
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
    editor.Panels.addButton("options", { id: "mazigho-undo", label: "↶", command: "core:undo", attributes: { title: "Annuler (Ctrl/Cmd+Z)", "aria-label": "Annuler" } });
    editor.Panels.addButton("options", { id: "mazigho-redo", label: "↷", command: "core:redo", attributes: { title: "Rétablir (Ctrl/Cmd+Y)", "aria-label": "Rétablir" } });
    editor.on("component:selected", (component: any) => {
      const isImage = component?.get?.("type") === "image" || component?.get?.("tagName") === "img";
      selectedImageRef.current = isImage ? component : null;
      setHasSelectedImage(isImage);
      setImageZoom(100);
      setImageFocal("center");
      handleSelectedComponent(component);
      setLayerRevision(previous => previous + 1);
    });
    editor.on("component:add component:remove component:update", () => { setLayerRevision(previous => previous + 1); if (!renderingPagesRef.current) { setHasUnsavedChanges(true); setPreflightChecked(false); } });
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

  const getRenderableEditorHtml = (editor: Editor) => {
    const html = editor.getHtml();
    if (html.trim() && !/^<body>\s*<\/body>$/i.test(html.trim())) return html;
    const frame = (editor as Editor & { Canvas?: { getFrameEl?: () => HTMLIFrameElement | undefined } }).Canvas?.getFrameEl?.();
    const body = frame?.contentDocument?.body;
    const wrapper = body?.querySelector('[data-gjs-type="wrapper"]');
    return wrapper?.innerHTML?.trim() || body?.innerHTML?.trim() || html;
  };
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

  const duplicatePage = (pageId: string) => {
    if (!editorRef.current) return;
    const source = capturePages().find(page => page.id === pageId);
    if (!source) return;
    const copyNumber = pages.length + 1;
    const copy: BuilderPage = {
      ...source,
      id: `page-${Date.now()}`,
      title: `${source.title} (copie)`.slice(0, 120),
      slug: source.slug === "/" ? `/page-${copyNumber}` : `${source.slug.replace(/\/$/, "")}-copie-${copyNumber}`,
      project: JSON.parse(JSON.stringify(source.project)) as BuilderPage["project"],
      settings: source.settings ? { ...source.settings } : { language: "fr", description: "", socialCoverUrl: "", faviconUrl: "" },
    };
    setPages(previous => [...previous, copy]);
    setActivePageId(copy.id);
    setPageTitle(copy.title);
    setPageSlug(copy.slug);
    setPageLanguage(copy.settings?.language ?? "fr");
    setPageDescription(copy.settings?.description ?? "");
    setSocialCoverUrl(copy.settings?.socialCoverUrl ?? "");
    setFaviconUrl(copy.settings?.faviconUrl ?? "");
    editorRef.current.loadProjectData(copy.project as Parameters<Editor["loadProjectData"]>[0]);
    editorRef.current.select(undefined);
    setSelectedComponent(null);
    setHasUnsavedChanges(true);
  };

  const deletePage = (pageId: string) => {
    if (pageId === "home" || pages.length <= 1) return;
    const target = pages.find(page => page.id === pageId);
    if (!target || !window.confirm(`Supprimer définitivement la page « ${target.title} » du brouillon ?`)) return;
    const nextPages = capturePages().filter(page => page.id !== pageId);
    const nextPage = nextPages[0];
    if (!nextPage || !editorRef.current) return;
    setPages(nextPages);
    setActivePageId(nextPage.id);
    setPageTitle(nextPage.title);
    setPageSlug(nextPage.slug);
    setPageLanguage(nextPage.settings?.language ?? "fr");
    setPageDescription(nextPage.settings?.description ?? "");
    setSocialCoverUrl(nextPage.settings?.socialCoverUrl ?? "");
    setFaviconUrl(nextPage.settings?.faviconUrl ?? "");
    editorRef.current.loadProjectData(nextPage.project as Parameters<Editor["loadProjectData"]>[0]);
    editorRef.current.select(undefined);
    setSelectedComponent(null);
    setHasUnsavedChanges(true);
  };

  const saveProject = () => {
    if (!editorRef.current) return;
    setSaveError("");
    if (saveTarget === "independent") {
      saveIndependentProjectMutation.mutate({ id: independentProjectId ?? undefined, title: independentProjectTitle.trim() || "Projet Studio indépendant", mode: selectedMode, project: getProjectPayload() });
      return;
    }
    if (!selectedStoreId) return;
    saveProjectMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: getProjectPayload() });
  };

  const attachIndependentProject = () => {
    if (!attachStoreId || !editorRef.current || !independentProjectId) return;
    if (!window.confirm("Copier ce projet vers la boutique choisie ? Le projet original restera dans la Bibliothèque Studio Mazigho.")) return;
    saveProjectMutation.mutate({ storeId: attachStoreId, mode: selectedMode, project: getProjectPayload() }, { onSuccess: () => { setSelectedStoreId(attachStoreId); setSaveTarget("store"); setHasUnsavedChanges(false); setSaveError(""); } });
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
    if (!selectedStoreId || !editorRef.current || !preflightChecked || preflightIssues.length > 0) return;
    const editor = editorRef.current;
    const currentPages = capturePages();
    const currentPage = currentPages.find(page => page.id === activePageId) ?? currentPages[0];
    if (!currentPage) return;
    const activeHtml = getRenderableEditorHtml(editor);
    const activeCss = `${editor.getCss() || ""}\n${responsiveEditorCssWithAnimations}`;
    renderingPagesRef.current = true;
    const publishedPages = currentPages.map(page => {
      const project = page.id === currentPage.id ? currentPage.project : page.project;
      if (page.id === currentPage.id) {
        return { id: page.id, title: page.title, slug: page.slug.startsWith("/") ? page.slug : `/${page.slug}`, html: activeHtml, css: activeCss, settings: { language: page.settings?.language ?? "fr", description: page.settings?.description ?? "", socialCoverUrl: page.settings?.socialCoverUrl ?? "", faviconUrl: page.settings?.faviconUrl ?? "" } };
      }
      editor.loadProjectData(project as Parameters<Editor["loadProjectData"]>[0]);
      return { id: page.id, title: page.title, slug: page.slug.startsWith("/") ? page.slug : `/${page.slug}`, html: getRenderableEditorHtml(editor), css: `${editor.getCss() || ""}\n${responsiveEditorCssWithAnimations}`, settings: { language: page.settings?.language ?? "fr", description: page.settings?.description ?? "", socialCoverUrl: page.settings?.socialCoverUrl ?? "", faviconUrl: page.settings?.faviconUrl ?? "" } };
    });
    editor.loadProjectData(currentPage.project as Parameters<Editor["loadProjectData"]>[0]);
    renderingPagesRef.current = false;
    publishProjectMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: { ...getProjectPayload(), pages: currentPages }, html: publishedPages.find(page => page.id === activePageId)?.html ?? editor.getHtml(), css: publishedPages.find(page => page.id === activePageId)?.css ?? `${editor.getCss() || ""}\n${responsiveEditorCssWithAnimations}`, publishedPages });
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
    // Les images SVG intégrées en data: servent parfois de décor de base au
    // canvas et peuvent porter un alt de démonstration dans leur modèle.
    // Elles ne doivent pas bloquer la publication comme une vraie image média.
    const mediaHtml = html.replace(/<img\b[^>]*\bsrc=["']data:image\/[^"']+["'][^>]*>/gi, "");
    if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(mediaHtml) || /<img\b[^>]*\balt=["']\s*["']/i.test(mediaHtml)) issues.push("Une image semble dépourvue de texte alternatif.");
    if ((html.match(/href=["']#["']/gi) || []).length > 0) issues.push("Un ou plusieurs boutons utilisent encore le lien de démonstration #.");
    // Les SVG/data images peuvent contenir un texte décoratif (par exemple
    // « Votre image ») sans que ce texte fasse partie du contenu éditorial.
    // On retire donc les payloads data avant l’audit des placeholders visibles.
    const editorialHtml = mediaHtml.replace(/data:image\/[a-z0-9.+-]+(?:;base64)?,[^"']+/gi, "");
    if (/Votre image|Produit exemple|Votre marque|Prénom du client|à remplacer|texte de démonstration/i.test(editorialHtml)) issues.push("Des contenus de démonstration doivent être remplacés avant publication.");
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

  const replaceTextInPage = () => {
    const needle = findText.trim();
    if (!needle || !editorRef.current) {
      setReplaceCount(0);
      return;
    }
    let count = 0;
    const replaceIn = (component: any) => {
      if (!component) return;
      if (component.get?.("type") === "textnode") {
        const content = String(component.get?.("content") || "");
        const occurrences = content.split(needle).length - 1;
        if (occurrences > 0) {
          component.set({ content: content.split(needle).join(replaceText) });
          count += occurrences;
        }
      }
      component.components?.().models?.forEach(replaceIn);
    };
    replaceIn(editorRef.current.getWrapper?.());
    setReplaceCount(count);
    if (count > 0) {
      setHasUnsavedChanges(true);
      setSelectedText(previous => previous.includes(needle) ? previous.split(needle).join(replaceText) : previous);
    }
  };

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
    setVideoSettings({ controls: Boolean(attributes.controls), autoplay: Boolean(attributes.autoplay), loop: Boolean(attributes.loop), muted: Boolean(attributes.muted), poster: String(attributes.poster || "") });
    setSelectedStyles({
      color: String(styles.color || ""),
      backgroundColor: String(styles.backgroundColor || ""),
      fontSize: String(styles.fontSize || ""),
      padding: String(styles.padding || ""),
      borderRadius: String(styles.borderRadius || ""),
      textAlign: String(styles.textAlign || ""),
      lineHeight: String(styles.lineHeight || ""),
      letterSpacing: String(styles.letterSpacing || ""),
      fontFamily: String(styles.fontFamily || ""),
      fontWeight: String(styles.fontWeight || ""),
      position: String(styles.position || ""),
      top: String(styles.top || ""),
      right: String(styles.right || ""),
      bottom: String(styles.bottom || ""),
      left: String(styles.left || ""),
      zIndex: String(styles.zIndex || ""),
      transform: String(styles.transform || ""),
      width: String(styles.width || ""),
      maxWidth: String(styles.maxWidth || ""),
      height: String(styles.height || ""),
      objectFit: String(styles.objectFit || ""),
    });
  };

  const findRepeatableAncestor = (component: any, kind?: string) => {
    let current = component;
    for (let depth = 0; current && depth < 12; depth += 1) {
      const attributes = current.getAttributes?.() || {};
      if (attributes["data-mazigho-repeatable-item"] && (!kind || attributes["data-mazigho-repeatable-item"] === kind)) return current;
      current = current.parent?.();
    }
    return null;
  };
  const findRepeatableContainer = (item: any, kind: string) => {
    let current = item?.parent?.();
    for (let depth = 0; current && depth < 12; depth += 1) {
      if (current.getAttributes?.()?.["data-mazigho-repeatable"] === kind) return current;
      current = current.parent?.();
    }
    return null;
  };
  const duplicateRepeatableItem = () => {
    const item = findRepeatableAncestor(selectedComponent);
    const container = item && findRepeatableContainer(item, item.getAttributes?.()?.["data-mazigho-repeatable-item"]);
    if (!item || !container) return;
    const clone = item.clone?.();
    if (clone) { container.append?.(clone); editorRef.current?.select(clone); setLayerRevision(previous => previous + 1); setHasUnsavedChanges(true); }
  };
  const addRepeatableItem = () => duplicateRepeatableItem();
  const removeRepeatableItem = () => {
    const item = findRepeatableAncestor(selectedComponent);
    if (!item) return;
    const container = findRepeatableContainer(item, item.getAttributes?.()?.["data-mazigho-repeatable-item"]);
    if ((container?.components?.().length ?? 0) <= 1) return;
    item.remove?.(); editorRef.current?.select(undefined); setSelectedComponent(null); setLayerRevision(previous => previous + 1); setHasUnsavedChanges(true);
  };

  const anchorSelectedImageToHero = () => {
    if (selectedTagName !== "img" || !selectedComponent || !editorRef.current) return;
    const heroZone = editorRef.current.getWrapper()?.find?.('[data-mazigho-hero-image-zone="true"]')?.[0];
    if (!heroZone) return;
    const placeholder = heroZone.components?.().models?.find((item: any) => item.getAttributes?.()?.["data-mazigho-hero-image"] === "true");
    if (placeholder && placeholder !== selectedComponent) placeholder.remove?.();
    heroZone.append?.(selectedComponent);
    selectedComponent.addStyle?.({ position: "absolute", top: "20px", right: "20px", left: undefined, bottom: undefined, width: "42%", maxWidth: "100%", height: "auto", zIndex: "3", transform: "rotate(0deg) scaleX(1) scaleY(1)" });
    handleSelectedComponent(selectedComponent);
    setHasUnsavedChanges(true);
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
  const updateVideoSetting = (key: keyof typeof videoSettings, value: boolean | string) => {
    if (contentEditMode || selectedTagName !== "video") return;
    setVideoSettings(previous => ({ ...previous, [key]: value }));
    if (selectedComponent?.addAttributes) selectedComponent.addAttributes({ [key]: value || undefined });
    setHasUnsavedChanges(true);
  };

  const resetSelectedStyles = () => {
    if (contentEditMode) return;
    const defaults = { color: "", backgroundColor: "", fontSize: "", padding: "", borderRadius: "", textAlign: "", lineHeight: "", letterSpacing: "", fontFamily: "", fontWeight: "", width: "", maxWidth: "", height: "", objectFit: "", position: "", top: "", right: "", bottom: "", left: "", zIndex: "", transform: "" };
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
  const visiblePages = useMemo(() => {
    const needle = pageSearch.trim().toLowerCase();
    return pages.filter(page => !needle || `${page.title} ${page.slug}`.toLowerCase().includes(needle));
  }, [pageSearch, pages]);
  const filteredEditorBlocks = useMemo(() => {
    const needle = blockSearch.trim().toLowerCase();
    return editorBlocks.filter(block => {
      const matchesCategory = blockCategoryFilter === "Toutes" || block.category === blockCategoryFilter;
      const matchesSearch = !needle || `${block.label} ${block.category}`.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [blockCategoryFilter, blockSearch]);
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

  return <DashboardLayout><style>{`
.mazigho-builder-shell .gjs-editor{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#334155}
.mazigho-builder-shell .gjs-pn-panel{background:#fff;border-color:#e2e8f0;box-shadow:0 8px 24px rgba(148,163,184,.12)}
.mazigho-builder-shell .gjs-pn-panel.gjs-one-bg,.mazigho-builder-shell .gjs-blocks-c,.mazigho-builder-shell .gjs-sm-sectors,.mazigho-builder-shell .gjs-layers{background:#fff !important}
.mazigho-builder-shell .gjs-pn-panel .gjs-two-color,.mazigho-builder-shell .gjs-blocks-c .gjs-two-color,.mazigho-builder-shell .gjs-sm-sectors .gjs-two-color,.mazigho-builder-shell .gjs-layers .gjs-two-color{color:#334155 !important}
.mazigho-builder-shell .gjs-pn-panel .gjs-three-bg,.mazigho-builder-shell .gjs-blocks-c .gjs-three-bg,.mazigho-builder-shell .gjs-sm-sectors .gjs-three-bg{background:#f8fafc !important}
.mazigho-builder-shell .gjs-pn-panel .gjs-four-color,.mazigho-builder-shell .gjs-blocks-c .gjs-four-color{color:#7c3aed !important}
.mazigho-builder-shell .gjs-pn-buttons{gap:4px;padding:6px;background:transparent}
.mazigho-builder-shell .gjs-pn-devices-c{background:linear-gradient(135deg,#e0f2fe,#cffafe) !important;border-bottom:1px solid #7dd3fc !important}
.mazigho-builder-shell .gjs-pn-views{background:linear-gradient(135deg,#fef3c7,#ffedd5) !important;border-bottom:1px solid #fcd34d !important}
.mazigho-builder-shell .gjs-pn-options{background:linear-gradient(135deg,#f3e8ff,#fce7f3) !important;border-bottom:1px solid #d8b4fe !important}
.mazigho-builder-shell .gjs-pn-views-container{border-left:1px solid #cbd5e1;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%) !important;color:#334155 !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-one-bg{background:#fff !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-two-color{color:#334155 !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-three-bg{background:#f8fafc !important}
.mazigho-builder-shell .gjs-clm-tags{background:linear-gradient(135deg,#f5f3ff,#eef2ff) !important;border:1px solid #c4b5fd !important;border-radius:12px !important;margin:8px !important;padding:10px !important;box-shadow:0 2px 8px rgba(124,58,237,.08)}
.mazigho-builder-shell .gjs-clm-tags #gjs-clm-sels-info,.mazigho-builder-shell .gjs-clm-sels-info{color:#4c1d95 !important;font-weight:700 !important;font-size:11px !important}
.mazigho-builder-shell .gjs-clm-tags #gjs-clm-new,.mazigho-builder-shell .gjs-clm-tag{background:#7c3aed !important;color:#fff !important;border-radius:6px !important;padding:3px 8px !important;font-weight:600 !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector{background:#fff !important;border-bottom:1px solid #e2e8f0 !important;margin:6px 6px !important;border-radius:10px !important;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.05)}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector-title{font-weight:700 !important;font-size:12px !important;letter-spacing:.02em;padding:9px 12px !important;border-bottom:1px solid transparent !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector:nth-of-type(1) .gjs-sm-sector-title{background:linear-gradient(90deg,#e0f2fe,#f0f9ff) !important;color:#0369a1 !important;border-left:4px solid #0284c7 !important;border-bottom-color:#bae6fd !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector:nth-of-type(2) .gjs-sm-sector-title{background:linear-gradient(90deg,#f3e8ff,#faf5ff) !important;color:#6d28d9 !important;border-left:4px solid #7c3aed !important;border-bottom-color:#ddd6fe !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector:nth-of-type(3) .gjs-sm-sector-title{background:linear-gradient(90deg,#fef3c7,#fffbeb) !important;color:#b45309 !important;border-left:4px solid #d97706 !important;border-bottom-color:#fde68a !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector:nth-of-type(4) .gjs-sm-sector-title{background:linear-gradient(90deg,#d1fae5,#ecfdf5) !important;color:#047857 !important;border-left:4px solid #059669 !important;border-bottom-color:#a7f3d0 !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-sm-sector:nth-of-type(n+5) .gjs-sm-sector-title{background:linear-gradient(90deg,#ffe4e6,#fff1f2) !important;color:#be123c !important;border-left:4px solid #e11d48 !important;border-bottom-color:#fecdd3 !important}
.mazigho-builder-shell .gjs-sm-property .gjs-sm-label,.mazigho-builder-shell .gjs-trt-trait .gjs-label{color:#1e293b !important;font-weight:600 !important;font-size:11px !important}
.mazigho-builder-shell .gjs-field{background:#f8fafc !important;border:1px solid #cbd5e1 !important;border-radius:8px !important;color:#0f172a !important;box-shadow:inset 0 1px 2px rgba(15,23,42,.04) !important;transition:border-color .15s,box-shadow .15s}
.mazigho-builder-shell .gjs-field:hover{border-color:#94a3b8 !important;background:#fff !important}
.mazigho-builder-shell .gjs-field:focus-within{border-color:#7c3aed !important;background:#fff !important;box-shadow:0 0 0 2px rgba(124,58,237,.18) !important}
.mazigho-builder-shell .gjs-field input,.mazigho-builder-shell .gjs-field select,.mazigho-builder-shell .gjs-input-holder input{color:#0f172a !important;font-weight:600 !important}
.mazigho-builder-shell .gjs-radio-items{background:#f1f5f9 !important;border-radius:7px !important;padding:2px !important;gap:2px !important}
.mazigho-builder-shell .gjs-radio-item{border-radius:6px !important;color:#475569 !important;font-weight:600 !important}
.mazigho-builder-shell .gjs-radio-item input:checked+.gjs-radio-item-label{background:#7c3aed !important;color:#fff !important;border-radius:5px !important;box-shadow:0 1px 3px rgba(124,58,237,.3)}
.mazigho-builder-shell .gjs-pn-views-container .gjs-layer{background:#f8fafc !important;color:#334155 !important;border-bottom:1px solid #e2e8f0;border-left:3px solid #38bdf8;margin:2px 4px;border-radius:6px}
.mazigho-builder-shell .gjs-pn-views-container .gjs-layer:hover{background:#e0f2fe !important;color:#0369a1 !important}
.mazigho-builder-shell .gjs-pn-views-container .gjs-layer.gjs-selected{background:#ccfbf1 !important;color:#115e59 !important;border-left:4px solid #0d9488;font-weight:700}
.mazigho-builder-shell .gjs-blocks-c .gjs-block-category{background:#f3e8ff !important;color:#7e22ce !important;border-bottom:1px solid #e9d5ff}
.mazigho-builder-shell .gjs-pn-devices-c,.mazigho-builder-shell .gjs-pn-views,.mazigho-builder-shell .gjs-pn-options{border-radius:0 0 8px 8px}
.mazigho-builder-shell .gjs-pn-panel [class*="gjs-pn-btn"]{transition:background .18s,color .18s}
.mazigho-builder-shell .gjs-pn-btn{border-radius:8px;color:#475569 !important}
.mazigho-builder-shell .gjs-pn-btn:hover{background:#fff !important;color:#7e22ce !important;box-shadow:0 1px 3px rgba(15,23,42,.08)}
.mazigho-builder-shell .gjs-pn-btn.gjs-pn-active{background:#7c3aed !important;color:#fff !important;box-shadow:0 2px 6px rgba(124,58,237,.3)}
.mazigho-builder-shell .gjs-block{border:1px solid #ddd6fe;border-left:4px solid #8b5cf6;border-radius:10px;background:#faf5ff;box-shadow:0 2px 6px rgba(139,92,246,.08);color:#3b0764}
.mazigho-builder-shell .gjs-block:hover{border-color:#a855f7;background:#f3e8ff;box-shadow:0 4px 12px rgba(168,85,247,.18)}
.mazigho-builder-shell .gjs-block-label{font-weight:600}
.mazigho-builder-shell .gjs-block-category{border-bottom:1px solid #e2e8f0;color:#7e22ce;font-weight:700}
.mazigho-builder-shell .gjs-cv-canvas{background:#eef2f7}
.mazigho-builder-shell .gjs-frame-wrapper{box-shadow:0 12px 30px rgba(15,23,42,.12)}
.mazigho-builder-shell .gjs-toolbar{background:#7e22ce;border-radius:8px;box-shadow:0 4px 12px rgba(126,34,206,.25)}
.mazigho-builder-shell .gjs-selected{outline:2px solid #a855f7 !important;outline-offset:1px}
`}</style><main className="mazigho-builder-shell mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><Layers3 className="mr-1.5 h-3.5 w-3.5" /> MAZIGHO Studio</Badge><Badge variant="outline" className="border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950">Constructeur open source</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Constructeur visuel</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Un canvas inspiré des meilleurs éditeurs visuels, construit sur GrapesJS open source et spécialisé pour les boutiques MAZIGHO.</p></div><Link href="/admin/studio"><Button type="button" variant="outline" className="min-h-11 w-fit">Retour au Studio</Button></Link></header>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">Point de départ</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Comment voulez-vous commencer ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le choix recharge une composition de démonstration dans le canvas privé.</p></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">Étape 1 · Choisir une base</Badge></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{modes.map(mode => { const ModeIcon = mode.icon; const active = selectedMode === mode.id; const modeTone = toneClasses[mode.tone]; return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? `${modeTone.card} ring-2 ring-slate-950/10` : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${modeTone.icon}`}><ModeIcon className="h-5 w-5" /></span>{active && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{mode.eyebrow}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{mode.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{mode.description}</p><span className={`mt-5 inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${active ? modeTone.button : "bg-slate-700 hover:bg-slate-800"}`}>{active ? "Parcours sélectionné" : "Choisir ce parcours"}<ArrowRight className="ml-2 h-4 w-4" /></span></button>; })}</div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Étape 2 · Destination du brouillon</p><h2 className="mt-1 text-xl font-bold text-slate-950">Où enregistrer ce brouillon ?</h2><p className="mt-1 text-sm text-slate-600">Une boutique pour ses données privées, ou la Bibliothèque Studio pour une création indépendante.</p></div><div className="flex w-full flex-col gap-2 md:w-[520px] md:flex-row"><select value={saveTarget} onChange={event => setSaveTarget(event.target.value as "store" | "independent")} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-950/20"><option value="store">Dans une boutique</option><option value="independent">Bibliothèque Studio Mazigho</option></select>{saveTarget === "store" ? <select value={selectedStoreId ?? ""} onChange={event => setSelectedStoreId(Number(event.target.value) || null)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-950/20"><option value="">Sélectionner une boutique</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName} · {store.primaryDomain}</option>)}</select> : <input value={independentProjectTitle} onChange={event => setIndependentProjectTitle(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-violet-300 bg-violet-50/50 px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500" placeholder="Nom du projet indépendant" aria-label="Nom du projet indépendant" />}</div></div>{saveTarget === "independent" && <div className="mt-3 grid gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><p className="text-xs font-bold text-violet-950">Projets enregistrés</p><select value={independentProjectId ?? ""} onChange={event => setIndependentProjectId(Number(event.target.value) || null)} className="mt-2 min-h-10 w-full rounded-lg border border-violet-200 bg-white px-2 text-xs font-semibold text-slate-800"><option value="">Nouveau projet indépendant</option>{(independentProjectsQuery.data ?? []).map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></div><div className="flex flex-wrap items-center gap-2"><select value={attachStoreId ?? ""} onChange={event => setAttachStoreId(Number(event.target.value) || null)} className="min-h-10 max-w-[230px] rounded-lg border border-emerald-200 bg-white px-2 text-xs font-semibold text-slate-800" aria-label="Boutique de destination"><option value="">Choisir une boutique</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName}</option>)}</select><button type="button" disabled={!independentProjectId || !attachStoreId || saveProjectMutation.isPending} onClick={attachIndependentProject} className="min-h-10 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-40">Rattacher à la boutique</button><button type="button" disabled={!independentProjectId || deleteIndependentProjectMutation.isPending} onClick={() => { if (independentProjectId && window.confirm("Supprimer ce projet de la Bibliothèque Studio Mazigho ?")) deleteIndependentProjectMutation.mutate({ id: independentProjectId }); }} className="min-h-10 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40">Supprimer</button></div></div>}{saveTarget === "independent" && <p className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-950">Ce projet sera conservé dans ta Bibliothèque Studio, sans catalogue réel, sans commande et sans clé de paiement. Tu pourras le rattacher à une boutique plus tard.</p>}</section>
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Canvas privé · {selected.title}</p><h2 className="mt-1 text-xl font-bold text-slate-950">Composition MAZIGHO</h2></div></div><p className="mt-3 text-sm text-slate-600">Choisissez un rôle d’image pour appliquer automatiquement ses proportions et son recadrage.</p></div><div className="flex flex-wrap items-center gap-2"><input ref={uploadInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={uploadImage} /><input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={uploadVideo} />{videoUploadError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{videoUploadError}</p>}{imageUploadError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{imageUploadError}</p>}<select value={imageRole} onChange={event => setImageRole(event.target.value as ImageRole)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="free">Image libre</option><option value="logo">Logo</option><option value="banner">Bannière</option><option value="category">Catégorie</option></select>{hasSelectedImage && <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"><span className="text-[11px] font-semibold text-slate-500">Zoom</span><input aria-label="Zoom de l’image" type="range" min="100" max="180" step="5" value={imageZoom} onChange={event => { const value = Number(event.target.value); setImageZoom(value); applyImageCrop(value, imageFocal); }} className="w-20" /><span className="w-8 text-right text-[11px] font-semibold text-slate-600">{imageZoom}%</span><select aria-label="Point focal de l’image" value={imageFocal} onChange={event => { const value = event.target.value as "left" | "center" | "right"; setImageFocal(value); applyImageCrop(imageZoom, value); }} className="rounded border border-slate-300 bg-white px-1 py-1 text-xs"><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select><button type="button" onClick={resetImageCrop} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">Réinitialiser</button></div>}<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">{projectQuery.data?.updatedAt ? "Brouillon chargé" : "Nouveau brouillon"}</Badge><Badge variant="outline" className={hasUnsavedChanges ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>{hasUnsavedChanges ? "Modifications non enregistrées" : lastSavedAt ? `Enregistré à ${lastSavedAt}` : "Prêt à enregistrer"}</Badge><Button type="button" variant="outline" onClick={togglePreview} disabled={!editorRef.current} className="min-h-10">{isPreviewing ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{isPreviewing ? "Quitter l’aperçu" : "Aperçu"}</Button>{saveError && <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{saveError}</p>}<Button type="button" variant="outline" onClick={resetDraft} disabled={!editorRef.current} className="min-h-10">Réinitialiser</Button><Button type="button" variant="outline" onClick={createVersion} disabled={!selectedStoreId || !editorRef.current || createVersionMutation.isPending} className="min-h-10">{createVersionMutation.isPending ? "Versionnement…" : "Créer une version"}</Button>{(projectQuery.data?.versions?.length ?? 0) > 0 && <select aria-label="Restaurer une version privée" defaultValue="" onChange={event => { const value = event.target.value; event.target.value = ""; restoreVersion(value); }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="">Restaurer une version…</option>{projectQuery.data?.versions?.map(version => <option key={version.id} value={version.id}>{new Date(version.createdAt).toLocaleString("fr-FR")}</option>)}</select>}<div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Aperçu responsive"><button type="button" onClick={() => switchDevice("desktop")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "desktop" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Ordinateur</button><button type="button" onClick={() => switchDevice("tablet")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "tablet" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Tablette</button><button type="button" onClick={() => switchDevice("mobile")} className={`rounded-md px-2 py-1.5 text-xs font-semibold ${activeDevice === "mobile" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>Téléphone</button></div><div className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 p-1" role="group" aria-label="Zoom du canvas"><button type="button" onClick={() => setCanvasZoom(previous => Math.max(70, previous - 10))} disabled={canvasZoom <= 70} className="rounded-md px-2 py-1.5 text-xs font-bold text-indigo-800 hover:bg-white disabled:opacity-35" title="Réduire le zoom">−</button><button type="button" onClick={() => setCanvasZoom(100)} className="min-w-12 rounded-md px-2 py-1.5 text-[11px] font-semibold text-indigo-800 hover:bg-white" title="Réinitialiser le zoom">{canvasZoom}%</button><button type="button" onClick={() => setCanvasZoom(previous => Math.min(130, previous + 10))} disabled={canvasZoom >= 130} className="rounded-md px-2 py-1.5 text-xs font-bold text-indigo-800 hover:bg-white disabled:opacity-35" title="Augmenter le zoom">+</button></div><Button type="button" variant="outline" onClick={runPreflight} disabled={!editorRef.current || preflightRunning} className="min-h-10">{preflightRunning ? "Vérification…" : "Contrôler"}</Button><Button type="button" variant="outline" onClick={exportProject} disabled={!editorRef.current} className="min-h-10">Exporter HTML</Button><Button type="button" variant="outline" onClick={insertRealCatalogue} disabled={!selectedStoreId || cloneSourceQuery.isLoading || (!cloneSourceQuery.data?.categories?.length && !cloneSourceQuery.data?.products?.length)} className="min-h-10">Catalogue réel</Button><Button type="button" variant="outline" onClick={() => openImagePicker("add")} disabled={!selectedStoreId || uploadImageMutation.isPending} className="min-h-10"><ImagePlus className="mr-2 h-4 w-4" />Ajouter</Button><Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={!selectedStoreId || uploadVideoMutation.isPending} className="min-h-10"><Video className="mr-2 h-4 w-4" />Vidéo</Button><Button type="button" onClick={() => openImagePicker("replace")} disabled={!hasSelectedImage || uploadImageMutation.isPending} className="min-h-10"><ImagePlus className="mr-2 h-4 w-4" />Remplacer</Button><Button type="button" onClick={publishProject} disabled={saveTarget !== "store" || !selectedStoreId || !editorRef.current || !preflightChecked || preflightIssues.length > 0 || publishProjectMutation.isPending} className="min-h-10 bg-emerald-700 text-white hover:bg-emerald-800">{publishProjectMutation.isPending ? "Publication…" : "Publier"}</Button><Button type="button" onClick={saveProject} disabled={(saveTarget === "store" && !selectedStoreId) || saveProjectMutation.isPending || saveIndependentProjectMutation.isPending} className="min-h-10 bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" />{saveProjectMutation.isPending || saveIndependentProjectMutation.isPending ? "Enregistrement…" : saveTarget === "independent" ? "Enregistrer dans Studio" : "Enregistrer"}</Button></div></div><div className="border-t border-slate-200 px-5 py-3">{preflightChecked && <div role="status" className={`rounded-xl border px-3 py-2 text-xs ${preflightIssues.length ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><strong>{preflightIssues.length ? `${preflightIssues.length} point(s) à vérifier avant publication` : "Contrôle qualité réussi : la composition est prête pour une revue finale"}</strong>{preflightIssues.length > 0 && <ul className="mt-1 list-disc space-y-0.5 pl-4">{preflightIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}</div>}</div><div className="grid gap-4 border-t border-slate-200 bg-slate-100/80 p-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80"><div style={{ transform: `scale(${canvasZoom / 100})`, transformOrigin: "top center", width: `${100 / (canvasZoom / 100)}%`, minHeight: `${650 / (canvasZoom / 100)}px` }}><GjsEditor grapesjs={grapesjs} options={editorOptions} onEditor={handleEditor} /></div></div>
        <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/90 p-4 shadow-md" aria-label="Panneaux du constructeur visuel">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50/90 via-violet-50/80 to-indigo-50/80 px-3 py-2.5"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-fuchsia-600 text-white shadow-sm"><Wand2 className="h-4 w-4" /></span><div><h3 className="text-sm font-bold text-slate-950">Panneau de travail</h3><p className="text-[10px] font-medium text-fuchsia-900/80">Outils classés par couleur</p></div></div><button type="button" onClick={() => setContentEditMode(previous => !previous)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${contentEditMode ? "bg-emerald-600 text-white shadow-sm" : "border border-fuchsia-200 bg-white text-slate-700 hover:bg-fuchsia-50"}`}>{contentEditMode ? "Mode contenu actif" : "Mode contenu"}</button><div className="flex items-center gap-1"><button type="button" onClick={() => runEditorCommand("core:undo")} className="rounded-md bg-white/80 p-1.5 text-slate-700 shadow-xs hover:bg-white" title="Annuler"><Undo2 className="h-4 w-4" /></button><button type="button" onClick={() => runEditorCommand("core:redo")} className="rounded-md bg-white/80 p-1.5 text-slate-700 shadow-xs hover:bg-white" title="Rétablir"><Redo2 className="h-4 w-4" /></button></div></div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold"><span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-900"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />Organisation</span><span className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-900"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-500" />Création</span><span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-950"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />Média</span><span className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-teal-900"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-teal-500" />Structure</span><span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-900"><i className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Revue</span></div>
          <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1.5" role="tablist" aria-label="Outils du constructeur">{([{ id: "pages", label: "Pages" }, { id: "blocks", label: "Blocs" }, { id: "media", label: "Média" }, { id: "layers", label: "Calques" }, { id: "styles", label: "Styles" }, { id: "review", label: "Revue" }, { id: "properties", label: "Propriétés" }] as const).map(panel => <button key={panel.id} type="button" role="tab" aria-selected={activePanel === panel.id} onClick={() => setActivePanel(panel.id)} className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ${activePanel === panel.id ? panelToneClasses[panel.id] : panelInactiveToneClasses[panel.id]}`}><span className={`h-2 w-2 shrink-0 rounded-full ${activePanel === panel.id ? "bg-white" : panelDotClasses[panel.id]}`} /><span>{panel.label}</span></button>)}</div>
          <div className={`mt-3 rounded-xl border px-3 py-2.5 ${panelBannerMeta[activePanel].className}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{panelBannerMeta[activePanel].title}</p><span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${panelBannerMeta[activePanel].badge}`}>{activePanel === "pages" ? `${pages.length} page(s)` : activePanel === "blocks" ? `${editorBlocks.length} blocs` : activePanel === "layers" ? `${layerRows.length} éléments` : activePanel === "review" ? `${reviewComments.filter(comment => comment.pageId === activePageId).length} note(s)` : "Actif"}</span></div><p className="mt-0.5 text-[11px] opacity-85">{panelBannerMeta[activePanel].subtitle}</p></div>
          {activePanel === "review" && <div className="mt-4 space-y-3"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3"><p className="text-xs font-bold text-indigo-900">Rechercher et remplacer</p><p className="mt-1 text-[11px] leading-5 text-indigo-800">Remplace uniquement le texte éditorial de la page active. Les URLs, styles et marqueurs catalogue restent inchangés.</p><div className="mt-2 grid gap-2"><input value={findText} onChange={event => { setFindText(event.target.value); setReplaceCount(null); }} placeholder="Texte à rechercher" className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-2 text-xs" /><input value={replaceText} onChange={event => setReplaceText(event.target.value)} placeholder="Nouveau texte" className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-2 text-xs" /><button type="button" onClick={replaceTextInPage} disabled={!findText.trim()} className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-40">Remplacer dans cette page</button></div>{replaceCount !== null && <p role="status" className="mt-2 text-[11px] font-semibold text-indigo-900">{replaceCount ? `${replaceCount} occurrence(s) remplacée(s). Enregistrez le brouillon pour conserver le résultat.` : "Aucune occurrence trouvée."}</p>}</div><div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3"><p className="text-xs font-bold text-rose-950">Revue privée Studio</p><p className="mt-1 text-[11px] leading-5 text-rose-900/80">Notes internes enregistrées avec le brouillon. Elles ne sont jamais publiées dans la vitrine.</p><textarea value={newReviewComment} onChange={event => setNewReviewComment(event.target.value)} rows={3} maxLength={500} placeholder="Ex. Vérifier le cadrage mobile de la bannière…" className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs" /><button type="button" onClick={addReviewComment} disabled={!newReviewComment.trim()} className="mt-2 w-full rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40">Ajouter une note</button></div><div className="space-y-2">{reviewComments.filter(comment => comment.pageId === activePageId).map(comment => <div key={comment.id} className={`rounded-lg border p-3 ${comment.resolved ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-white"}`}><p className="text-xs leading-5 text-slate-700">{comment.text}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleString("fr-FR")}</span><div className="flex gap-1"><button type="button" onClick={() => { setReviewComments(previous => previous.map(item => item.id === comment.id ? { ...item, resolved: !item.resolved } : item)); setHasUnsavedChanges(true); }} className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700">{comment.resolved ? "Rouvrir" : "Résoudre"}</button><button type="button" onClick={() => { setReviewComments(previous => previous.filter(item => item.id !== comment.id)); setHasUnsavedChanges(true); }} className="rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700">Supprimer</button></div></div></div>)}{reviewComments.filter(comment => comment.pageId === activePageId).length === 0 && <p className="rounded-lg border border-dashed border-rose-200 bg-rose-50/30 px-3 py-4 text-center text-xs text-rose-800">Aucune note sur cette page.</p>}</div></div>}
          {activePanel === "pages" && <div className="mt-4 space-y-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-sky-950">Pages privées de cette boutique</p><button type="button" onClick={createPage} className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700">+ Nouvelle page</button></div><label className="block space-y-1"><span className="flex items-center justify-between text-[11px] font-bold text-sky-950"><span>Rechercher une page</span><span className="font-normal text-sky-700">{visiblePages.length}/{pages.length}</span></span><input value={pageSearch} onChange={event => setPageSearch(event.target.value)} placeholder="Ex. accueil, contact, association…" className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500" /></label><div className="space-y-2">{visiblePages.map(page => <div key={page.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${page.id === activePageId ? "border-l-4 border-l-sky-600 border-sky-300 bg-sky-50/90 shadow-xs" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/30"}`}><button type="button" onClick={() => switchPage(page.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-bold text-slate-900">{page.title}</span><span className="block truncate text-[11px] font-medium text-sky-700">{page.slug}</span></button><button type="button" onClick={() => duplicatePage(page.id)} className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-800 hover:bg-violet-100" title={`Dupliquer ${page.title}`}>Copier</button><button type="button" onClick={() => deletePage(page.id)} disabled={page.id === "home" || pages.length <= 1} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35" title={page.id === "home" ? "La page Accueil est obligatoire" : `Supprimer ${page.title}`}>Suppr.</button></div>)}</div><div className="space-y-2.5 rounded-xl border border-sky-200/80 bg-sky-50/40 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-sky-900">Réglages SEO de la page</p><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Titre de page</span><input value={pageTitle} onChange={event => { setPageTitle(event.target.value); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Chemin</span><input value={pageSlug} onChange={event => { setPageSlug(event.target.value.startsWith("/") ? event.target.value : `/${event.target.value}`); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Description SEO</span><textarea value={pageDescription} onChange={event => { setPageDescription(event.target.value); setHasUnsavedChanges(true); }} rows={3} className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Langue</span><select value={pageLanguage} onChange={event => { setPageLanguage(event.target.value); setHasUnsavedChanges(true); }} className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs"><option value="fr">Français</option><option value="de">Deutsch</option><option value="en">English</option><option value="it">Italiano</option></select></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Image sociale (URL HTTPS)</span><input value={socialCoverUrl} onChange={event => { setSocialCoverUrl(normalizeBuilderHref(event.target.value)); setHasUnsavedChanges(true); }} placeholder="https://..." className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs" /></label><label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Favicon (URL HTTPS)</span><input value={faviconUrl} onChange={event => { setFaviconUrl(normalizeBuilderHref(event.target.value)); setHasUnsavedChanges(true); }} placeholder="https://..." className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs" /></label></div></div>}
          {activePanel === "blocks" && <div className="mt-4 max-h-[520px] overflow-y-auto pr-1"><p className="text-xs leading-5 text-slate-600">Les blocs MAZIGHO restent responsive et peuvent être combinés avec le catalogue réel.</p><div className="mt-3 space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-2.5"><label className="block space-y-1"><span className="text-[11px] font-bold text-violet-950">Rechercher un bloc</span><input value={blockSearch} onChange={event => setBlockSearch(event.target.value)} placeholder="Ex. menu, image, FAQ…" className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-violet-500" /></label><label className="block space-y-1"><span className="text-[11px] font-bold text-violet-950">Filtrer par catégorie</span><select value={blockCategoryFilter} onChange={event => setBlockCategoryFilter(event.target.value)} className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs"><option value="Toutes">Toutes les catégories</option>{Array.from(new Set(editorBlocks.map(block => block.category))).map(category => <option key={category} value={category}>{category.replace("MAZIGHO · ", "")}</option>)}</select></label><p className="text-[10px] text-violet-800">{filteredEditorBlocks.length} bloc{filteredEditorBlocks.length > 1 ? "s" : ""} trouvé{filteredEditorBlocks.length > 1 ? "s" : ""}</p></div>{selectedComponent && <button type="button" onClick={saveReusableComponent} className="mt-3 w-full rounded-lg border border-fuchsia-300 bg-fuchsia-100/80 px-3 py-2 text-xs font-bold text-fuchsia-950 hover:bg-fuchsia-200/70">+ Enregistrer la sélection comme composant</button>}<div className="mt-3 space-y-2">{reusableComponents.length > 0 && <p className="text-[11px] font-bold uppercase tracking-wide text-violet-800">Mes composants</p>}{reusableComponents.map(component => <div key={component.id} className="flex items-center gap-2"><button type="button" onClick={() => insertReusableComponent(component)} className="min-w-0 flex-1 truncate rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-left text-xs font-semibold text-fuchsia-900 hover:bg-fuchsia-100">{component.name}</button><button type="button" onClick={() => { setReusableComponents(previous => previous.filter(item => item.id !== component.id)); setHasUnsavedChanges(true); }} className="rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50" aria-label={`Supprimer ${component.name}`}>×</button></div>)}<p className="pt-2 text-[11px] font-bold uppercase tracking-wide text-violet-900">Blocs MAZIGHO classés par couleur</p>{filteredEditorBlocks.map(block => { const blockTone = getBlockCategoryTone(block.category); return <button key={block.id} type="button" onClick={() => { editorRef.current?.addComponents(block.content); setHasUnsavedChanges(true); }} className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-bold text-slate-800 transition ${blockTone.card}`}><span>{block.label}</span><span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${blockTone.badge}`}>{block.category.replace("MAZIGHO · ", "")}</span></button>; })}</div></div>}
          {activePanel === "media" && <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-1"><div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3"><p className="text-xs leading-5 text-amber-950">Choisissez une image optimisée pour le web, classée par famille. Les images de la bibliothèque sont ajoutées par URL légère ; les fichiers téléversés restent isolés par boutique.</p><div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => openImagePicker("add")} disabled={!selectedStoreId || uploadImageMutation.isPending} className="min-h-10 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"><ImagePlus className="mr-2 h-4 w-4 text-amber-600" />Téléverser</Button><Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={!selectedStoreId || uploadVideoMutation.isPending} className="min-h-10 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"><Video className="mr-2 h-4 w-4 text-amber-600" />Vidéo</Button></div></div>{imageUploadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{imageUploadError}</p>}{videoUploadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">{videoUploadError}</p>}<label className="block space-y-1"><span className="text-xs font-semibold text-slate-700">Rôle d’image</span><select value={imageRole} onChange={event => setImageRole(event.target.value as ImageRole)} className="min-h-10 w-full rounded-lg border border-amber-300 bg-white px-2 text-sm font-semibold text-slate-800"><option value="free">Image libre</option><option value="logo">Logo</option><option value="banner">Bannière</option><option value="category">Catégorie</option></select></label><div><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-amber-950">Bibliothèque MAZIGHO</p><span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">WebP · léger</span></div><input value={mediaSearch} onChange={event => setMediaSearch(event.target.value)} placeholder="Rechercher une image…" aria-label="Rechercher une image" className="mt-2 min-h-9 w-full rounded-lg border border-amber-200 bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-500" /><select value={imageFamily} onChange={event => setImageFamily(event.target.value)} className="mt-2 min-h-9 w-full rounded-lg border border-amber-200 bg-white px-2 text-xs font-semibold text-slate-800" aria-label="Famille d’images">{imageFamilies.map(family => <option key={family} value={family}>{family}</option>)}</select><p className="mt-2 text-[10px] font-semibold text-amber-800">{visibleLibraryImages.length} visuel{visibleLibraryImages.length > 1 ? "s" : ""} disponible{visibleLibraryImages.length > 1 ? "s" : ""}</p><div className="mt-2 grid grid-cols-2 gap-2">{visibleLibraryImages.map(image => <div key={image.id} className="overflow-hidden rounded-xl border border-amber-200/80 bg-white shadow-xs transition hover:border-amber-400"><button type="button" onClick={() => { editorRef.current?.addComponents(imageMarkup(image.url, imageRole)); setHasUnsavedChanges(true); }} className="block w-full text-left" title={`Ajouter ${image.label}`}><img src={image.url} alt={image.alt} loading="lazy" decoding="async" className="h-20 w-full object-cover" /><span className="block truncate px-2 py-1.5 text-[11px] font-semibold text-slate-800">{image.label}</span></button><a href={image.sourceUrl} target="_blank" rel="noreferrer" className="block border-t border-amber-100 bg-amber-50/50 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-100">Source gratuite ↗</a></div>)}</div></div><div className="rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-xs font-bold text-sky-900">Autres sources gratuites</p><div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] font-semibold"><a href="https://unsplash.com" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-2 py-2 text-center text-sky-800 hover:bg-sky-100">Unsplash</a><a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-2 py-2 text-center text-sky-800 hover:bg-sky-100">Pexels</a><a href="https://pixabay.com" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-2 py-2 text-center text-sky-800 hover:bg-sky-100">Pixabay</a></div><p className="mt-2 text-[10px] leading-4 text-sky-800">Vérifiez toujours la licence et les éventuelles restrictions de marque avant une utilisation commerciale.</p></div></div>}
          {activePanel === "styles" && <div className="mt-4 space-y-3">{selectedComponent ? <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-indigo-950">Élément actif : <span className="uppercase">{selectedTagName}</span></p><span className="rounded-md bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-950">sélectionné</span></div><p className="mt-1 text-[11px] text-indigo-900/80">Les réglages rapides ci-dessous s’appliquent à cet élément et restent dans le brouillon privé.</p><div className="mt-2 grid grid-cols-2 gap-2"><label className="space-y-1"><span className="text-[11px] font-semibold text-indigo-950">Texte</span><input value={selectedStyles.color} onChange={event => updateSelectedStyle("color", event.target.value)} placeholder="#172033" className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-xs" /></label><label className="space-y-1"><span className="text-[11px] font-semibold text-indigo-950">Fond</span><input value={selectedStyles.backgroundColor} onChange={event => updateSelectedStyle("backgroundColor", event.target.value)} placeholder="#ffffff" className="w-full rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-xs" /></label></div>{selectedTagName === "img" && <div className="mt-3 rounded-lg border border-fuchsia-200 bg-fuchsia-50/70 p-2.5"><p className="text-[11px] font-bold text-fuchsia-950">Composition libre de l’image</p><button type="button" onClick={anchorSelectedImageToHero} className="mt-2 w-full rounded border border-fuchsia-300 bg-white px-2 py-1.5 text-[11px] font-bold text-fuchsia-900 hover:bg-fuchsia-100">Ancrer dans le Hero</button><div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" onClick={() => updateSelectedStyle("transform", "rotate(0deg) scaleX(-1) scaleY(1)")} className="rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-[10px] font-bold text-fuchsia-900">Retourner horizontalement</button><button type="button" onClick={() => updateSelectedStyle("transform", "rotate(0deg) scaleX(1) scaleY(-1)")} className="rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-[10px] font-bold text-fuchsia-900">Retourner verticalement</button></div><label className="mt-2 block space-y-1"><span className="text-[10px] font-semibold text-fuchsia-950">Transformation CSS</span><input value={selectedStyles.transform} onChange={event => updateSelectedStyle("transform", event.target.value)} placeholder="rotate(-8deg) scaleX(1) scaleY(1)" className="w-full rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-[11px]" /></label><div className="mt-2 grid grid-cols-2 gap-2"><label className="space-y-1"><span className="text-[10px] font-semibold text-fuchsia-950">Position haut</span><input value={selectedStyles.top} onChange={event => updateSelectedStyle("top", event.target.value)} placeholder="20px" className="w-full rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-[11px]" /></label><label className="space-y-1"><span className="text-[10px] font-semibold text-fuchsia-950">Position droite</span><input value={selectedStyles.right} onChange={event => updateSelectedStyle("right", event.target.value)} placeholder="20px" className="w-full rounded border border-fuchsia-200 bg-white px-2 py-1.5 text-[11px]" /></label></div></div>}<button type="button" onClick={() => setActivePanel("properties")} className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700">Ouvrir tous les réglages de « {selectedTagName} » →</button></div> : <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-3"><p className="text-xs font-semibold text-indigo-950">Aucun élément sélectionné</p><p className="mt-1 text-[11px] leading-5 text-indigo-900/80">Cliquez sur un titre, bouton, lien, image ou section dans le canvas, puis revenez ici pour modifier rapidement ses styles.</p></div>}<p className="text-xs leading-5 text-slate-600">Sélectionnez un élément dans le canvas ou les calques pour modifier sa couleur, son fond, sa typographie et ses espacements.</p><div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3"><p className="text-xs font-bold text-indigo-950">Repère couleur du panneau gauche GrapesJS</p><div className="mt-2 space-y-1.5 text-[11px] font-semibold"><div className="flex items-center gap-2 rounded-md bg-sky-100/80 px-2 py-1 text-sky-900"><span className="h-2.5 w-2.5 rounded-full bg-sky-600" />General · Affichage & position</div><div className="flex items-center gap-2 rounded-md bg-violet-100/80 px-2 py-1 text-violet-900"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />Dimension · Largeur, hauteur & marges</div><div className="flex items-center gap-2 rounded-md bg-amber-100/80 px-2 py-1 text-amber-950"><span className="h-2.5 w-2.5 rounded-full bg-amber-600" />Typography · Police, taille & alignement</div><div className="flex items-center gap-2 rounded-md bg-emerald-100/80 px-2 py-1 text-emerald-900"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />Decorations · Couleurs de fond & bordures</div></div></div>{selectedComponent && <button type="button" onClick={() => setActivePanel("properties")} className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700">Ouvrir les propriétés de « {selectedTagName} » →</button>}</div>}
          {activePanel === "properties" && (selectedComponent ? <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2"><p className="text-xs text-emerald-950">Élément sélectionné : <span className="font-bold text-emerald-950">{selectedTagName}</span></p><span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${getLayerToneMeta(selectedTagName).badgeClass}`}>{getLayerToneMeta(selectedTagName).family}</span></div>{contentEditMode && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">Mode contenu actif : le texte, les liens et les textes alternatifs sont modifiables. Les styles, calques et actions structurelles sont protégés.</p>}
            {findRepeatableAncestor(selectedComponent) && <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-3"><p className="text-xs font-bold text-cyan-950">Bloc répétitif · {findRepeatableAncestor(selectedComponent)?.getAttributes?.()?.["data-mazigho-repeatable-item"] === "faq" ? "FAQ" : findRepeatableAncestor(selectedComponent)?.getAttributes?.()?.["data-mazigho-repeatable-item"] === "categories" ? "Catégories" : "Étapes"}</p><p className="mt-1 text-[11px] text-cyan-900">Ajoutez, dupliquez ou supprimez cet élément sans modifier le code.</p><div className="mt-2 grid grid-cols-3 gap-1.5"><button type="button" onClick={addRepeatableItem} className="rounded border border-cyan-300 bg-white px-2 py-1.5 text-[10px] font-bold text-cyan-900 hover:bg-cyan-100">Ajouter</button><button type="button" onClick={duplicateRepeatableItem} className="rounded border border-cyan-300 bg-white px-2 py-1.5 text-[10px] font-bold text-cyan-900 hover:bg-cyan-100">Dupliquer</button><button type="button" onClick={removeRepeatableItem} className="rounded border border-red-200 bg-white px-2 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-50">Supprimer</button></div></div>}<div className="flex flex-wrap gap-2"><button type="button" onClick={duplicateSelected} disabled={selectedLocked || contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"><Copy className="h-3.5 w-3.5" />Dupliquer</button><button type="button" onClick={removeSelected} disabled={selectedLocked || contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" />Supprimer</button><button type="button" onClick={toggleSelectedLock} disabled={contentEditMode} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">{selectedLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{selectedLocked ? "Déverrouiller" : "Verrouiller"}</button></div>
            <label className="block space-y-1.5 rounded-xl border border-sky-200/80 bg-sky-50/40 p-2.5"><span className="flex items-center gap-1.5 text-xs font-bold text-sky-950"><Type className="h-3.5 w-3.5 text-sky-600" />Texte</span><textarea value={selectedText} onChange={event => updateSelectedText(event.target.value)} rows={4} className="w-full rounded-lg border border-sky-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500" /></label>
            <label className="block space-y-1.5 rounded-xl border border-rose-200/80 bg-rose-50/40 p-2.5"><span className="text-xs font-bold text-rose-950">Lien</span><input type="text" value={selectedHref} onChange={event => updateSelectedAttribute("href", event.target.value)} placeholder="/boutique ou https://…" className="w-full rounded-lg border border-rose-200 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500" /><span className="text-[11px] text-rose-800/80">Chemins internes, HTTPS, e-mail et téléphone uniquement.</span></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700">Texte alternatif de l’image</span><input type="text" value={selectedAlt} onChange={event => updateSelectedAttribute("alt", event.target.value)} placeholder="Décrivez l’image" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label><label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-700">Animation sûre</span><select value={selectedAnimation} onChange={event => updateSelectedAnimation(event.target.value)} disabled={contentEditMode} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs disabled:opacity-50">{animationPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select><span className="text-[11px] text-slate-500">CSS uniquement, désactivée automatiquement si le visiteur préfère réduire les mouvements.</span></label>
            <div className="grid grid-cols-2 gap-2">{([['color','Texte'],['backgroundColor','Fond']] as const).map(([key,label]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">{label}</span><input type="text" value={selectedStyles[key]} onChange={event => updateSelectedStyle(key, event.target.value)} placeholder="#172033" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label>)}</div>
            <div className="grid grid-cols-2 gap-2">{([['fontSize','Taille'],['borderRadius','Arrondi'],['lineHeight','Interligne'],['letterSpacing','Lettres']] as const).map(([key,label]) => <label key={key} className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">{label}</span><input type="text" value={selectedStyles[key]} onChange={event => updateSelectedStyle(key, event.target.value)} placeholder={key === 'fontSize' ? '32px' : key === 'lineHeight' ? '1.5' : key === 'letterSpacing' ? '0.04em' : '12px'} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label>)}</div><div className="grid grid-cols-2 gap-2"><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Police</span><select value={selectedStyles.fontFamily} onChange={event => updateSelectedStyle("fontFamily", event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="">Par défaut</option><option value="Inter, sans-serif">Inter</option><option value="Georgia, serif">Éditorial</option><option value="Arial, sans-serif">Classique</option><option value="Trebuchet MS, sans-serif">Chaleureuse</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Graisse</span><select value={selectedStyles.fontWeight} onChange={event => updateSelectedStyle("fontWeight", event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="">Par défaut</option><option value="400">Normale</option><option value="600">Semi-gras</option><option value="700">Gras</option></select></label></div>{selectedTagName === "video" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">Lecture vidéo</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-amber-950">{([['controls','Contrôles'],['autoplay','Lecture auto'],['loop','Boucle'],['muted','Sans son']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={videoSettings[key]} onChange={event => updateVideoSetting(key, event.target.checked)} disabled={contentEditMode} />{label}</label>)}</div><label className="mt-3 block space-y-1"><span className="text-xs font-semibold text-amber-950">Image de couverture (URL HTTPS)</span><input value={videoSettings.poster} onChange={event => updateVideoSetting("poster", normalizeBuilderHref(event.target.value))} disabled={contentEditMode} placeholder="https://..." className="w-full rounded-lg border border-amber-200 bg-white px-2 py-2 text-xs" /></label></div>}
            <div className="grid grid-cols-2 gap-2"><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Alignement</span><select value={selectedStyles.textAlign} onChange={event => updateSelectedStyle('textAlign', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="">Par défaut</option><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option><option value="justify">Justifié</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold text-slate-700">Espacement interne</span><input type="text" value={selectedStyles.padding} onChange={event => updateSelectedStyle('padding', event.target.value)} placeholder="24px" className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-fuchsia-500" /></label></div>
            <button type="button" onClick={resetSelectedStyles} disabled={contentEditMode} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Réinitialiser les styles</button>
            <p className="text-[11px] leading-5 text-slate-500">Les changements restent dans le brouillon privé jusqu’à l’enregistrement.</p>
          </div> : <p className="mt-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-xs leading-5 text-emerald-950">Sélectionnez un titre, un bouton, une image ou une section dans le canvas pour modifier ses propriétés.</p>)}
          {activePanel === "layers" && <div className="mt-4 border-t border-slate-200 pt-3"><div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-950">Structure de la page</h4><span className="rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-900">{layerItems.length} section{layerItems.length > 1 ? "s" : ""}</span></div><p className="mt-1 text-[11px] text-slate-500">Double-cliquez pour renommer · glissez un calque sur un autre pour le déplacer.</p><div className="mt-2 flex flex-wrap gap-1 text-[10px] font-bold"><span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-800">Conteneur</span><span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-900">Titre</span><span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-800">Texte</span><span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-800">Média</span><span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-800">Action</span></div><div className="mt-3 max-h-[520px] space-y-1.5 overflow-y-auto pr-1">{layerItems.length > 0 ? layerRows.map(({ component: layer, depth }, index) => { const rawLabel = String(layer.get?.("name") || layer.get?.("tagName") || layer.get?.("type") || "élément").toLowerCase(); const label = getFriendlyLayerLabel(layer); const dynamic = isDynamicCatalogueAttributes(layer.getAttributes?.()); const active = layer === selectedComponent; const layerTone = getLayerToneMeta(rawLabel); return <div key={layer.cid || index} draggable onDragOver={event => event.preventDefault()} onDrop={() => { if (draggedLayerRef.current) moveLayerTo(draggedLayerRef.current, layer); draggedLayerRef.current = null; }} onDragStart={event => { event.dataTransfer.setData("text/plain", String(layer.cid || index)); draggedLayerRef.current = layer; }} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition ${active ? "border-l-4 border-l-fuchsia-600 border-fuchsia-400 bg-fuchsia-100/90 shadow-xs ring-1 ring-fuchsia-300" : layerTone.rowClass}`}><button type="button" onDoubleClick={() => renameLayer(layer)} onClick={() => selectLayer(layer)} style={{ paddingLeft: `${depth * 10}px` }} title="Double-cliquez pour renommer" className="flex min-w-0 flex-1 items-center justify-between gap-1.5 text-left text-xs font-bold"><span className=" flex min-w-0 items-center gap-1.5 truncate"><span className={`h-2 w-2 shrink-0 rounded-full ${active ? "bg-fuchsia-600" : layerTone.dotClass}`} /><span className="truncate">{index + 1}. {label}</span>{dynamic ? <span className="ml-1 rounded bg-emerald-200 px-1 py-0.5 text-[10px] font-bold text-emerald-950">dynamique</span> : null}</span><span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${layerTone.badgeClass}`}>{layerTone.family}</span></button><button type="button" onClick={() => moveLayer(layer, -1)} disabled={index === 0} className="rounded bg-white/80 p-1 text-slate-600 hover:bg-white disabled:opacity-30" title="Monter"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveLayer(layer, 1)} disabled={index === layerItems.length - 1} className="rounded bg-white/80 p-1 text-slate-600 hover:bg-white disabled:opacity-30" title="Descendre"><ArrowDown className="h-3.5 w-3.5" /></button></div>; }) : <p className="text-xs text-slate-500">Ajoutez une section pour voir sa structure ici.</p>}</div></div>}
        </aside>
      </div></section>
    <Card className="border-sky-200 bg-sky-50"><CardContent className="flex flex-col gap-3 p-5 text-sm leading-6 text-sky-950 md:flex-row md:items-start"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Sauvegarde privée uniquement</p><p>Le projet est enregistré dans les réglages isolés de la boutique. Cette étape ne publie rien, ne change aucun domaine et n’active aucun paiement.</p></div></CardContent></Card>
  </main></DashboardLayout>;
}
