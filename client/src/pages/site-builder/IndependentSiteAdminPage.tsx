import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ExternalLink, FileText, ImagePlus, LayoutDashboard, Loader2, Save, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getIndependentSiteRolePresentation } from "@shared/isolatedSiteBuilder";

type EditablePage = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  language?: string;
  html: string;
  css: string;
  settings?: Record<string, unknown>;
};

type AdminTab = "overview" | "content" | "media" | "team";

function readFirstTag(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function readFirstImage(html: string) {
  return html.match(/<img\\b[^>]*\\bsrc=["']([^"']+)["']/i)?.[1] ?? "";
}

function replaceFirstTag(html: string, tag: string, value: string) {
  const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return html.replace(new RegExp(`(<${tag}\\b[^>]*>)[\\s\\S]*?(<\\/${tag}>)`, "i"), `$1${escaped}$2`);
}

function replaceFirstImage(html: string, src: string) {
  return html.replace(/(<img\\b[^>]*\\bsrc=["'])[^"']*(["'])/i, `$1${src.replace(/"/g, "&quot;")}$2`);
}

export default function IndependentSiteAdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedPageId, setSelectedPageId] = useState<string>("home");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftIntro, setDraftIntro] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionText, setNewSectionText] = useState("");

  const requestedSlug = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("siteSlug")?.trim().toLowerCase() ?? "";
  }, []);
  const requestedSiteId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = Number(new URLSearchParams(window.location.search).get("siteId"));
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }, []);
  const projectsQuery = trpc.independentSiteBuilder.listProjects.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const accessibleProject = projectsQuery.data?.find(project => requestedSiteId ? project.id === requestedSiteId : (!requestedSlug || project.slug.toLowerCase() === requestedSlug));
  const siteId = accessibleProject?.id ?? null;
  const projectQuery = trpc.independentSiteBuilder.getProject.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );
  const roleQuery = trpc.independentSiteBuilder.getAccessRole.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );
  const saveMutation = trpc.independentSiteBuilder.saveProject.useMutation({
    onSuccess: () => {
      void projectQuery.refetch();
      toast.success("Les modifications ont été enregistrées.");
    },
    onError: error => toast.error(error.message || "La sauvegarde n’a pas abouti."),
  });
  const accessQuery = trpc.independentSiteBuilder.listAccess.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId && roleQuery.data?.role === "owner"), retry: false, refetchOnWindowFocus: false },
  );

  const project = projectQuery.data;
  const pages = (project?.pages ?? []) as EditablePage[];
  const activePage = pages.find(page => page.id === selectedPageId) ?? pages[0];
  const role = roleQuery.data?.role ?? "editor";
  const roleInfo = getIndependentSiteRolePresentation(role);
  const canEdit = role === "owner" || role === "admin" || role === "editor";

  useEffect(() => {
    if (authLoading || user) return;
    const returnTarget = requestedSiteId ? `/administration-site?siteId=${requestedSiteId}` : `/administration-site?siteSlug=${requestedSlug}`;
    setLocation(`/connexion-administration?returnTo=${encodeURIComponent(returnTarget)}`);
  }, [authLoading, requestedSiteId, requestedSlug, setLocation, user]);

  useEffect(() => {
    if (!activePage) return;
    setSelectedPageId(activePage.id);
    setDraftTitle(readFirstTag(activePage.html, "h1"));
    setDraftIntro(readFirstTag(activePage.html, "p"));
    setDraftImage(readFirstImage(activePage.html));
  }, [activePage?.id, activePage?.html]);

  if (authLoading || projectsQuery.isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f6f1]"><Loader2 className="h-7 w-7 animate-spin text-[#59634c]" /></main>;
  }
  if (!user) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f6f1]"><Loader2 className="h-7 w-7 animate-spin text-[#59634c]" /></main>;
  }
  if (!accessibleProject || !siteId || projectQuery.isError) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f6f1] px-4"><Card className="max-w-lg"><CardHeader><CardTitle>Accès limité à ce site</CardTitle><CardDescription>Votre compte ne possède pas d’accès actif à ce site indépendant.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link href={`/sites/${requestedSlug}`}>Retour au site public</Link></Button></CardContent></Card></main>;
  }
  const currentProject = project as NonNullable<typeof project>;

  function savePages(nextPages: EditablePage[], label: string) {
    saveMutation.mutate({ siteId, pages: nextPages as any, createVersionLabel: label });
  }

  function saveContent() {
    if (!activePage || !canEdit) return;
    let html = replaceFirstTag(activePage.html, "h1", draftTitle || "Titre de la page");
    html = replaceFirstTag(html, "p", draftIntro || "Présentez votre site à votre communauté.");
    if (draftImage.trim()) html = replaceFirstImage(html, draftImage.trim());
    savePages(pages.map(page => page.id === activePage.id ? { ...page, html } : page), `Mise à jour de contenu · ${activePage.title}`);
  }

  function addSection() {
    if (!activePage || !newSectionTitle.trim() || !newSectionText.trim()) return;
    const section = `<section data-site-block="client-section" style="padding:48px 28px;background:#f3eee8"><div style="max-width:920px;margin:0 auto"><h2 style="margin:0 0 12px;color:#172033;font-size:clamp(28px,4vw,44px)">${newSectionTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2><p style="margin:0;color:#526070;line-height:1.75">${newSectionText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p></div></section>`;
    const nextHtml = `${activePage.html}${section}`;
    savePages(pages.map(page => page.id === activePage.id ? { ...page, html: nextHtml } : page), `Ajout d’une section · ${activePage.title}`);
    setNewSectionTitle("");
    setNewSectionText("");
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
    { id: "content", label: "Contenus", icon: FileText },
    { id: "media", label: "Images & médias", icon: ImagePlus },
    { id: "team", label: "Accès & équipe", icon: UsersRound },
  ];

  return <div className="min-h-screen bg-[#f4f6f1] text-slate-900">
    <header className="border-b border-[#d9dfcf] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#59634c]">Administration de site</p><h1 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">{currentProject.title}</h1></div>
        <div className="flex items-center gap-2"><Badge className="bg-[#e8eee0] text-[#40552d] hover:bg-[#e8eee0]">{roleInfo.title}</Badge><Button asChild variant="outline" size="sm"><Link href={`/sites/${currentProject.slug}`}><ExternalLink className="mr-2 h-4 w-4" />Voir le site</Link></Button></div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[230px_1fr] md:px-8 md:py-8">
      <aside className="rounded-2xl border border-[#d9dfcf] bg-white p-3 shadow-sm"><p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Espace de gestion</p><nav className="space-y-1">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === item.id ? "bg-[#59634c] text-white" : "text-slate-600 hover:bg-[#f1f4ec]"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</nav><div className="mt-5 rounded-xl bg-[#f4f6f1] p-3 text-xs leading-5 text-slate-600"><ShieldCheck className="mb-1 h-4 w-4 text-[#59634c]" />Cet espace ne donne accès qu’au site <strong>{currentProject.title}</strong>. Le constructeur MAZIGHO reste privé.</div></aside>
      <main className="space-y-6">
        {tab === "overview" && <><div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-slate-500">Statut</p><p className="mt-2 text-xl font-bold">{currentProject.status === "published" ? "Publié" : "Brouillon"}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-slate-500">Pages</p><p className="mt-2 text-xl font-bold">{pages.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-slate-500">Votre rôle</p><p className="mt-2 text-xl font-bold">{roleInfo.title}</p></CardContent></Card></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#9b563e]" />Bienvenue dans votre espace</CardTitle><CardDescription>Modifiez les textes et les images de votre site avec des formulaires simples. Aucun constructeur visuel ni autre projet ne sont exposés ici.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button type="button" onClick={() => setTab("content")}>Modifier les contenus</Button><Button type="button" variant="outline" onClick={() => setTab("media")}>Gérer les images</Button></CardContent></Card></>}
        {tab === "content" && <Card><CardHeader><CardTitle>Contenus du site</CardTitle><CardDescription>Choisissez une page puis modifiez son titre, son introduction et son image principale.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="flex flex-wrap gap-2">{pages.map(page => <Button key={page.id} type="button" size="sm" variant={page.id === activePage?.id ? "default" : "outline"} onClick={() => setSelectedPageId(page.id)}>{page.title}</Button>)}</div>{activePage && <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="space-y-4"><div><Label htmlFor="admin-title">Titre principal</Label><Input id="admin-title" value={draftTitle} onChange={event => setDraftTitle(event.target.value)} disabled={!canEdit} /></div><div><Label htmlFor="admin-intro">Texte d’introduction</Label><Textarea id="admin-intro" rows={6} value={draftIntro} onChange={event => setDraftIntro(event.target.value)} disabled={!canEdit} /></div><div><Label htmlFor="admin-image">URL de l’image principale</Label><Input id="admin-image" value={draftImage} onChange={event => setDraftImage(event.target.value)} disabled={!canEdit} placeholder="https://…" /></div><Button type="button" onClick={saveContent} disabled={!canEdit || saveMutation.isPending}><Save className="mr-2 h-4 w-4" />Enregistrer les changements</Button></div><div className="rounded-2xl border border-[#d9dfcf] bg-[#f7f9f4] p-4"><p className="text-sm font-semibold">Ajouter une section</p><p className="mt-1 text-xs leading-5 text-slate-500">Ajoutez une section texte simple sans ouvrir le constructeur.</p><Input className="mt-3" value={newSectionTitle} onChange={event => setNewSectionTitle(event.target.value)} placeholder="Titre de la section" disabled={!canEdit} /><Textarea className="mt-2" rows={4} value={newSectionText} onChange={event => setNewSectionText(event.target.value)} placeholder="Votre texte…" disabled={!canEdit} /><Button className="mt-3 w-full" type="button" variant="outline" onClick={addSection} disabled={!canEdit || !newSectionTitle.trim() || !newSectionText.trim()}>Ajouter la section</Button></div></div>}</CardContent></Card>}
        {tab === "media" && <Card><CardHeader><CardTitle>Images & médias</CardTitle><CardDescription>La bibliothèque média du site sera enrichie ici. Pour l’instant, l’image principale se modifie depuis l’onglet Contenus.</CardDescription></CardHeader><CardContent><Button type="button" onClick={() => setTab("content")}><ImagePlus className="mr-2 h-4 w-4" />Modifier l’image principale</Button></CardContent></Card>}
        {tab === "team" && <Card><CardHeader><CardTitle>Accès & équipe</CardTitle><CardDescription>Les droits appliqués à ce site sont contrôlés côté serveur.</CardDescription></CardHeader><CardContent className="space-y-3"><p className="rounded-xl bg-[#f4f6f1] p-4 text-sm leading-6">Votre rôle : <strong>{roleInfo.title}</strong>. {roleInfo.description}</p>{role === "owner" ? <div className="space-y-2">{(accessQuery.data ?? []).map(member => <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm"><span>{member.email}</span><Badge variant="outline">{member.role}</Badge></div>)}</div> : <p className="text-sm text-slate-500">La gestion des invitations et des rôles est réservée au propriétaire du site.</p>}</CardContent></Card>}
      </main>
    </div>
    <footer className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-8 text-xs text-slate-500 md:px-8"><ArrowLeft className="h-3.5 w-3.5" /><Link href={`/sites/${currentProject.slug}`} className="hover:underline">Retour à la vitrine publique</Link></footer>
  </div>;
}
