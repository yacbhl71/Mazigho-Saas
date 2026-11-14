import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import GjsEditor from "@grapesjs/react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, CopyPlus, Layers3, LockKeyhole, Palette, Plus, Save, Sparkles } from "lucide-react";

type BuilderMode = "blank" | "theme" | "clone";

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
  { id: "mazigho-image-text", label: "Image + texte", category: "MAZIGHO", content: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;padding:48px 28px"><div style="height:260px;background:linear-gradient(135deg,#ead9c9,#b9c8c7);border-radius:14px"></div><div><p style="text-transform:uppercase;letter-spacing:.12em;color:#a45f46">Bloc éditorial</p><h2 style="font-size:30px;margin:10px 0">Racontez votre sélection</h2><p style="line-height:1.7;color:#4b5563">Remplacez cette image et ce texte par les contenus propres à votre boutique.</p></div></section>` },
  { id: "mazigho-products", label: "Grille produits", category: "MAZIGHO", content: `<section style="padding:42px 28px"><h2 style="font-size:28px;margin-bottom:20px">Sélection du moment</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><article><div style="height:180px;background:#e7e4df;border-radius:10px"></div><h3>Produit exemple</h3><p>49,00 CHF</p></article><article><div style="height:180px;background:#d9e1df;border-radius:10px"></div><h3>Produit exemple</h3><p>69,00 CHF</p></article><article><div style="height:180px;background:#ded8d1;border-radius:10px"></div><h3>Produit exemple</h3><p>89,00 CHF</p></article></div></section>` },
  { id: "mazigho-banner", label: "Bannière image", category: "MAZIGHO", content: `<section style="padding:54px 28px;background:#f2eee9;text-align:center"><h2 style="font-size:30px">Un message important pour votre boutique</h2><p style="color:#4b5563">Ajoutez une campagne, une collection ou une promesse de marque.</p></section>` },
];

function initialComponents(mode: BuilderMode) {
  if (mode === "blank") return `<section style="min-height:420px;padding:100px 32px;text-align:center;background:#fff"><h1>Commencez votre composition</h1><p>Glissez un bloc MAZIGHO depuis la bibliothèque à gauche.</p></section>`;
  if (mode === "theme") return `${editorBlocks[0].content}${editorBlocks[1].content}${editorBlocks[2].content}`;
  return `${editorBlocks[0].content}${editorBlocks[3].content}${editorBlocks[2].content}`;
}

export default function AdminStudioVisualBuilder() {
  const [selectedMode, setSelectedMode] = useState<BuilderMode>("blank");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const selected = modes.find(mode => mode.id === selectedMode) ?? modes[0];
  const tone = toneClasses[selected.tone];
  const Icon = selected.icon;
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery({ includeAllForInternalProjection: true, page: 1, pageSize: 100 }, { refetchOnWindowFocus: false });
  const stores = inventoryQuery.data?.stores ?? [];
  const projectQuery = trpc.admin.studio.getVisualBuilderProject.useQuery({ storeId: selectedStoreId ?? 0 }, { enabled: selectedStoreId !== null, refetchOnWindowFocus: false });
  const saveProjectMutation = trpc.admin.studio.saveVisualBuilderProject.useMutation();
  const editorOptions = useMemo(() => ({ height: "650px", storageManager: false, noticeOnUnload: false, components: initialComponents(selectedMode), blockManager: { blocks: editorBlocks }, deviceManager: { devices: [{ id: "desktop", name: "Ordinateur", width: "" }, { id: "tablet", name: "Tablette", width: "768px", widthMedia: "992px" }, { id: "mobile", name: "Téléphone", width: "320px", widthMedia: "480px" }] } }), [selectedMode]);

  useEffect(() => {
    if (selectedStoreId === null && stores.length > 0) {
      const preferred = stores.find(store => !store.isPlatformStore) ?? stores[0];
      setSelectedStoreId(preferred.id);
    }
  }, [selectedStoreId, stores]);

  useEffect(() => {
    const editor = editorRef.current;
    const savedProject = projectQuery.data?.project;
    if (editor && savedProject) editor.loadProjectData(savedProject as Parameters<Editor["loadProjectData"]>[0]);
  }, [projectQuery.data]);

  const handleEditor = (editor: Editor) => {
    editorRef.current = editor;
    const savedProject = projectQuery.data?.project;
    if (savedProject) editor.loadProjectData(savedProject as Parameters<Editor["loadProjectData"]>[0]);
  };

  const saveProject = () => {
    if (!selectedStoreId || !editorRef.current) return;
    saveProjectMutation.mutate({ storeId: selectedStoreId, mode: selectedMode, project: editorRef.current.getProjectData() as Record<string, unknown> });
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><Layers3 className="mr-1.5 h-3.5 w-3.5" /> MAZIGHO Studio</Badge><Badge variant="outline" className="border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950">Constructeur open source</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Constructeur visuel</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Un canvas inspiré des meilleurs éditeurs visuels, construit sur GrapesJS open source et spécialisé pour les boutiques MAZIGHO.</p></div><Link href="/admin/studio"><Button type="button" variant="outline" className="min-h-11 w-fit">Retour au Studio</Button></Link></header>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">Point de départ</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Comment voulez-vous commencer ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le choix recharge une composition de démonstration dans le canvas privé.</p></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">Étape 1 · Choisir une base</Badge></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{modes.map(mode => { const ModeIcon = mode.icon; const active = selectedMode === mode.id; const modeTone = toneClasses[mode.tone]; return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? `${modeTone.card} ring-2 ring-slate-950/10` : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${modeTone.icon}`}><ModeIcon className="h-5 w-5" /></span>{active && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{mode.eyebrow}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{mode.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{mode.description}</p><span className={`mt-5 inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${active ? modeTone.button : "bg-slate-700 hover:bg-slate-800"}`}>{active ? "Parcours sélectionné" : "Choisir ce parcours"}<ArrowRight className="ml-2 h-4 w-4" /></span></button>; })}</div></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Étape 2 · Boutique cible</p><h2 className="mt-1 text-xl font-bold text-slate-950">Où enregistrer ce brouillon ?</h2><p className="mt-1 text-sm text-slate-600">Le projet reste isolé dans les réglages privés de la boutique choisie.</p></div><select value={selectedStoreId ?? ""} onChange={event => setSelectedStoreId(Number(event.target.value) || null)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-950/20"><option value="">Sélectionner une boutique</option>{stores.map(store => <option key={store.id} value={store.id}>{store.displayName} · {store.primaryDomain}</option>)}</select></div></section>
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Canvas privé · {selected.title}</p><h2 className="mt-1 text-xl font-bold text-slate-950">Composition MAZIGHO</h2></div></div><p className="mt-3 text-sm text-slate-600">Glissez les blocs depuis la colonne de gauche. Utilisez Enregistrer pour conserver le brouillon de la boutique sélectionnée.</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">{projectQuery.data?.updatedAt ? "Brouillon chargé" : "Nouveau brouillon"}</Badge><Button type="button" onClick={saveProject} disabled={!selectedStoreId || saveProjectMutation.isPending} className="min-h-10 bg-slate-950 text-white hover:bg-slate-800"><Save className="mr-2 h-4 w-4" />{saveProjectMutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button></div></div><div className="overflow-hidden rounded-b-3xl"><GjsEditor key={`${selectedMode}-${selectedStoreId ?? "none"}`} grapesjs={grapesjs} options={editorOptions} onEditor={handleEditor} /></div></section>
    <Card className="border-sky-200 bg-sky-50"><CardContent className="flex flex-col gap-3 p-5 text-sm leading-6 text-sky-950 md:flex-row md:items-start"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Sauvegarde privée uniquement</p><p>Le projet est enregistré dans les réglages isolés de la boutique. Cette étape ne publie rien, ne change aucun domaine et n’active aucun paiement.</p></div></CardContent></Card>
  </main></DashboardLayout>;
}
