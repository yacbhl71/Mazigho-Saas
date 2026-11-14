import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, CopyPlus, Layers3, LockKeyhole, Palette, Plus, Sparkles } from "lucide-react";

type BuilderMode = "blank" | "theme" | "clone";

const modes: Array<{ id: BuilderMode; title: string; eyebrow: string; description: string; icon: typeof Plus; tone: string; steps: string[] }> = [
  {
    id: "blank",
    title: "Créer de zéro",
    eyebrow: "Page vierge",
    description: "Construisez une boutique à partir d’une structure propre, puis ajoutez progressivement vos sections, images, produits et boutons.",
    icon: Plus,
    tone: "violet",
    steps: ["Choisir une structure de départ", "Ajouter des sections et des blocs", "Personnaliser l’identité visuelle", "Prévisualiser avant publication"],
  },
  {
    id: "theme",
    title: "Modifier un thème",
    eyebrow: "Base MAZIGHO",
    description: "Partez d’un thème réutilisable comme Atelier Urbain, Clean Beauty ou Editorial lumineux et adaptez chaque élément.",
    icon: Palette,
    tone: "orange",
    steps: ["Sélectionner un thème", "Choisir la boutique concernée", "Modifier les blocs visuels", "Conserver ou créer une variante"],
  },
  {
    id: "clone",
    title: "Transformer une boutique clonée",
    eyebrow: "Import contrôlé",
    description: "Utilisez la structure extraite par le Cloner comme point de départ, puis remplacez les visuels, les textes et les éléments de marque.",
    icon: CopyPlus,
    tone: "teal",
    steps: ["Sélectionner un import terminé", "Convertir la structure en blocs", "Remplacer les contenus de démonstration", "Valider l’aperçu privé"],
  },
];

const toneClasses: Record<string, { card: string; icon: string; badge: string; button: string }> = {
  violet: { card: "border-violet-200 bg-violet-50/60", icon: "bg-violet-100 text-violet-800", badge: "border-violet-200 bg-violet-100 text-violet-900", button: "bg-violet-700 hover:bg-violet-800" },
  orange: { card: "border-orange-200 bg-orange-50/60", icon: "bg-orange-100 text-orange-800", badge: "border-orange-200 bg-orange-100 text-orange-900", button: "bg-orange-700 hover:bg-orange-800" },
  teal: { card: "border-teal-200 bg-teal-50/60", icon: "bg-teal-100 text-teal-800", badge: "border-teal-200 bg-teal-100 text-teal-900", button: "bg-teal-700 hover:bg-teal-800" },
};

export default function AdminStudioVisualBuilder() {
  const [selectedMode, setSelectedMode] = useState<BuilderMode>("blank");
  const selected = modes.find(mode => mode.id === selectedMode) ?? modes[0];
  const tone = toneClasses[selected.tone];
  const Icon = selected.icon;

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950"><Layers3 className="mr-1.5 h-3.5 w-3.5" /> MAZIGHO Studio</Badge><Badge variant="outline" className="border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950">Nouveau module</Badge></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Constructeur visuel</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Un espace séparé pour créer une boutique de zéro, modifier un thème ou transformer une boutique issue du Cloner. Cette première version prépare les parcours sans modifier les boutiques existantes.</p>
      </div>
      <Link href="/admin/studio"><Button type="button" variant="outline" className="min-h-11 w-fit">Retour au Studio</Button></Link>
    </header>

    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">Point de départ</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Comment voulez-vous commencer ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Ces trois boutons deviendront les trois parcours du constructeur visuel.</p></div><Badge variant="outline" className="w-fit border-slate-300 bg-slate-50 text-slate-700">Étape 1 · Choisir une base</Badge></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">{modes.map(mode => { const ModeIcon = mode.icon; const active = selectedMode === mode.id; const modeTone = toneClasses[mode.tone]; return <button key={mode.id} type="button" onClick={() => setSelectedMode(mode.id)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? `${modeTone.card} ring-2 ring-slate-950/10` : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${modeTone.icon}`}><ModeIcon className="h-5 w-5" /></span>{active && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{mode.eyebrow}</p><h3 className="mt-2 text-xl font-bold text-slate-950">{mode.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{mode.description}</p><span className={`mt-5 inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-sm font-semibold text-white ${active ? modeTone.button : "bg-slate-700 hover:bg-slate-800"}`}>{active ? "Parcours sélectionné" : "Choisir ce parcours"}<ArrowRight className="ml-2 h-4 w-4" /></span></button>; })}</div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className={`${tone.card} shadow-sm`}><CardHeader><div className="flex items-start gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></div><div><CardDescription>{selected.eyebrow}</CardDescription><CardTitle className="mt-1 text-2xl">{selected.title}</CardTitle></div></div></CardHeader><CardContent><p className="max-w-2xl text-sm leading-6 text-slate-700">{selected.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{selected.steps.map((step, index) => <div key={step} className="flex gap-3 rounded-xl border border-white/80 bg-white/80 p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span><span className="text-sm font-semibold leading-5 text-slate-800">{step}</span></div>)}</div><div className="mt-6 flex flex-wrap gap-3"><Button type="button" className={`${tone.button} min-h-11 text-white`} disabled><Sparkles className="mr-2 h-4 w-4" />Ouvrir le constructeur — prochaine étape</Button><Link href="/admin/studio/themes"><Button type="button" variant="outline" className="min-h-11 border-slate-300 bg-white">Voir les thèmes disponibles</Button></Link></div></CardContent></Card>
      <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LockKeyhole className="h-5 w-5 text-slate-700" /> Où se place le module ?</CardTitle><CardDescription>Une brique indépendante du clonage et des thèmes.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-slate-600"><div><p className="font-semibold text-slate-950">1. Cloner ou créer</p><p>Le système prépare une base de boutique.</p></div><div><p className="font-semibold text-slate-950">2. Choisir une base</p><p>Cette page devient le point d’entrée des trois parcours.</p></div><div><p className="font-semibold text-slate-950">3. Construire visuellement</p><p>Les blocs image, texte, produit et section seront ajoutés progressivement.</p></div><div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-950">Pour le moment, cette coquille ne publie rien et ne modifie aucune boutique. Elle prépare seulement l’architecture du futur constructeur.</div></CardContent></Card>
    </section>
  </main></DashboardLayout>;
}
