import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  BarChart3,
  Eye,
  FilePlus2,
  FileText,
  Film,
  Globe,
  History,
  Image as ImageIcon,
  ImagePlus,
  Laptop,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MailPlus,
  Palette,
  Plus,
  RefreshCw,
  RotateCw,
  Mail,
  ExternalLink,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Tablet,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  extractImagesFromPageHtml,
  formatIndependentBuilderErrorMessage,
  generateUniquePageSlug,
  getIndependentSiteRolePresentation,
  replaceMediaUrlAcrossPages,
  type IndependentSiteClientRole,
  type IndependentSitePage,
} from "@shared/isolatedSiteBuilder";
import {
  appendClientSectionHtml,
  buildClientPreviewSrcDoc,
  CLIENT_ADMIN_ROLE_MATRIX,
  CLIENT_ADMIN_SPACE_DISTINCTIONS,
  formatClientDateTime,
  formatClientMemberStatus,
  formatClientStatusSummary,
  readFirstHtmlImage,
  readFirstHtmlTag,
  replaceFirstHtmlImage,
  replaceFirstHtmlTag,
} from "./clientAdminHelpers";
import {
  CLIENT_GUIDE_CONFIG,
  CLIENT_ISOLATION_NOTICE,
} from "@/components/site-guides/clientGuideContent";
import {
  SiteTrainingModal,
  type TrainingModalMode,
} from "@/components/site-guides/SiteTrainingModal";

type AdminTab = "overview" | "content" | "media" | "messages" | "theme" | "settings" | "stats" | "versions" | "team";
type PreviewViewport = "desktop" | "tablet" | "mobile";

function hexToHsv(hex: string): { hue: number; saturation: number; value: number } {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#172033";
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  return { hue: hue < 0 ? hue + 360 : hue, saturation: max ? delta / max : 0, value: max };
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = value - chroma;
  const [red, green, blue] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[red, green, blue].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function FullColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hsv = hexToHsv(value);
  const updateSpectrum = (clientX: number, clientY: number) => {
    const bounds = spectrumRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const saturation = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    const brightness = 1 - Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height));
    onChange(hsvToHex(hsv.hue, saturation, brightness));
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => updateSpectrum(event.clientX, event.clientY);
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging, hsv.hue]);

  return (
    <div className="relative">
      <span className="block">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" aria-label={`${label} — ouvrir le sélecteur complet`} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="h-12 w-12 shrink-0 cursor-pointer rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(148,163,184,0.7)]" style={{ backgroundColor: value }} />
        <Input aria-label={`${label} — valeur hexadécimale`} value={value} onChange={(event) => { const next = event.target.value; if (/^#[0-9a-f]{0,6}$/i.test(next)) onChange(next); }} onBlur={() => { if (!/^#[0-9a-f]{6}$/i.test(value)) onChange("#172033"); }} />
      </div>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Choisir une couleur</p><button type="button" className="text-xs text-slate-500 underline" onClick={() => setOpen(false)}>Fermer</button></div>
          <div ref={spectrumRef} role="slider" aria-label={`${label} — saturation et luminosité`} aria-valuetext={value} tabIndex={0} className="relative h-36 cursor-crosshair overflow-hidden rounded-lg" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.hue} 100% 50%))` }} onPointerDown={(event) => { setDragging(true); updateSpectrum(event.clientX, event.clientY); }}>
            <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,0.8)]" style={{ left: `${hsv.saturation * 100}%`, top: `${(1 - hsv.value) * 100}%` }} />
          </div>
          <input aria-label={`${label} — teinte`} type="range" min="0" max="360" value={hsv.hue} onChange={(event) => onChange(hsvToHex(Number(event.target.value), hsv.saturation, hsv.value))} className="mt-4 h-4 w-full cursor-pointer appearance-none rounded-full" style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }} />
          <div className="mt-3 flex items-center gap-2"><span className="h-7 w-7 rounded border border-slate-200" style={{ backgroundColor: value }} /><span className="text-xs font-medium text-slate-600">{value.toUpperCase()}</span></div>
        </div>
      )}
    </div>
  );
}

interface InlineConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  onConfirm: () => void;
}

function MediaThumbnail({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 text-center text-xs text-slate-600">
        <ImageIcon className="h-5 w-5 text-slate-400" />
        <span className="line-clamp-2 font-medium">{alt || "Aperçu indisponible"}</span>
      </div>
    );
  }
  return (
    <div className="h-36 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

const CLIENT_ADMIN_STORAGE_KEY = "mazigho:client-admin:selectedSiteId";

const INDEPENDENT_STOCK_IMAGES = [
  {
    id: "atelier-lumineux",
    label: "Atelier lumineux",
    altText: "Atelier lumineux avec matières naturelles",
    url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80&fm=webp",
    sourceUrl: "https://unsplash.com/s/photos/fashion-studio",
  },
  {
    id: "rencontre-nature",
    label: "Rencontre en plein air",
    altText: "Groupe réuni dans un environnement naturel",
    url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80&fm=webp",
    sourceUrl: "https://unsplash.com/s/photos/community",
  },
  {
    id: "interieur-clair",
    label: "Intérieur clair",
    altText: "Intérieur lumineux aux lignes épurées",
    url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80&fm=webp",
    sourceUrl: "https://unsplash.com/s/photos/interior",
  },
  {
    id: "botanique",
    label: "Botanique",
    altText: "Feuilles et végétation dans une lumière naturelle",
    url: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=80&fm=webp",
    sourceUrl: "https://unsplash.com/s/photos/natural",
  },
] as const;

export default function IndependentSiteAdminPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedSiteOverrideId, setSelectedSiteOverrideId] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");

  // Champs éditoriaux : identité du site et page active
  const [draftSiteTitle, setDraftSiteTitle] = useState("");
  const [draftPageTitle, setDraftPageTitle] = useState("");
  const [draftHeading, setDraftHeading] = useState("");
  const [draftIntro, setDraftIntro] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [draftImageAlt, setDraftImageAlt] = useState("");
  const [draftSeoTitle, setDraftSeoTitle] = useState("");
  const [draftSeoDescription, setDraftSeoDescription] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<{
    kind: "heading" | "intro" | "seoTitle" | "seoDescription";
    text: string;
  } | null>(null);
  const [draftTheme, setDraftTheme] = useState({
    primaryColor: "#1e3a2f",
    accentColor: "#6b8e6e",
    backgroundColor: "#f8fafc",
    headingFont: "Georgia, serif",
    bodyFont: "system-ui, sans-serif",
  });
  const [draftSettings, setDraftSettings] = useState({
    faviconUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "Le site est momentanément en maintenance. Merci de revenir bientôt.",
    socialLinks: { facebook: "", instagram: "", linkedin: "", youtube: "" },
    legal: { organizationName: "", contactEmail: "", country: "", legalNoticeUrl: "", privacyUrl: "" },
  });

  // Ajout de section / actualité dans la page active
  const [newSectionKind, setNewSectionKind] = useState<"section" | "actualite">("actualite");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDate, setNewSectionDate] = useState("");
  const [newSectionText, setNewSectionText] = useState("");

  // Ajout d'une nouvelle page simple
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageIntro, setNewPageIntro] = useState("");

  // Bibliothèque média
  const [newMediaLabel, setNewMediaLabel] = useState("");
  const [newMediaAlt, setNewMediaAlt] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [imageAiSubject, setImageAiSubject] = useState("");
  const [imageAiFormat, setImageAiFormat] = useState<"hero" | "story" | "square">("hero");
  const [imageAiStyle, setImageAiStyle] = useState<"editorial" | "soft" | "bold">("editorial");
  const [generatedSiteImage, setGeneratedSiteImage] = useState<string | null>(null);
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [editMediaLabel, setEditMediaLabel] = useState("");
  const [editMediaAlt, setEditMediaAlt] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editMediaReplaceInPages, setEditMediaReplaceInPages] = useState(true);

  // Versions
  const [versionLabelInput, setVersionLabelInput] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "new" | "read" | "archived">("all");

  // Invitations client (Propriétaire uniquement)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor">("editor");
  const [inviteExpiresHours, setInviteExpiresHours] = useState<number>(72);
  const [directAccessEmail, setDirectAccessEmail] = useState("");
  const [directAccessName, setDirectAccessName] = useState("");
  const [directAccessPassword, setDirectAccessPassword] = useState("");
  const [directAccessRole, setDirectAccessRole] = useState<"admin" | "editor">("editor");
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);
  const [transferTargetEmail, setTransferTargetEmail] = useState("");
  const [transferConfirmationTitle, setTransferConfirmationTitle] = useState("");
  const [lastInvitation, setLastInvitation] = useState<{
    email: string;
    role: "admin" | "editor";
    invitationUrl: string;
    expiresAt: string;
    delivery: "not_configured" | "delivered" | "failed";
  } | null>(null);

  // Aperçu intégré avant publication + bandeaux + confirmation inline + guide client
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingModalMode, setTrainingModalMode] = useState<TrainingModalMode>("guide");
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [inlineConfirm, setInlineConfirm] = useState<InlineConfirmState | null>(null);

  const urlParams = useMemo(() => {
    if (typeof window === "undefined") {
      return { siteId: null as number | null, siteSlug: "" };
    }
    const params = new URLSearchParams(window.location.search);
    const rawId = Number(params.get("siteId"));
    const siteId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;
    const siteSlug = (params.get("siteSlug") || params.get("slug") || "")
      .trim()
      .toLowerCase();
    return { siteId, siteSlug };
  }, []);

  const projectsQuery = trpc.independentSiteBuilder.listProjects.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const storedSiteId = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = Number(window.sessionStorage.getItem(CLIENT_ADMIN_STORAGE_KEY));
      return Number.isInteger(raw) && raw > 0 ? raw : null;
    } catch {
      return null;
    }
  }, []);

  const accessibleProjects = projectsQuery.data ?? [];
  const accessibleProject = useMemo(() => {
    if (accessibleProjects.length === 0) return null;
    if (selectedSiteOverrideId) {
      const overridden = accessibleProjects.find((p) => p.id === selectedSiteOverrideId);
      if (overridden) return overridden;
    }
    if (urlParams.siteId) {
      const byId = accessibleProjects.find((p) => p.id === urlParams.siteId);
      if (byId) return byId;
    }
    if (urlParams.siteSlug) {
      const bySlug = accessibleProjects.find(
        (p) => p.slug.toLowerCase() === urlParams.siteSlug,
      );
      if (bySlug) return bySlug;
    }
    if (storedSiteId) {
      const byStored = accessibleProjects.find((p) => p.id === storedSiteId);
      if (byStored) return byStored;
    }
    return accessibleProjects[0];
  }, [accessibleProjects, selectedSiteOverrideId, storedSiteId, urlParams.siteId, urlParams.siteSlug]);

  const siteId = accessibleProject?.id ?? null;

  useEffect(() => {
    if (!siteId || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(CLIENT_ADMIN_STORAGE_KEY, String(siteId));
    } catch {
      // ignore storage restrictions
    }
    const nextUrl = new URL(window.location.href);
    if (nextUrl.searchParams.get("siteId") !== String(siteId)) {
      nextUrl.searchParams.set("siteId", String(siteId));
      window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
    }
  }, [siteId]);

  async function handleClientLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.removeItem(CLIENT_ADMIN_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      await logout();
      toast.success("Vous êtes déconnecté de l’administration de votre site.");
      setLocation("/connexion-administration?returnTo=%2Fadministration-site");
    } catch {
      toast.error("Impossible de terminer la déconnexion. Réessayez.");
    } finally {
      setLoggingOut(false);
    }
  }

  const projectQuery = trpc.independentSiteBuilder.getProject.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );

  const roleQuery = trpc.independentSiteBuilder.getAccessRole.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );

  const role: IndependentSiteClientRole = roleQuery.data?.role ?? "editor";
  const roleInfo = getIndependentSiteRolePresentation(role);
  const canEdit = role === "owner" || role === "admin" || role === "editor";
  const canAdminister = role === "owner" || role === "admin";
  const canManageTeam = role === "owner";

  const mediaQuery = trpc.independentSiteBuilder.listMedia.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );

  const versionsQuery = trpc.independentSiteBuilder.listVersions.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId) && canAdminister, retry: false, refetchOnWindowFocus: false },
  );

  const accessQuery = trpc.independentSiteBuilder.listAccess.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId) && canManageTeam, retry: false, refetchOnWindowFocus: false },
  );

  const formSubmissionsQuery = trpc.independentSiteBuilder.listFormSubmissions.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );
  const analyticsQuery = trpc.independentSiteBuilder.getAnalyticsSummary.useQuery(
    { siteId: siteId ?? 0 },
    { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
  );

  useEffect(() => {
    if (tab === "stats" && siteId) {
      void analyticsQuery.refetch();
    }
  }, [tab, siteId]);

  const markFormReadMutation = trpc.independentSiteBuilder.markFormSubmissionRead.useMutation({
    onSuccess: () => {
      void formSubmissionsQuery.refetch();
      void analyticsQuery.refetch();
      toast.success("Message marqué comme lu.");
    },
    onError: (error) => toast.error(error.message || "Impossible de marquer ce message comme lu."),
  });

  const updateFormStatusMutation = trpc.independentSiteBuilder.updateFormSubmissionStatus.useMutation({
    onSuccess: (updated) => {
      void formSubmissionsQuery.refetch();
      void analyticsQuery.refetch();
      if (updated.status === "archived") {
        toast.success("Message archivé.");
      } else if (updated.status === "read") {
        toast.success("Message marqué comme lu.");
      } else {
        toast.success("Message restauré.");
      }
    },
    onError: (error) =>
      toast.error(error.message || "Impossible de mettre à jour le statut de ce message."),
  });

  const project = projectQuery.data ?? null;
  const pages = (project?.pages ?? []) as IndependentSitePage[];
  const activePage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId],
  );

  // Redirection vers la connexion dédiée à l'administration client si non authentifié
  useEffect(() => {
    if (authLoading || user) return;
    const returnTarget = urlParams.siteId
      ? `/administration-site?siteId=${urlParams.siteId}`
      : urlParams.siteSlug
        ? `/administration-site?siteSlug=${urlParams.siteSlug}`
        : "/administration-site";
    setLocation(`/connexion-administration?returnTo=${encodeURIComponent(returnTarget)}`);
  }, [authLoading, setLocation, urlParams.siteId, urlParams.siteSlug, user]);

  // Synchronisation du titre du site
  useEffect(() => {
    if (!project) return;
    setDraftSiteTitle(project.title);
    setDraftTheme(project.theme);
    setDraftSettings(project.settings);
    if (typeof document !== "undefined") {
      document.title = `Administration — ${project.title}`;
    }
  }, [project?.id, project?.title, project?.settings]);

  const handleSaveTheme = (event: React.FormEvent) => {
    event.preventDefault();
    if (!siteId || !canEdit) return;
    saveMutation.mutate({ siteId, theme: draftTheme });
  };

  const handleSaveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    if (!siteId || !canAdminister) return;
    saveMutation.mutate({ siteId, settings: draftSettings });
  };

  // Synchronisation des champs de la page active
  useEffect(() => {
    if (!activePage) return;
    setSelectedPageId(activePage.id);
    setDraftPageTitle(activePage.title || "");
    setDraftHeading(readFirstHtmlTag(activePage.html, "h1"));
    setDraftIntro(readFirstHtmlTag(activePage.html, "p"));
    setDraftImage(readFirstHtmlImage(activePage.html));
    setDraftImageAlt("");
    setDraftSeoTitle(activePage.seoTitle || "");
    setDraftSeoDescription(activePage.seoDescription || "");
  }, [activePage?.id, activePage?.html, activePage?.title, activePage?.seoTitle, activePage?.seoDescription]);

  // Détection exacte des modifications non enregistrées dans les formulaires
  const hasUnsavedSiteTitle = Boolean(
    project && draftSiteTitle.trim() !== project.title.trim(),
  );
  const hasUnsavedPageChanges = useMemo(() => {
    if (!activePage) return false;
    return (
      draftPageTitle.trim() !== (activePage.title || "").trim() ||
      draftHeading.trim() !== readFirstHtmlTag(activePage.html, "h1").trim() ||
      draftIntro.trim() !== readFirstHtmlTag(activePage.html, "p").trim() ||
      draftImage.trim() !== readFirstHtmlImage(activePage.html).trim() ||
      draftSeoTitle.trim() !== (activePage.seoTitle || "").trim() ||
      draftSeoDescription.trim() !== (activePage.seoDescription || "").trim()
    );
  }, [
    activePage,
    draftHeading,
    draftImage,
    draftIntro,
    draftPageTitle,
    draftSeoDescription,
    draftSeoTitle,
  ]);
  const hasAnyUnsavedChanges = hasUnsavedSiteTitle || hasUnsavedPageChanges;

  // Images détectées dans les pages du site
  const embeddedPageImages = useMemo(() => {
    const seen = new Set<string>();
    const collected: Array<{ src: string; alt: string; pageTitle: string; pageId: string }> = [];
    for (const page of pages) {
      const imgs = extractImagesFromPageHtml(page.html || "");
      for (const img of imgs) {
        if (!img.src || seen.has(img.src)) continue;
        seen.add(img.src);
        collected.push({
          src: img.src,
          alt: img.alt || page.title,
          pageTitle: page.title,
          pageId: page.id,
        });
      }
    }
    return collected;
  }, [pages]);

  // Mutations réellement connectées aux endpoints existants
  const saveMutation = trpc.independentSiteBuilder.saveProject.useMutation({
    onSuccess: async (saved) => {
      utils.independentSiteBuilder.getProject.setData({ siteId: saved.id }, saved);
      await Promise.all([
        utils.independentSiteBuilder.listProjects.invalidate(),
        utils.independentSiteBuilder.getProject.invalidate({ siteId: saved.id }),
        canAdminister
          ? utils.independentSiteBuilder.listVersions.invalidate({ siteId: saved.id })
          : Promise.resolve(),
      ]);
      const msg = `Modifications enregistrées sur « ${saved.title} » (${formatClientDateTime(saved.updatedAt)}).`;
      setFeedbackBanner({ tone: "success", message: msg });
      toast.success("Modifications enregistrées.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });
  const contentAiMutation = trpc.independentSiteBuilder.generateContentSuggestion.useMutation({
    onSuccess: (suggestion) => {
      setAiSuggestion({ kind: suggestion.kind, text: suggestion.text });
      toast.success("Suggestion prête à comparer. Rien n’a été enregistré.");
    },
    onError: (error) => toast.error(error.message || "Impossible de générer une suggestion."),
  });
  const requestAiSuggestion = (kind: "heading" | "intro" | "seoTitle" | "seoDescription", currentText: string) => {
    if (!siteId || !activePage || !canEdit || contentAiMutation.isPending) return;
    contentAiMutation.mutate({
      siteId,
      kind,
      currentText,
      pageTitle: activePage.title,
      siteTitle: project?.title ?? "",
      instruction: currentText.trim()
        ? "Reformule ce contenu en conservant son intention et ses informations."
        : "Rédige une première proposition pertinente pour cette page.",
    });
  };
  const keepAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.kind === "heading") setDraftHeading(aiSuggestion.text);
    if (aiSuggestion.kind === "intro") setDraftIntro(aiSuggestion.text);
    if (aiSuggestion.kind === "seoTitle") setDraftSeoTitle(aiSuggestion.text);
    if (aiSuggestion.kind === "seoDescription") setDraftSeoDescription(aiSuggestion.text);
    setAiSuggestion(null);
    toast.success("Suggestion conservée dans le brouillon. Enregistrez la page pour la sauvegarder.");
  };

  const publishMutation = trpc.independentSiteBuilder.publishSite.useMutation({
    onSuccess: async (published) => {
      utils.independentSiteBuilder.getProject.setData({ siteId: published.id }, published);
      await Promise.all([
        utils.independentSiteBuilder.listProjects.invalidate(),
        utils.independentSiteBuilder.listVersions.invalidate({ siteId: published.id }),
      ]);
      const msg = `Le site « ${published.title} » est désormais publié et visible sur /sites/${published.slug}.`;
      setFeedbackBanner({ tone: "success", message: msg });
      toast.success("Site publié avec succès.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const unpublishMutation = trpc.independentSiteBuilder.unpublishSite.useMutation({
    onSuccess: async (unpublished) => {
      utils.independentSiteBuilder.getProject.setData({ siteId: unpublished.id }, unpublished);
      await utils.independentSiteBuilder.listProjects.invalidate();
      const msg = `Le site « ${unpublished.title} » est repassé en brouillon privé.`;
      setFeedbackBanner({ tone: "success", message: msg });
      toast.success("Site repassé en brouillon.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const generateSiteImageMutation = trpc.independentSiteBuilder.generateIndependentSiteImage.useMutation({
    onSuccess: (result) => {
      setGeneratedSiteImage(result.url);
      toast.success("Visuel généré. Vérifiez-le avant de l’ajouter à la bibliothèque.");
    },
    onError: (error) => toast.error(error.message || "Impossible de générer ce visuel."),
  });

  const addMediaMutation = trpc.independentSiteBuilder.addMedia.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listMedia.invalidate({ siteId });
      setNewMediaLabel("");
      setNewMediaAlt("");
      setNewMediaUrl("");
      setFeedbackBanner({
        tone: "success",
        message: "L’image a été ajoutée à la bibliothèque média de votre site.",
      });
      toast.success("Image ajoutée.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const updateMediaMutation = trpc.independentSiteBuilder.updateMediaMetadata.useMutation({
    onSuccess: async () => {
      if (siteId) {
        await Promise.all([
          utils.independentSiteBuilder.listMedia.invalidate({ siteId }),
          utils.independentSiteBuilder.getProject.invalidate({ siteId }),
        ]);
      }
      setEditingMediaId(null);
      setFeedbackBanner({
        tone: "success",
        message: editMediaReplaceInPages
          ? "L’image et ses occurrences dans les pages ont été mises à jour."
          : "Les informations de l’image ont été mises à jour.",
      });
      toast.success("Image mise à jour.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const deleteMediaMutation = trpc.independentSiteBuilder.deleteMedia.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listMedia.invalidate({ siteId });
      setFeedbackBanner({
        tone: "success",
        message: "L’image a été retirée de la bibliothèque média.",
      });
      toast.success("Image supprimée de la bibliothèque.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const createVersionMutation = trpc.independentSiteBuilder.createVersion.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listVersions.invalidate({ siteId });
      setVersionLabelInput("");
      setFeedbackBanner({
        tone: "success",
        message: "Un point de sauvegarde a été enregistré dans l’historique du site.",
      });
      toast.success("Version enregistrée.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const restoreVersionMutation = trpc.independentSiteBuilder.restoreVersion.useMutation({
    onSuccess: async (restored) => {
      utils.independentSiteBuilder.getProject.setData({ siteId: restored.id }, restored);
      await Promise.all([
        utils.independentSiteBuilder.listProjects.invalidate(),
        utils.independentSiteBuilder.listVersions.invalidate({ siteId: restored.id }),
      ]);
      setFeedbackBanner({
        tone: "success",
        message: `La version sélectionnée a été restaurée sur « ${restored.title} ».`,
      });
      toast.success("Version restaurée.");
    },
    onError: (err) => {
      const msg = formatIndependentBuilderErrorMessage(err);
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const inviteAccessMutation = trpc.independentSiteBuilder.inviteAccess.useMutation({
    onSuccess: async (created) => {
      if (siteId) await utils.independentSiteBuilder.listAccess.invalidate({ siteId });
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const path =
        created.invitationPath ||
        (created.developmentOnlyToken
          ? `/constructeur-sites/invitation/${encodeURIComponent(created.developmentOnlyToken)}`
          : "/connexion-administration");
      const invitationUrl = `${origin}${path}`;
      const expiresAt =
        typeof created.expiresAt === "string"
          ? created.expiresAt
          : created.invitationExpiresAt ||
            new Date(Date.now() + inviteExpiresHours * 3600000).toISOString();
      setLastInvitation({
        email: created.email,
        role: created.role === "admin" ? "admin" : "editor",
        invitationUrl,
        expiresAt,
        delivery: created.invitationDelivery,
      });
      setCopiedInviteUrl(false);
      setInviteEmail("");
      setFeedbackBanner({
        tone: "success",
        message:
          created.invitationDelivery === "delivered"
            ? `Invitation envoyée par e-mail à ${created.email}. Vous pouvez aussi copier le lien d’activation ci-dessous.`
            : `Invitation personnelle prête pour ${created.email}. Copiez et transmettez le lien d’activation ci-dessous.`,
      });
      toast.success("Invitation créée.");
    },
    onError: (err) => {
      const msg = err.message || "Impossible de créer cette invitation.";
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const createAccessMutation = trpc.independentSiteBuilder.createAccess.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listAccess.invalidate({ siteId });
      setDirectAccessEmail("");
      setDirectAccessName("");
      setDirectAccessPassword("");
      setFeedbackBanner({ tone: "success", message: "Accès indépendant créé. Communiquez les identifiants de manière privée." });
      toast.success("Accès indépendant créé.");
    },
    onError: (err) => {
      const msg = err.message || "Impossible de créer cet accès indépendant.";
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const updateAccessRoleMutation = trpc.independentSiteBuilder.updateAccessRole.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listAccess.invalidate({ siteId });
      setFeedbackBanner({
        tone: "success",
        message: "Le rôle du membre a été mis à jour.",
      });
      toast.success("Rôle mis à jour.");
    },
    onError: (err) => {
      const msg = err.message || "Impossible de modifier le rôle de ce membre.";
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  const revokeAccessMutation = trpc.independentSiteBuilder.revokeAccess.useMutation({
    onSuccess: async () => {
      if (siteId) await utils.independentSiteBuilder.listAccess.invalidate({ siteId });
      setFeedbackBanner({
        tone: "success",
        message: "L’accès et le lien d’invitation associés ont été révoqués immédiatement.",
      });
      toast.success("Accès révoqué.");
    },
    onError: (err) => {
      const msg = err.message || "Impossible de révoquer cet accès.";
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });
  const transferOwnershipMutation = trpc.independentSiteBuilder.transferOwnership.useMutation({
    onSuccess: async () => {
      if (siteId) {
        await Promise.all([
          utils.independentSiteBuilder.listProjects.invalidate(),
          utils.independentSiteBuilder.listAccess.invalidate({ siteId }),
          utils.independentSiteBuilder.getAccessRole.invalidate({ siteId }),
          utils.independentSiteBuilder.getProject.invalidate({ siteId }),
        ]);
      }
      setTransferTargetEmail("");
      setTransferConfirmationTitle("");
      setFeedbackBanner({
        tone: "success",
        message: "La propriété du site a été transférée. Votre accès est conservé comme administrateur.",
      });
      toast.success("Propriété transférée.");
    },
    onError: (err) => {
      const msg = err.message || "Le transfert de propriété n’a pas été effectué.";
      setFeedbackBanner({ tone: "error", message: msg });
      toast.error(msg);
    },
  });

  // États de chargement, erreur et accès vide (clairs, accessibles et sans liens MAZIGHO)
  if (
    authLoading ||
    !user ||
    projectsQuery.isLoading ||
    (Boolean(siteId) && (projectQuery.isLoading || roleQuery.isLoading))
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 text-slate-900">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-7 text-center"
        >
          <Loader2 className="h-6 w-6 animate-spin text-[#1e3a2f] motion-reduce:animate-none" />
          <p className="text-sm font-semibold text-slate-900">
            Chargement de l’administration de votre site…
          </p>
          <p className="text-xs text-slate-600">
            Vérification sécurisée de votre session et de vos droits d’accès.
          </p>
        </div>
      </main>
    );
  }

  if (projectsQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10 text-slate-900">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-slate-900">
                Impossible de charger votre espace d’administration
              </h1>
              <p className="text-sm leading-relaxed text-slate-600">
                Votre session n’a pas permis de récupérer les sites qui vous sont attribués.
                Rechargez la page ou reconnectez-vous avec votre adresse e-mail autorisée.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={() => void projectsQuery.refetch()}
                  className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/connexion-administration">Se reconnecter</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!accessibleProject || !siteId || projectQuery.isError || !project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10 text-slate-900">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-slate-900">
                Aucun site actif n’est associé à ce compte
              </h1>
              <p className="text-sm leading-relaxed text-slate-600">
                Votre compte ({user.email || "compte connecté"}) ne possède pas d’accès actif
                à ce site. Vérifiez que vous utilisez bien l’adresse e-mail sur laquelle vous
                avez reçu votre invitation.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-3">
                <Button
                  asChild
                  className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"
                >
                  <Link href="/connexion-administration">Changer de compte</Link>
                </Button>
                {urlParams.siteSlug && (
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href={`/sites/${urlParams.siteSlug}`}>
                      Retour au site public
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentProject = project;
  const statusSummary = formatClientStatusSummary(
    currentProject.status,
    hasAnyUnsavedChanges,
    currentProject.updatedAt,
  );
  const launchChecklist = [
    { label: "Définir le titre du site", done: Boolean(currentProject.title.trim()) },
    { label: "Remplacer les images provisoires", done: embeddedPageImages.length === 0 || embeddedPageImages.every((image) => mediaQuery.data?.some((media) => media.url === image.src)) },
    { label: "Vérifier les titres et descriptions SEO", done: pages.length > 0 && pages.every((page) => Boolean(page.seoTitle?.trim()) && Boolean(page.seoDescription?.trim())) },
    { label: "Publier le site", done: currentProject.status === "published" },
  ];
  const completedLaunchSteps = launchChecklist.filter((step) => step.done).length;
  const launchProgress = Math.round((completedLaunchSteps / launchChecklist.length) * 100);
  const recentActivity = (versionsQuery.data ?? []).slice(0, 4).map((version) => ({
    label: version.label || `Version ${version.versionNumber}`,
    date: formatClientDateTime(version.createdAt),
  }));
  const selectedInviteRoleDetail = CLIENT_ADMIN_ROLE_MATRIX.find(
    (item) => item.role === inviteRole,
  )!;
  const currentRoleDetail = CLIENT_ADMIN_ROLE_MATRIX.find(
    (item) => item.role === role,
  )!;

  // Aperçu temps réel tenant compte des modifications en cours dans le formulaire
  const previewHtmlForActivePage = (() => {
    if (!activePage) return "";
    let html = activePage.html || "";
    if (draftHeading.trim()) html = replaceFirstHtmlTag(html, "h1", draftHeading);
    if (draftIntro.trim()) html = replaceFirstHtmlTag(html, "p", draftIntro);
    if (draftImage.trim()) {
      html = replaceFirstHtmlImage(html, draftImage, draftImageAlt || undefined);
    }
    return html;
  })();

  const previewSrcDoc = activePage
    ? buildClientPreviewSrcDoc({
        pageTitle: draftPageTitle || activePage.title,
        siteTitle: draftSiteTitle || currentProject.title,
        html: previewHtmlForActivePage,
        css: activePage.css || "",
        theme: draftTheme,
      })
    : "";

  // Handlers éditoriaux
  function handleSaveSiteTitle(event: React.FormEvent) {
    event.preventDefault();
    const clean = draftSiteTitle.trim();
    if (!canEdit || !clean || !siteId) return;
    saveMutation.mutate({
      siteId,
      title: clean,
      createVersionLabel: `Titre du site modifié · ${clean}`,
    });
  }

  function handleSaveActivePage(event: React.FormEvent) {
    event.preventDefault();
    if (!activePage || !canEdit || !siteId) return;
    let nextHtml = activePage.html || "";
    if (draftHeading.trim()) {
      nextHtml = replaceFirstHtmlTag(nextHtml, "h1", draftHeading);
    }
    if (draftIntro.trim()) {
      nextHtml = replaceFirstHtmlTag(nextHtml, "p", draftIntro);
    }
    if (draftImage.trim()) {
      nextHtml = replaceFirstHtmlImage(nextHtml, draftImage, draftImageAlt || undefined);
    }
    const nextPages = pages.map((p) =>
      p.id === activePage.id
        ? {
            ...p,
            title: draftPageTitle.trim() || p.title,
            seoTitle: draftSeoTitle.trim() || p.seoTitle,
            seoDescription: draftSeoDescription.trim() || p.seoDescription,
            html: nextHtml,
          }
        : p,
    );
    saveMutation.mutate({
      siteId,
      pages: nextPages as any,
      createVersionLabel: `Mise à jour · ${draftPageTitle.trim() || activePage.title}`,
    });
  }

  function handleAddSectionOrNews(event: React.FormEvent) {
    event.preventDefault();
    if (!activePage || !canEdit || !siteId) return;
    if (!newSectionTitle.trim() || !newSectionText.trim()) return;
    const nextHtml = appendClientSectionHtml(activePage.html, {
      title: newSectionTitle,
      body: newSectionText,
      kind: newSectionKind,
      dateLabel: newSectionDate,
    });
    const nextPages = pages.map((p) =>
      p.id === activePage.id ? { ...p, html: nextHtml } : p,
    );
    saveMutation.mutate({
      siteId,
      pages: nextPages as any,
      createVersionLabel: `${newSectionKind === "actualite" ? "Actualité ajoutée" : "Section ajoutée"} · ${activePage.title}`,
    });
    setNewSectionTitle("");
    setNewSectionDate("");
    setNewSectionText("");
  }

  function handleCreatePage(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || !siteId || !newPageTitle.trim()) return;
    const cleanTitle = newPageTitle.trim();
    const cleanIntro =
      newPageIntro.trim() ||
      `Retrouvez ici toutes les informations utiles concernant ${cleanTitle}.`;
    const slug = generateUniquePageSlug(cleanTitle, pages);
    const id = `page-${Date.now()}`;
    const safeTitle = cleanTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeIntro = cleanIntro.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const newPage: IndependentSitePage = {
      id,
      title: cleanTitle,
      slug,
      parentPageId: null,
      showInMenu: true,
      menuOrder: pages.length + 1,
      visibility: "public",
      seoTitle: `${cleanTitle} — ${currentProject.title}`,
      seoDescription: cleanIntro.slice(0, 155),
      html: `<section style="padding:56px 24px;background:#ffffff"><div style="max-width:920px;margin:0 auto"><h1 style="margin:0 0 16px;color:#0f172a;font-size:clamp(28px,4vw,42px);line-height:1.2">${safeTitle}</h1><p style="margin:0;color:#334155;font-size:17px;line-height:1.7">${safeIntro}</p></div></section>`,
      css: "",
    };
    const nextPages = [...pages, newPage];
    saveMutation.mutate({
      siteId,
      pages: nextPages as any,
      createVersionLabel: `Nouvelle page · ${cleanTitle}`,
    });
    setSelectedPageId(id);
    setNewPageTitle("");
    setNewPageIntro("");
    setShowNewPageForm(false);
  }

  function handleReplaceEmbeddedImage(oldUrl: string, newUrl: string) {
    if (!canEdit || !siteId || !newUrl.trim()) return;
    const replaced = replaceMediaUrlAcrossPages(pages, oldUrl, newUrl.trim());
    saveMutation.mutate({
      siteId,
      pages: replaced.pages as any,
      createVersionLabel: "Remplacement d’image sur le site",
    });
  }

  function handleCopyInviteLink(url: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedInviteUrl(true);
      toast.success("Lien d’activation copié.");
    });
  }

  function handleExportFormSubmissions() {
    const rows = formSubmissionsQuery.data ?? [];
    const csv = [["Date", "Statut", "Type", "Nom", "E-mail", "Téléphone", "Message"], ...rows.map((item) => [item.createdAt, item.status, item.formType, item.name, item.email, item.phone ?? "", item.message])]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    toast.success("Messages exportés en CSV avec succès.");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${currentProject.slug}-messages.csv`; link.click(); URL.revokeObjectURL(url);
  }

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }> = [
    { id: "overview", label: "Accueil", icon: LayoutDashboard },
    { id: "content", label: "Pages & contenus", icon: FileText, count: pages.length },
    {
      id: "media",
      label: "Images & médias",
      icon: ImagePlus,
      count: (mediaQuery.data?.length ?? 0) || embeddedPageImages.length,
    },
    {
      id: "messages",
      label: "Messages & formulaires",
      icon: MailPlus,
      count: (formSubmissionsQuery.data ?? []).filter((item) => item.status === "new").length,
    },
    { id: "theme", label: "Apparence / thème", icon: Palette },
    { id: "settings", label: "Paramètres & domaine", icon: Settings },
    { id: "stats", label: "Statistiques", icon: BarChart3 },
    {
      id: "versions",
      label: "Historique",
      icon: History,
      count: canAdminister ? versionsQuery.data?.length : undefined,
    },
    {
      id: "team",
      label: "Équipe & rôles",
      icon: UsersRound,
      count: canManageTeam ? accessQuery.data?.length : undefined,
    },
  ];

  return (
    <div
      className="min-h-screen overflow-x-clip bg-[#f8fafc] text-slate-900"
      data-client-admin-site-id={currentProject.id}
      data-client-admin-role={role}
    >
      {/* EN-TÊTE SOBRE ET CLAIR — CONTRAT 3 ZONES, ZÉRO LIEN VERS LE CONSTRUCTEUR PRIVÉ */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
              <span className="font-semibold text-[#1e3a2f]">Espace de gestion · {currentProject.title}</span>
              <span aria-hidden="true">·</span>
              <span>Rôle : {roleInfo.shortLabel}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  statusSummary.tone === "emerald"
                    ? "font-semibold text-emerald-800"
                    : statusSummary.tone === "amber"
                      ? "font-semibold text-amber-800"
                      : "font-semibold text-slate-700"
                }
              >
                {statusSummary.statusLabel}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900 sm:truncate sm:text-xl">
                {currentProject.title}
              </h1>
              {accessibleProjects.length > 1 && (
                <select
                  aria-label="Changer de site administré"
                  value={currentProject.id}
                  onChange={(event) => {
                    const nextId = Number(event.target.value);
                    setSelectedSiteOverrideId(nextId);
                    setSelectedPageId("");
                    setFeedbackBanner(null);
                  }}
                  className="min-h-[36px] max-w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                >
                  {accessibleProjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTrainingModalMode("guide");
                setTrainingModalOpen(true);
              }}
              className="min-h-[44px] whitespace-nowrap border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
            >
              <BookOpen className="mr-1.5 h-4 w-4 text-[#1e3a2f]" />
              Guide & vidéo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="min-h-[44px] whitespace-nowrap border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
            >
              <Eye className="mr-2 h-4 w-4 text-slate-600" />
              Aperçu
            </Button>
            {currentProject.status === "published" && (
              <Button
                asChild
                className="min-h-[44px] whitespace-nowrap bg-[#1e3a2f] px-4 text-sm font-medium text-white hover:bg-[#162b23] focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
              >
                <Link href={`/sites/${currentProject.slug}`}>
                  <Globe className="mr-2 h-4 w-4" />
                  Voir le site public
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={loggingOut}
              onClick={handleClientLogout}
              className="min-h-[44px] whitespace-nowrap border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
            >
              <LogOut className="mr-1.5 h-4 w-4 text-slate-500" />
              {loggingOut ? "Déconnexion…" : "Se déconnecter"}
            </Button>
          </div>
        </div>
      </header>

      {/* NAVIGATION MOBILE & TABLETTE (SOUS 1024px) */}
      <nav
        aria-label="Navigation de l’administration du site"
        className="border-b border-slate-200 bg-white lg:hidden"
      >
        <div className="mx-auto flex max-w-[1360px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] ${
                  active
                    ? "bg-[#1e3a2f] text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span
                    className={`tabular-nums text-xs ${
                      active ? "text-emerald-100" : "text-slate-500"
                    }`}
                  >
                    ({item.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CORPS PRINCIPAL : BARRE LATÉRALE DESKTOP + CONTENU */}
      <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            <nav
              aria-label="Sections de gestion"
              className="rounded-xl border border-slate-200 bg-white p-2"
            >
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setTab(item.id)}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[44px] w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] ${
                          active
                            ? "bg-[#1e3a2f] text-white"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {typeof item.count === "number" && (
                          <span
                            className={`tabular-nums text-xs ${
                              active ? "text-emerald-100" : "text-slate-500"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <BookOpen className="h-4 w-4 shrink-0 text-[#1e3a2f]" />
                <span>Prise en main rapide</span>
              </div>
              <p>
                Suivez le guide illustré en 18 étapes ou visionnez la vidéo de présentation pour
                administrer <strong className="text-slate-900">{currentProject.title}</strong> en
                toute autonomie.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTrainingModalMode("guide");
                    setTrainingModalOpen(true);
                  }}
                  className="min-h-[40px] w-full justify-start border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-[#1e3a2f]" />
                  Guide illustré (18 étapes)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTrainingModalMode("video");
                    setTrainingModalOpen(true);
                  }}
                  className="min-h-[40px] w-full justify-start border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Film className="mr-2 h-3.5 w-3.5 text-[#1e3a2f]" />
                  Voir la vidéo (2 min 10)
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#1e3a2f]" />
                <span>Espace dédié à votre site</span>
              </div>
              <p className="mt-2">{CLIENT_ISOLATION_NOTICE}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          {/* BANDEAU DE CONFIRMATION / ERREUR ACCESSIBLE */}
          {feedbackBanner && (
            <div
              role={feedbackBanner.tone === "error" ? "alert" : "status"}
              aria-live="polite"
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-sm ${
                feedbackBanner.tone === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : "border-rose-300 bg-rose-50 text-rose-950"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedbackBanner.tone === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                )}
                <span>{feedbackBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackBanner(null)}
                aria-label="Fermer ce message"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* CONFIRMATION INLINE (JAMAIS window.confirm) */}
          {inlineConfirm && (
            <div
              role="alertdialog"
              aria-labelledby="client-admin-confirm-title"
              aria-describedby="client-admin-confirm-desc"
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p id="client-admin-confirm-title" className="text-sm font-bold text-slate-900">
                  {inlineConfirm.title}
                </p>
                <p id="client-admin-confirm-desc" className="text-xs leading-relaxed text-slate-700">
                  {inlineConfirm.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInlineConfirm(null)}
                  className="min-h-[44px] bg-white"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const action = inlineConfirm.onConfirm;
                    setInlineConfirm(null);
                    action();
                  }}
                  className={`min-h-[44px] text-white ${
                    inlineConfirm.tone === "danger"
                      ? "bg-rose-700 hover:bg-rose-800"
                      : "bg-[#1e3a2f] hover:bg-[#162b23]"
                  }`}
                >
                  {inlineConfirm.confirmLabel}
                </Button>
              </div>
            </div>
          )}

          {/* ONGLET 1 : VUE D'ENSEMBLE */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Grille d'indicateurs réels, sobre, sans cartes imbriquées */}
              <section
                aria-label="État actuel du site"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Statut du site</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-bold text-slate-900">
                    {currentProject.status === "published" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-700" />
                    )}
                    <span>{statusSummary.statusLabel}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{statusSummary.saveStateLabel}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Dernière sauvegarde</p>
                  <p className="mt-2 text-sm font-bold tabular-nums text-slate-900">
                    {statusSummary.lastSavedText}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {hasAnyUnsavedChanges
                      ? "Des changements locaux attendent d’être enregistrés."
                      : "Toutes vos modifications sont sauvegardées."}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Pages du site</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                    {pages.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Adresse : <code className="font-mono text-slate-700">/sites/{currentProject.slug}</code>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Votre rôle sur ce site</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{roleInfo.shortLabel}</p>
                  <p className="mt-1 text-xs text-slate-600">{currentRoleDetail.audience}</p>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a2f]">Avant publication</p><h2 className="mt-1 text-lg font-bold text-slate-900">Checklist de lancement</h2><p className="mt-1 text-sm text-slate-600">{completedLaunchSteps} étape{completedLaunchSteps > 1 ? "s" : ""} sur {launchChecklist.length} terminée{completedLaunchSteps > 1 ? "s" : ""}.</p></div><span className="text-2xl font-bold tabular-nums text-[#1e3a2f]">{launchProgress}%</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${launchProgress}%` }} /></div>
                  <ul className="mt-5 space-y-3">{launchChecklist.map((step) => <li key={step.label} className="flex items-center gap-3 text-sm"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-emerald-100 text-emerald-800" : "border border-slate-300 text-slate-400"}`}>{step.done ? <Check className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}</span><span className={step.done ? "text-slate-700" : "font-medium text-slate-900"}>{step.label}</span></li>)}</ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a2f]">Pilotage</p><h2 className="mt-1 text-lg font-bold text-slate-900">Activité récente</h2></div><History className="h-5 w-5 text-slate-400" /></div>{recentActivity.length > 0 ? <ul className="mt-5 space-y-4">{recentActivity.map((activity, index) => <li key={`${activity.date}-${index}`} className="border-l-2 border-slate-200 pl-3"><p className="text-sm font-medium text-slate-800">{activity.label}</p><p className="mt-1 text-xs text-slate-500">{activity.date}</p></li>)}</ul> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">Les actions récentes apparaîtront ici après votre première sauvegarde ou publication.</p>}</div>
              </section>

              {/* Identité du site + Actions principales */}
              <section className="grid gap-6 xl:grid-cols-2">
                <form
                  onSubmit={handleSaveSiteTitle}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <h2 className="text-base font-bold text-slate-900">Identité du site</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Modifiez le nom principal affiché sur votre site et dans vos espaces de gestion.
                  </p>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="client-site-title" className="text-sm font-medium text-slate-800">
                      Titre du site
                    </Label>
                    <Input
                      id="client-site-title"
                      value={draftSiteTitle}
                      onChange={(e) => setDraftSiteTitle(e.target.value)}
                      disabled={!canEdit}
                      maxLength={160}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      disabled={!canEdit || !draftSiteTitle.trim() || !hasUnsavedSiteTitle || saveMutation.isPending}
                      className="min-h-[44px] bg-[#1e3a2f] px-4 text-sm font-medium text-white hover:bg-[#162b23]"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveMutation.isPending ? "Enregistrement…" : "Enregistrer le titre"}
                    </Button>
                    {!hasUnsavedSiteTitle && (
                      <span className="text-xs text-slate-500">Titre déjà à jour</span>
                    )}
                  </div>
                </form>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-bold text-slate-900">
                    Publication et actions rapides
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{statusSummary.statusDetail}</p>

                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Button
                      type="button"
                      onClick={() => setTab("content")}
                      className="min-h-[44px] bg-[#1e3a2f] px-4 text-sm font-medium text-white hover:bg-[#162b23]"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Modifier les pages et textes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTab("media")}
                      className="min-h-[44px] px-4 text-sm"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Gérer les images
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTab("messages")}
                      className="min-h-[44px] px-4 text-sm"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Boîte de réception
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTab("stats")}
                      className="min-h-[44px] px-4 text-sm"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Statistiques
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewOpen(true)}
                      className="min-h-[44px] px-4 text-sm"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Aperçu avant publication
                    </Button>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    {canAdminister ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-600">
                          {currentProject.status === "published"
                            ? "Votre site est actuellement accessible aux visiteurs."
                            : "Votre site est en brouillon privé tant que vous ne le publiez pas."}
                        </p>
                        {currentProject.status === "published" ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={unpublishMutation.isPending}
                            onClick={() =>
                              setInlineConfirm({
                                title: "Repasser le site en brouillon privé ?",
                                description:
                                  "Le site ne sera plus visible sur son adresse publique tant qu’il ne sera pas republié. Aucune page ni donnée ne sera supprimée.",
                                confirmLabel: "Repasser en brouillon",
                                tone: "danger",
                                onConfirm: () => unpublishMutation.mutate({ siteId }),
                              })
                            }
                            className="min-h-[44px] border-slate-300 text-sm text-slate-800"
                          >
                            Repasser en brouillon
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={publishMutation.isPending}
                            onClick={() => publishMutation.mutate({ siteId })}
                            className="min-h-[44px] bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            {publishMutation.isPending ? "Publication…" : "Publier le site"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-slate-600">
                        Avec votre rôle <strong>Éditeur</strong>, vos modifications sont
                        enregistrées en brouillon. La mise en ligne est effectuée par un
                        Administrateur ou le Propriétaire du site.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Derniers messages reçus (aperçu rapide de la boîte de réception isolée) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Derniers messages reçus</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {(formSubmissionsQuery.data ?? []).filter((item) => item.status === "new").length > 0
                        ? `${(formSubmissionsQuery.data ?? []).filter((item) => item.status === "new").length} nouveau(x) message(s) en attente de réponse.`
                        : "Toutes les demandes reçues via les formulaires de votre site sont centralisées ici."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTab("messages")}
                    className="min-h-[40px] border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5 text-[#1e3a2f]" />
                    Voir tous les messages
                  </Button>
                </div>

                {(formSubmissionsQuery.data ?? []).length === 0 ? (
                  <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                    Aucun message reçu pour le moment. Les demandes envoyées depuis votre site apparaîtront ici.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    {(formSubmissionsQuery.data ?? []).slice(0, 3).map((item) => (
                      <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-slate-900">{item.name}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="truncate text-xs text-slate-600">{item.email}</span>
                            {item.status === "new" && (
                              <>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="text-xs font-semibold text-emerald-700">Nouveau</span>
                              </>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</p>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">
                          {formatClientDateTime(item.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Séparation claire des espaces (Administrer / Modifier / Construire) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-bold text-slate-900">
                  Comment fonctionne votre espace d’administration
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Un cadre simple et sécurisé pour faire vivre votre site sans outil technique
                  complexe.
                </p>
                <div className="mt-5 grid gap-5 border-t border-slate-200 pt-5 md:grid-cols-3">
                  {CLIENT_ADMIN_SPACE_DISTINCTIONS.map((item, idx) => (
                    <div key={item.id} className="space-y-1.5">
                      <p className="text-xs font-semibold tabular-nums text-[#1e3a2f]">
                        0{idx + 1}.
                      </p>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ONGLET 2 : PAGES & CONTENUS */}
          {tab === "content" && (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Pages et contenus du site
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Sélectionnez une page pour mettre à jour son titre, son texte principal,
                      son image ou ajouter une actualité.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewOpen(true)}
                      className="min-h-[44px] whitespace-nowrap text-sm"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Aperçu de la page
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewPageForm((v) => !v)}
                      disabled={!canEdit}
                      className="min-h-[44px] whitespace-nowrap text-sm"
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Nouvelle page
                    </Button>
                  </div>
                </div>

                {/* Formulaire de création d'une nouvelle page */}
                {showNewPageForm && (
                  <form
                    onSubmit={handleCreatePage}
                    className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Créer une nouvelle page
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowNewPageForm(false)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Fermer
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-page-title">Titre de la nouvelle page</Label>
                        <Input
                          id="new-page-title"
                          value={newPageTitle}
                          onChange={(e) => setNewPageTitle(e.target.value)}
                          placeholder="Ex. Actualités 2026, Assemblée générale…"
                          required
                          className="min-h-[44px] bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-page-intro">Texte d’introduction (facultatif)</Label>
                        <Input
                          id="new-page-intro"
                          value={newPageIntro}
                          onChange={(e) => setNewPageIntro(e.target.value)}
                          placeholder="Courte présentation affichée en haut de la page"
                          className="min-h-[44px] bg-white"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newPageTitle.trim() || saveMutation.isPending}
                      className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer et enregistrer la page
                    </Button>
                  </form>
                )}

                {/* Sélecteur de pages */}
                {pages.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      Aucune page n’est encore configurée sur ce site.
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Créez votre première page avec le bouton « Nouvelle page » ci-dessus.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      role="tablist"
                      aria-label="Pages du site"
                      className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-4"
                    >
                      {pages.map((page) => {
                        const isSelected = page.id === activePage?.id;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setSelectedPageId(page.id)}
                            className={`inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] ${
                              isSelected
                                ? "border-[#1e3a2f] bg-[#1e3a2f] text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span>{page.title}</span>
                            <span
                              className={`font-mono text-xs ${
                                isSelected ? "text-emerald-100" : "text-slate-500"
                              }`}
                            >
                              {page.slug}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {activePage && (
                      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                        {/* Formulaire principal de modification de la page */}
                        <form onSubmit={handleSaveActivePage} className="space-y-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor="admin-page-title">Nom de la page dans le menu</Label>
                              <Input
                                id="admin-page-title"
                                value={draftPageTitle}
                                onChange={(e) => setDraftPageTitle(e.target.value)}
                                disabled={!canEdit}
                                className="min-h-[44px]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="admin-heading">Titre principal affiché (H1)</Label>
                                <Button type="button" variant="outline" size="sm" disabled={!canEdit || contentAiMutation.isPending} onClick={() => requestAiSuggestion("heading", draftHeading)}>
                                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                  {contentAiMutation.isPending ? "Génération…" : "IA"}
                                </Button>
                              </div>
                              <Input
                                id="admin-heading"
                                value={draftHeading}
                                onChange={(e) => setDraftHeading(e.target.value)}
                                disabled={!canEdit}
                                placeholder="Titre principal de cette page"
                                className="min-h-[44px]"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="admin-intro">Texte principal / présentation</Label>
                              <Button type="button" variant="outline" size="sm" disabled={!canEdit || contentAiMutation.isPending} onClick={() => requestAiSuggestion("intro", draftIntro)}>
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                IA
                              </Button>
                            </div>
                            <Textarea
                              id="admin-intro"
                              rows={5}
                              value={draftIntro}
                              onChange={(e) => setDraftIntro(e.target.value)}
                              disabled={!canEdit}
                              placeholder="Saisissez le texte de présentation de cette page…"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="admin-image">Image principale de la page (URL)</Label>
                            <Input
                              id="admin-image"
                              value={draftImage}
                              onChange={(e) => setDraftImage(e.target.value)}
                              disabled={!canEdit}
                              placeholder="https://…"
                              className="min-h-[44px]"
                            />
                            {draftImage.trim() && (
                              <div className="grid gap-3 pt-1 sm:grid-cols-[180px_minmax(0,1fr)]">
                                <MediaThumbnail
                                  src={draftImage.trim()}
                                  alt={draftImageAlt || draftPageTitle || "Image principale"}
                                />
                                <div className="space-y-1.5">
                                  <Label htmlFor="admin-image-alt" className="text-xs text-slate-600">
                                    Description de l’image (accessibilité)
                                  </Label>
                                  <Input
                                    id="admin-image-alt"
                                    value={draftImageAlt}
                                    onChange={(e) => setDraftImageAlt(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Décrivez brièvement la photo"
                                    className="min-h-[40px]"
                                  />
                                  <p className="text-xs text-slate-500">
                                    Pour gérer toutes vos photos, utilisez l’onglet « Images & médias ».
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="admin-seo-title">Titre pour Google (SEO)</Label>
                                <Button type="button" variant="outline" size="sm" disabled={!canEdit || contentAiMutation.isPending} onClick={() => requestAiSuggestion("seoTitle", draftSeoTitle)}>
                                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> IA
                                </Button>
                              </div>
                              <Input
                                id="admin-seo-title"
                                value={draftSeoTitle}
                                onChange={(e) => setDraftSeoTitle(e.target.value)}
                                disabled={!canEdit}
                                placeholder={`${activePage.title} — ${currentProject.title}`}
                                className="min-h-[44px]"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="admin-seo-desc">Résumé pour Google (SEO)</Label>
                                <Button type="button" variant="outline" size="sm" disabled={!canEdit || contentAiMutation.isPending} onClick={() => requestAiSuggestion("seoDescription", draftSeoDescription)}>
                                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> IA
                                </Button>
                              </div>
                              <Input
                                id="admin-seo-desc"
                                value={draftSeoDescription}
                                onChange={(e) => setDraftSeoDescription(e.target.value)}
                                disabled={!canEdit}
                                placeholder="Phrase courte décrivant la page (150 caractères max)"
                                className="min-h-[44px]"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Button
                              type="submit"
                              disabled={!canEdit || saveMutation.isPending}
                              className="min-h-[44px] bg-[#1e3a2f] px-5 text-sm font-medium text-white hover:bg-[#162b23]"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {saveMutation.isPending
                                ? "Enregistrement en cours…"
                                : "Enregistrer la page"}
                            </Button>
                            <span className="text-xs text-slate-600">
                              {hasUnsavedPageChanges
                                ? "Modifications en attente d’enregistrement."
                                : `Dernière sauvegarde : ${statusSummary.lastSavedText}`}
                            </span>
                          </div>
                        </form>

                        {aiSuggestion && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="Comparer la suggestion IA">
                            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Assistant IA indépendant</p>
                                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Comparer avant de remplacer</h3>
                                  <p className="mt-1 text-sm text-slate-600">La proposition n’est pas enregistrée. Vérifiez-la puis choisissez son usage.</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setAiSuggestion(null)} aria-label="Annuler"><X className="h-4 w-4" /></Button>
                              </div>
                              <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Texte actuel</p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{aiSuggestion.kind === "heading" ? draftHeading : aiSuggestion.kind === "intro" ? draftIntro : aiSuggestion.kind === "seoTitle" ? draftSeoTitle : draftSeoDescription || "(vide)"}</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Suggestion</p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{aiSuggestion.text}</p>
                                </div>
                              </div>
                              <div className="mt-6 flex flex-wrap justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setAiSuggestion(null)}>Annuler</Button>
                                <Button type="button" className="bg-[#1e3a2f] text-white hover:bg-[#162b23]" onClick={keepAiSuggestion}>Conserver la suggestion</Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Colonne latérale : Publier une actualité ou ajouter une section */}
                        <form
                          onSubmit={handleAddSectionOrNews}
                          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Ajouter une actualité ou une section
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              Ajoutez un nouveau bloc de texte en bas de la page «{" "}
                              <strong>{activePage.title}</strong> » sans modifier la mise en page
                              existante.
                            </p>
                          </div>

                          <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1">
                            <button
                              type="button"
                              onClick={() => setNewSectionKind("actualite")}
                              className={`min-h-[36px] flex-1 rounded-md text-xs font-semibold transition-colors ${
                                newSectionKind === "actualite"
                                  ? "bg-white text-slate-900 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Actualité
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewSectionKind("section")}
                              className={`min-h-[36px] flex-1 rounded-md text-xs font-semibold transition-colors ${
                                newSectionKind === "section"
                                  ? "bg-white text-slate-900 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              Section texte
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="new-section-title">Titre</Label>
                            <Input
                              id="new-section-title"
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              placeholder={
                                newSectionKind === "actualite"
                                  ? "Ex. Réunion familiale du printemps"
                                  : "Ex. Informations pratiques"
                              }
                              disabled={!canEdit}
                              className="min-h-[44px] bg-white"
                            />
                          </div>

                          {newSectionKind === "actualite" && (
                            <div className="space-y-1.5">
                              <Label htmlFor="new-section-date">Date ou repère (facultatif)</Label>
                              <Input
                                id="new-section-date"
                                value={newSectionDate}
                                onChange={(e) => setNewSectionDate(e.target.value)}
                                placeholder="Ex. 15 mai 2026"
                                disabled={!canEdit}
                                className="min-h-[44px] bg-white"
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label htmlFor="new-section-text">Texte</Label>
                            <Textarea
                              id="new-section-text"
                              rows={4}
                              value={newSectionText}
                              onChange={(e) => setNewSectionText(e.target.value)}
                              placeholder="Rédigez votre annonce ou paragraphe…"
                              disabled={!canEdit}
                              className="bg-white"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="outline"
                            disabled={
                              !canEdit ||
                              !newSectionTitle.trim() ||
                              !newSectionText.trim() ||
                              saveMutation.isPending
                            }
                            className="min-h-[44px] w-full bg-white text-sm font-medium"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {newSectionKind === "actualite"
                              ? "Ajouter cette actualité"
                              : "Ajouter cette section"}
                          </Button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}

          {/* ONGLET 3 : IMAGES & MÉDIAS (RÉELLEMENT CONNECTÉ À LA BIBLIOTHÈQUE SERVEUR) */}
          {tab === "media" && (
            <div className="space-y-6">
              <section className="rounded-xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-fuchsia-950">
                      <Sparkles className="h-4 w-4 text-fuchsia-700" /> Générer un visuel original
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                      Créez une image adaptée à votre site, vérifiez-la, puis ajoutez-la vous-même à la bibliothèque. Rien n’est enregistré automatiquement.
                    </p>
                  </div>
                  <span className="rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-xs font-semibold text-fuchsia-900">3 générations / minute</span>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="site-image-ai-subject">Sujet et ambiance</Label>
                    <Textarea
                      id="site-image-ai-subject"
                      value={imageAiSubject}
                      onChange={(event) => setImageAiSubject(event.target.value)}
                      placeholder="Ex. Une rencontre familiale chaleureuse en plein air, matières naturelles, lumière douce, sans texte."
                      maxLength={420}
                      rows={3}
                      disabled={!canEdit || generateSiteImageMutation.isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="site-image-ai-format">Format</Label>
                    <select id="site-image-ai-format" value={imageAiFormat} onChange={(event) => setImageAiFormat(event.target.value as typeof imageAiFormat)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm" disabled={!canEdit}>
                      <option value="hero">Hero 16:9</option>
                      <option value="story">Mobile 9:16</option>
                      <option value="square">Carré 1:1</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="site-image-ai-style">Style</Label>
                    <select id="site-image-ai-style" value={imageAiStyle} onChange={(event) => setImageAiStyle(event.target.value as typeof imageAiStyle)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm" disabled={!canEdit}>
                      <option value="editorial">Éditorial</option>
                      <option value="soft">Doux et chaleureux</option>
                      <option value="bold">Moderne et contrasté</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    className="min-h-[44px] bg-fuchsia-700 text-white hover:bg-fuchsia-800"
                    disabled={!canEdit || !siteId || imageAiSubject.trim().length < 12 || generateSiteImageMutation.isPending}
                    onClick={() => siteId && generateSiteImageMutation.mutate({ siteId, subject: imageAiSubject.trim(), format: imageAiFormat, style: imageAiStyle })}
                  >
                    {generateSiteImageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {generateSiteImageMutation.isPending ? "Génération…" : "Générer"}
                  </Button>
                </div>
                {generatedSiteImage && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <img src={generatedSiteImage} alt="Visuel généré à vérifier" className="max-h-64 w-full rounded-lg border border-emerald-100 bg-white object-contain lg:w-80" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" className="min-h-[42px] bg-emerald-700 text-white hover:bg-emerald-800" disabled={!canEdit || !siteId || addMediaMutation.isPending} onClick={() => siteId && addMediaMutation.mutate({ siteId, label: imageAiSubject.trim().slice(0, 160) || "Visuel généré", altText: imageAiSubject.trim().slice(0, 240) || "Visuel généré", url: generatedSiteImage })}>Ajouter à la bibliothèque</Button>
                        <Button type="button" variant="outline" className="min-h-[42px]" onClick={() => setGeneratedSiteImage(null)}>Écarter</Button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-emerald-900">Le visuel reste une proposition tant que vous ne cliquez pas sur « Ajouter à la bibliothèque ».</p>
                  </div>
                )}
              </section>
              <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-sky-950">Sélection d’images libres de droits</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Une petite sélection d’images Unsplash adaptées aux sites vitrines et associatifs. Ouvrez toujours la source pour vérifier les conditions et l’attribution avant publication.</p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-900">Source affichée</span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {INDEPENDENT_STOCK_IMAGES.map((image) => (
                    <article key={image.id} className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
                      <img src={image.url} alt={image.altText} className="h-36 w-full object-cover" loading="lazy" />
                      <div className="space-y-3 p-3">
                        <p className="text-sm font-semibold text-slate-900">{image.label}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" className="min-h-[38px] bg-sky-700 text-white hover:bg-sky-800" disabled={!canEdit || !siteId || addMediaMutation.isPending} onClick={() => siteId && addMediaMutation.mutate({ siteId, label: image.label, altText: image.altText, url: image.url })}>Ajouter</Button>
                          <Button type="button" size="sm" variant="outline" className="min-h-[38px]" asChild><a href={image.sourceUrl} target="_blank" rel="noreferrer">Source</a></Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-bold text-slate-900">
                  Ajouter une image à la bibliothèque du site
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Enregistrez vos photos avec un nom clair et une description accessible pour les
                  réutiliser ou remplacer les visuels de vos pages.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!canEdit || !siteId || !newMediaLabel.trim() || !newMediaUrl.trim()) return;
                    addMediaMutation.mutate({
                      siteId,
                      label: newMediaLabel.trim(),
                      altText: (newMediaAlt.trim() || newMediaLabel.trim()).slice(0, 240),
                      url: newMediaUrl.trim(),
                    });
                  }}
                  className="mt-4 grid gap-4 md:grid-cols-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="media-label">Nom de l’image</Label>
                    <Input
                      id="media-label"
                      value={newMediaLabel}
                      onChange={(e) => setNewMediaLabel(e.target.value)}
                      placeholder="Ex. Photo assemblée générale"
                      disabled={!canEdit}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-alt">Texte alternatif (description)</Label>
                    <Input
                      id="media-alt"
                      value={newMediaAlt}
                      onChange={(e) => setNewMediaAlt(e.target.value)}
                      placeholder="Description courte pour l’accessibilité"
                      disabled={!canEdit}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-url">Adresse de l’image (URL https://…)</Label>
                    <Input
                      id="media-url"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="https://…"
                      disabled={!canEdit}
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      type="submit"
                      disabled={
                        !canEdit ||
                        !newMediaLabel.trim() ||
                        !newMediaUrl.trim() ||
                        addMediaMutation.isPending
                      }
                      className="min-h-[44px] bg-[#1e3a2f] px-5 text-sm font-medium text-white hover:bg-[#162b23]"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      {addMediaMutation.isPending
                        ? "Ajout en cours…"
                        : "Ajouter à la bibliothèque"}
                    </Button>
                  </div>
                </form>
              </section>

              {/* Liste de la bibliothèque média enregistrée */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Bibliothèque média enregistrée ({mediaQuery.data?.length ?? 0})
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Remplacez une image partout sur le site ou appliquez-la sur la page active.
                    </p>
                  </div>
                </div>

                {mediaQuery.isLoading ? (
                  <p className="mt-4 text-sm text-slate-500">Chargement des médias…</p>
                ) : (mediaQuery.data?.length ?? 0) === 0 ? (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      Aucune image enregistrée dans la bibliothèque pour le moment.
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Ajoutez une photo via le formulaire ci-dessus ou importez l’une des images
                      déjà affichées sur vos pages ci-dessous.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {(mediaQuery.data ?? []).map((item) => {
                      const isEditing = editingMediaId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="space-y-3">
                            <MediaThumbnail src={item.url} alt={item.altText || item.label} />
                            {isEditing ? (
                              <div className="space-y-2.5">
                                <Input
                                  value={editMediaLabel}
                                  onChange={(e) => setEditMediaLabel(e.target.value)}
                                  placeholder="Nom"
                                  aria-label="Nom de l'image"
                                  className="min-h-[40px]"
                                />
                                <Input
                                  value={editMediaAlt}
                                  onChange={(e) => setEditMediaAlt(e.target.value)}
                                  placeholder="Texte alternatif"
                                  aria-label="Texte alternatif"
                                  className="min-h-[40px]"
                                />
                                <Input
                                  value={editMediaUrl}
                                  onChange={(e) => setEditMediaUrl(e.target.value)}
                                  placeholder="Nouvelle URL de l'image"
                                  aria-label="Nouvelle URL"
                                  className="min-h-[40px]"
                                />
                                <label className="flex items-center gap-2 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={editMediaReplaceInPages}
                                    onChange={(e) =>
                                      setEditMediaReplaceInPages(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                  Remplacer automatiquement dans toutes les pages
                                </label>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-slate-900">{item.label}</p>
                                <p className="mt-0.5 text-xs text-slate-600">{item.altText}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={updateMediaMutation.isPending}
                                  onClick={() =>
                                    updateMediaMutation.mutate({
                                      siteId,
                                      mediaId: item.id,
                                      label: editMediaLabel.trim() || item.label,
                                      altText: editMediaAlt.trim() || item.altText,
                                      newUrl: editMediaUrl.trim() || undefined,
                                      replaceInPages: editMediaReplaceInPages,
                                    })
                                  }
                                  className="min-h-[40px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"
                                >
                                  Enregistrer
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingMediaId(null)}
                                  className="min-h-[40px]"
                                >
                                  Annuler
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setDraftImage(item.url);
                                    setDraftImageAlt(item.altText || item.label);
                                    setTab("content");
                                    setFeedbackBanner({
                                      tone: "success",
                                      message: `Image « ${item.label} » sélectionnée pour la page active. Cliquez sur « Enregistrer la page » pour valider.`,
                                    });
                                  }}
                                  className="min-h-[40px] text-xs"
                                >
                                  Utiliser sur la page
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMediaId(item.id);
                                    setEditMediaLabel(item.label);
                                    setEditMediaAlt(item.altText);
                                    setEditMediaUrl(item.url);
                                    setEditMediaReplaceInPages(true);
                                  }}
                                  className="min-h-[40px] text-xs"
                                >
                                  Remplacer
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setInlineConfirm({
                                      title: `Retirer « ${item.label} » de la bibliothèque ?`,
                                      description:
                                        "L’image sera retirée de la liste des médias enregistrés.",
                                      confirmLabel: "Retirer l’image",
                                      tone: "danger",
                                      onConfirm: () =>
                                        deleteMediaMutation.mutate({ siteId, mediaId: item.id }),
                                    })
                                  }
                                  aria-label={`Supprimer ${item.label}`}
                                  className="min-h-[40px] text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Images actuellement présentes dans les pages du site */}
              {embeddedPageImages.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-bold text-slate-900">
                    Images actuellement affichées sur vos pages ({embeddedPageImages.length})
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Visualisez les visuels déjà utilisés sur votre site et modifiez-les facilement.
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {embeddedPageImages.map((img) => (
                      <div
                        key={img.src}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4"
                      >
                        <div className="space-y-2.5">
                          <MediaThumbnail src={img.src} alt={img.alt} />
                          <div>
                            <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                              {img.alt}
                            </p>
                            <p className="text-xs text-slate-500">Page : {img.pageTitle}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPageId(img.pageId);
                              setDraftImage(img.src);
                              setTab("content");
                            }}
                            className="min-h-[40px] text-xs"
                          >
                            Modifier dans la page
                          </Button>
                          {mediaQuery.data && mediaQuery.data.length > 0 && (
                            <select
                              aria-label={`Remplacer ${img.alt} par un média de la bibliothèque`}
                              defaultValue=""
                              onChange={(e) => {
                                if (!e.target.value) return;
                                handleReplaceEmbeddedImage(img.src, e.target.value);
                                e.target.value = "";
                              }}
                              className="min-h-[40px] max-w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                            >
                              <option value="">Remplacer par…</option>
                              {mediaQuery.data.map((m) => (
                                <option key={m.id} value={m.url}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === "messages" && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a2f]">Mini-CRM du site</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Messages & formulaires</h2><p className="mt-2 text-sm text-slate-600">Les demandes reçues sont isolées de MAZIGOSHOP et limitées à ce site.</p></div><Button type="button" variant="outline" onClick={handleExportFormSubmissions} disabled={!formSubmissionsQuery.data?.length}><Copy className="mr-2 h-4 w-4" />Exporter CSV</Button></div>
              <div className="flex flex-wrap gap-2">{(["all", "new", "read", "archived"] as const).map((filter) => <Button key={filter} type="button" variant={messageFilter === filter ? "default" : "outline"} onClick={() => setMessageFilter(filter)} className={messageFilter === filter ? "bg-[#1e3a2f] text-white" : ""}>{filter === "all" ? "Tous" : filter === "new" ? "Nouveaux" : filter === "read" ? "Lus" : "Archivés"}</Button>)}</div>
              <div className="space-y-3">{formSubmissionsQuery.isLoading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chargement des demandes…</div> : (formSubmissionsQuery.data ?? []).filter((item) => messageFilter === "all" || item.status === messageFilter).length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><MailPlus className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">Aucune demande dans cette vue</p><p className="mt-1 text-sm text-slate-500">Les messages envoyés depuis les formulaires du site apparaîtront ici.</p></div> : (formSubmissionsQuery.data ?? []).filter((item) => messageFilter === "all" || item.status === messageFilter).map((item) => {
                const statusText =
                  item.status === "new"
                    ? "Nouveau"
                    : item.status === "archived"
                      ? "Archivé"
                      : "Lu";
                const statusColor =
                  item.status === "new"
                    ? "text-emerald-800"
                    : item.status === "archived"
                      ? "text-amber-800"
                      : "text-slate-600";
                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          <a className="underline" href={`mailto:${item.email}`}>{item.email}</a>
                          {item.phone ? ` · ${item.phone}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.message}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="tabular-nums">{item.formType} · {formatClientDateTime(item.createdAt)}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="min-h-[34px] border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <a
                            href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${currentProject.title} — Votre message`)}&body=${encodeURIComponent(`Bonjour ${item.name},\n\nNous faisons suite à votre message envoyé via le site ${currentProject.title} :\n\n> ${item.message}\n\n`)}`}
                          >
                            <Mail className="mr-1.5 h-3.5 w-3.5 text-[#1e3a2f]" />
                            Répondre par e-mail
                          </a>
                        </Button>
                        {item.status === "new" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateFormStatusMutation.isPending || markFormReadMutation.isPending}
                            onClick={() =>
                              updateFormStatusMutation.mutate({
                                siteId: siteId!,
                                submissionId: item.id,
                                status: "read",
                              })
                            }
                            className="min-h-[34px] border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Marquer comme lu
                          </Button>
                        )}
                        {item.status !== "archived" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateFormStatusMutation.isPending}
                            onClick={() =>
                              updateFormStatusMutation.mutate({
                                siteId: siteId!,
                                submissionId: item.id,
                                status: "archived",
                              })
                            }
                            className="min-h-[34px] border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Archive className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                            Archiver
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateFormStatusMutation.isPending}
                            onClick={() =>
                              updateFormStatusMutation.mutate({
                                siteId: siteId!,
                                submissionId: item.id,
                                status: "read",
                              })
                            }
                            className="min-h-[34px] border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                            Restaurer
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}</div>
            </section>
          )}

          {tab === "theme" && (
            <section className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1e3a2f]">Design system simplifié</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Charte graphique globale</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Modifiez les couleurs et les typographies une seule fois. Les blocs du site utilisent cette charte sans devoir être repris un par un.</p>
                <form onSubmit={handleSaveTheme} className="mt-6 grid gap-5 md:grid-cols-2">
                  {([['primaryColor','Couleur principale'],['accentColor','Couleur d’accent'],['backgroundColor','Couleur de fond']] as const).map(([key,label]) => (
                    <FullColorPicker key={key} label={label} value={draftTheme[key]} onChange={(next) => setDraftTheme((v) => ({ ...v, [key]: next }))} />
                  ))}
                  <label className="space-y-2 text-sm font-medium text-slate-800"><span>Police des titres</span><Input value={draftTheme.headingFont} onChange={(e) => setDraftTheme((v) => ({ ...v, headingFont: e.target.value }))} /></label>
                  <label className="space-y-2 text-sm font-medium text-slate-800"><span>Police des textes</span><Input value={draftTheme.bodyFont} onChange={(e) => setDraftTheme((v) => ({ ...v, bodyFont: e.target.value }))} /></label>
                  <div className="flex flex-wrap items-center gap-3 md:col-span-2"><Button type="submit" disabled={!canEdit || saveMutation.isPending} className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"><Save className="mr-2 h-4 w-4" />{saveMutation.isPending ? "Enregistrement…" : "Appliquer la charte au site"}</Button><span className="text-xs text-slate-500">Les éditeurs peuvent modifier le brouillon ; la publication reste soumise aux droits du site.</span></div>
                </form>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="font-bold text-slate-900">Aperçu de la hiérarchie</h3><div className="mt-4 rounded-xl p-6" style={{ backgroundColor: draftTheme.backgroundColor, color: draftTheme.primaryColor }}><h4 className="text-2xl font-bold" style={{ fontFamily: draftTheme.headingFont }}>Titre de votre site</h4><p className="mt-2" style={{ fontFamily: draftTheme.bodyFont }}>Un aperçu simple de l’apparence appliquée aux pages et aux modules.</p><span className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: draftTheme.accentColor }}>Bouton d’action</span></div></div>
            </section>
          )}

          {tab === "settings" && (
            <section className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-900">Paramètres & domaine</h2>
                <p className="mt-2 text-sm text-slate-600">Gérez les informations durables du site. Les réglages sont propres à ce site indépendant et ne modifient aucun domaine automatiquement.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Adresse actuelle</p>{currentProject.status === "published" ? <a className="mt-2 inline-flex items-center gap-2 break-all text-sm font-semibold text-[#1e3a2f] underline" href={`/sites/${currentProject.slug}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4 shrink-0" />/sites/{currentProject.slug}</a> : <p className="mt-2 text-sm text-slate-700">Le site sera accessible après publication.</p>}</div>
                  <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Identité du site</p><Button type="button" variant="outline" className="mt-2" onClick={() => setTab("overview")}>Modifier le titre dans l’accueil</Button></div>
                </div>
                <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
                  <div className="rounded-lg border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Identité visuelle</h3><label className="mt-4 block space-y-2 text-sm font-medium text-slate-800"><span>URL du favicon</span><Input type="url" placeholder="https://…/favicon.png" value={draftSettings.faviconUrl} onChange={(e) => setDraftSettings((v) => ({ ...v, faviconUrl: e.target.value }))} /></label></div>
                  <div className={`rounded-lg border p-5 ${draftSettings.maintenanceMode ? "border-amber-300 bg-amber-50/60" : "border-slate-200"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">Mode maintenance</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Masquez temporairement la vitrine publique pendant une mise à jour. Les personnes autorisées peuvent continuer à utiliser l’aperçu privé.</p>
                      </div>
                      <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                        <input type="checkbox" checked={draftSettings.maintenanceMode} onChange={(e) => setDraftSettings((v) => ({ ...v, maintenanceMode: e.target.checked }))} disabled={!canAdminister} className="h-4 w-4 rounded border-slate-300 text-[#1e3a2f] focus:ring-[#1e3a2f]" />
                        {draftSettings.maintenanceMode ? "Activé" : "Désactivé"}
                      </label>
                    </div>
                    <label className="mt-4 block space-y-2 text-sm font-medium text-slate-800"><span>Message affiché aux visiteurs</span><Textarea rows={3} maxLength={240} value={draftSettings.maintenanceMessage} onChange={(e) => setDraftSettings((v) => ({ ...v, maintenanceMessage: e.target.value }))} disabled={!canAdminister} className="bg-white" /></label>
                    {draftSettings.maintenanceMode && <p className="mt-3 flex items-start gap-2 text-xs font-medium text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Le site public affichera ce message après l’enregistrement. L’aperçu privé restera accessible aux personnes autorisées.</p>}
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Réseaux sociaux</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{([['facebook','Facebook'],['instagram','Instagram'],['linkedin','LinkedIn'],['youtube','YouTube']] as const).map(([key,label]) => <label key={key} className="space-y-2 text-sm font-medium text-slate-800"><span>{label}</span><Input type="url" placeholder="https://…" value={draftSettings.socialLinks[key]} onChange={(e) => setDraftSettings((v) => ({ ...v, socialLinks: { ...v.socialLinks, [key]: e.target.value } }))} /></label>)}</div></div>
                  <div className="rounded-lg border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Informations légales</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-800"><span>Nom de l’organisation</span><Input value={draftSettings.legal.organizationName} onChange={(e) => setDraftSettings((v) => ({ ...v, legal: { ...v.legal, organizationName: e.target.value } }))} /></label><label className="space-y-2 text-sm font-medium text-slate-800"><span>E-mail de contact</span><Input type="email" value={draftSettings.legal.contactEmail} onChange={(e) => setDraftSettings((v) => ({ ...v, legal: { ...v.legal, contactEmail: e.target.value } }))} /></label><label className="space-y-2 text-sm font-medium text-slate-800"><span>Pays</span><Input placeholder="Suisse" value={draftSettings.legal.country} onChange={(e) => setDraftSettings((v) => ({ ...v, legal: { ...v.legal, country: e.target.value } }))} /></label><label className="space-y-2 text-sm font-medium text-slate-800"><span>URL des mentions légales</span><Input type="url" placeholder="https://…" value={draftSettings.legal.legalNoticeUrl} onChange={(e) => setDraftSettings((v) => ({ ...v, legal: { ...v.legal, legalNoticeUrl: e.target.value } }))} /></label><label className="space-y-2 text-sm font-medium text-slate-800 sm:col-span-2"><span>URL de la politique de confidentialité</span><Input type="url" placeholder="https://…" value={draftSettings.legal.privacyUrl} onChange={(e) => setDraftSettings((v) => ({ ...v, legal: { ...v.legal, privacyUrl: e.target.value } }))} /></label></div></div>
                  <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={!canAdminister || saveMutation.isPending} className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"><Save className="mr-2 h-4 w-4" />{saveMutation.isPending ? "Enregistrement…" : "Enregistrer les paramètres"}</Button><span className="text-xs text-slate-500">Les réglages sont enregistrés uniquement pour ce site.</span></div>
                </form>
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">Domaines personnalisés</p><p className="mt-1 text-sm text-slate-600">Aucun domaine personnalisé n’est encore connecté à ce site.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Non configuré</span></div><p className="mt-3 text-xs leading-relaxed text-slate-500">La connexion .ch ou .com nécessitera une configuration DNS chez votre registrar. Aucun DNS n’est exécuté depuis cet espace.</p></div>
            </section>
          )}
          {tab === "stats" && (() => {
            const dailyViews = analyticsQuery.data?.dailyViews ?? [];
            const maxDailyViews = Math.max(1, ...dailyViews.map((entry) => entry.views));
            return (
              <section className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="mt-1 h-5 w-5 text-[#1e3a2f]" />
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Statistiques de fréquentation</h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          Mesure privée et anonymisée limitée à ce site : aucune adresse IP, aucun compte visiteur et aucun cookie publicitaire.
                        </p>
                        {analyticsQuery.data?.lastRecordedAt && (
                          <p className="mt-1.5 text-xs tabular-nums text-slate-500">
                            Dernière visite enregistrée : {formatClientDateTime(analyticsQuery.data.lastRecordedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={analyticsQuery.isFetching}
                      onClick={() => analyticsQuery.refetch()}
                      className="min-h-[40px] border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                    >
                      <RotateCw className={`mr-1.5 h-3.5 w-3.5 ${analyticsQuery.isFetching ? "animate-spin text-[#1e3a2f]" : "text-slate-500"}`} />
                      {analyticsQuery.isFetching ? "Actualisation…" : "Actualiser les données"}
                    </Button>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <p className="font-medium text-slate-600">Visiteurs uniques</p>
                        <span className="font-semibold text-emerald-800">30 jours</span>
                      </div>
                      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                        {analyticsQuery.isLoading ? "…" : analyticsQuery.data?.visitors ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Visiteurs distincts ayant consulté votre site</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <p className="font-medium text-slate-600">Pages vues</p>
                        <span className="font-semibold text-slate-700">Cumul</span>
                      </div>
                      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                        {analyticsQuery.isLoading ? "…" : analyticsQuery.data?.pageViews ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Nombre total d’affichages de pages</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <p className="font-medium text-slate-600">Formulaires reçus</p>
                        <span className="font-semibold text-[#1e3a2f]">Messages</span>
                      </div>
                      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                        {analyticsQuery.isLoading ? "…" : analyticsQuery.data?.formsReceived ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Demandes soumises via vos formulaires</p>
                    </div>
                  </div>
                </div>

                {/* Évolution sur 7 jours glissants */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">Tendance des 7 derniers jours</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Pages vues par jour (UTC, anonymisées)</p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-slate-600">
                      Total 7 jours : {dailyViews.reduce((acc, entry) => acc + entry.views, 0)} vue(s)
                    </span>
                  </div>
                  {dailyViews.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">Aucune donnée journalière disponible pour le moment.</p>
                  ) : (
                    <div className="mt-5 grid grid-cols-7 items-end gap-2 sm:gap-3" role="list" aria-label="Pages vues des 7 derniers jours">
                      {dailyViews.map((entry) => {
                        const heightPct = entry.views > 0 ? Math.max(14, Math.round((entry.views / maxDailyViews) * 100)) : 4;
                        return (
                          <div key={entry.date} role="listitem" className="flex flex-col items-center gap-1.5">
                            <span className="text-xs font-semibold tabular-nums text-slate-700">
                              {entry.views}
                            </span>
                            <div className="flex h-28 w-full items-end rounded-lg bg-slate-100 p-1">
                              <div
                                className={`w-full rounded-md transition-all ${
                                  entry.views > 0 ? "bg-[#1e3a2f]" : "bg-slate-200"
                                }`}
                                style={{ height: `${heightPct}%` }}
                                title={`${entry.date} : ${entry.views} vue(s)`}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-600">{entry.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <h3 className="font-bold text-slate-900">Pages les plus consultées</h3>
                  {!analyticsQuery.data?.popularPages.length ? (
                    <p className="mt-3 text-sm text-slate-500">Aucune visite enregistrée pour le moment. Les premières consultations apparaîtront ici.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {analyticsQuery.data.popularPages.map((page) => (
                        <li key={page.path} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-slate-50 px-3.5 py-2.5 text-sm">
                          <span className="font-mono text-xs text-slate-700">{page.path}</span>
                          <strong className="text-xs font-bold tabular-nums text-slate-900">
                            {page.views} {page.views > 1 ? "vues" : "vue"}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ONGLET 4 : HISTORIQUE & VERSIONS */}
          {tab === "versions" && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-bold text-slate-900">
                Historique et versions sauvegardées
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Enregistrez des points de repère nommés avant une grande mise à jour et revenez à
                une version antérieure en cas de besoin.
              </p>

              {!canAdminister ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Consultation réservée aux Administrateurs et au Propriétaire
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-600">
                    Votre rôle actuel (<strong>Éditeur</strong>) vous permet de modifier et
                    sauvegarder les pages en brouillon. La gestion de l’historique et la
                    restauration d’anciennes versions sont réservées aux rôles Administrateur et
                    Propriétaire afin d’éviter tout retour arrière involontaire.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!siteId) return;
                      createVersionMutation.mutate({
                        siteId,
                        label: versionLabelInput.trim() || "Sauvegarde manuelle",
                      });
                    }}
                    className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="min-w-[220px] flex-1 space-y-1.5">
                      <Label htmlFor="version-label">Nom du point de sauvegarde</Label>
                      <Input
                        id="version-label"
                        value={versionLabelInput}
                        onChange={(e) => setVersionLabelInput(e.target.value)}
                        placeholder="Ex. Avant assemblée générale de juin"
                        maxLength={150}
                        className="min-h-[44px] bg-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={createVersionMutation.isPending}
                      className="min-h-[44px] bg-[#1e3a2f] px-4 text-sm font-medium text-white hover:bg-[#162b23]"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {createVersionMutation.isPending
                        ? "Création…"
                        : "Créer une sauvegarde"}
                    </Button>
                  </form>

                  {versionsQuery.isLoading ? (
                    <p className="text-sm text-slate-500">Chargement de l’historique…</p>
                  ) : (versionsQuery.data?.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="text-sm font-semibold text-slate-900">
                        Aucune version archivée pour le moment.
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Chaque sauvegarde majeure et chaque point de repère créé ci-dessus
                        apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                      {(versionsQuery.data ?? []).map((version) => (
                        <div
                          key={version.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              <span className="tabular-nums text-[#1e3a2f]">
                                Version #{version.versionNumber}
                              </span>{" "}
                              — {version.label}
                            </p>
                            <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                              Enregistrée le {formatClientDateTime(version.createdAt)} ·{" "}
                              {version.snapshot.pages.length} page(s)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={restoreVersionMutation.isPending}
                            onClick={() =>
                              setInlineConfirm({
                                title: `Restaurer la version #${version.versionNumber} ?`,
                                description: `Les pages du site reviendront à l’état « ${version.label} ». L’état actuel restera conservé dans l’historique.`,
                                confirmLabel: "Restaurer cette version",
                                tone: "primary",
                                onConfirm: () =>
                                  restoreVersionMutation.mutate({
                                    siteId,
                                    versionId: version.id,
                                  }),
                              })
                            }
                            className="min-h-[40px] whitespace-nowrap text-xs"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Restaurer
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ONGLET 5 : ÉQUIPE, RÔLES & INVITATIONS */}
          {tab === "team" && (
            <div className="space-y-6">
              {/* Matrice claire des 3 rôles existants */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Les 3 rôles d’accès à ce site
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Votre rôle actuel sur <strong>{currentProject.title}</strong> est{" "}
                      <strong className="text-[#1e3a2f]">{roleInfo.shortLabel}</strong> (
                      <code className="font-mono text-xs">{role}</code>). Aucun rôle client ne
                      donne accès au constructeur visuel global.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                  {CLIENT_ADMIN_ROLE_MATRIX.map((item) => {
                    const isCurrent = item.role === role;
                    return (
                      <div
                        key={item.role}
                        className={`flex flex-col justify-between rounded-xl border p-5 ${
                          isCurrent
                            ? "border-[#1e3a2f] bg-[#f4f7f5]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="space-y-4">
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                {item.label}{" "}
                                <span className="font-mono text-xs font-normal text-slate-500">
                                  ({item.codeLabel})
                                </span>
                              </h3>
                              {isCurrent && (
                                <span className="text-xs font-semibold text-[#1e3a2f]">
                                  Votre rôle actuel
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-600">{item.audience}</p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-700">
                              {item.summary}
                            </p>
                          </div>

                          <div className="space-y-1.5 border-t border-slate-200/80 pt-3">
                            <p className="text-xs font-semibold text-slate-900">
                              Peut consulter
                            </p>
                            <ul className="space-y-1 text-xs leading-relaxed text-slate-600">
                              {item.canView.map((line) => (
                                <li key={line}>• {line}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5 border-t border-slate-200/80 pt-3">
                            <p className="text-xs font-semibold text-emerald-900">
                              Peut modifier
                            </p>
                            <ul className="space-y-1 text-xs leading-relaxed text-slate-700">
                              {item.canEdit.map((line) => (
                                <li key={line}>• {line}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5 border-t border-slate-200/80 pt-3">
                            <p className="text-xs font-semibold text-slate-800">
                              Ne peut pas faire
                            </p>
                            <ul className="space-y-1 text-xs leading-relaxed text-slate-600">
                              {item.cannotDo.map((line) => (
                                <li key={line}>• {line}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <p className="mt-4 border-t border-slate-200/80 pt-3 text-xs font-medium text-slate-700">
                          {item.builderAccessNote}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Gestion des membres et invitations (Propriétaire uniquement) */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-bold text-slate-900">
                  Membres et invitations du site
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Les droits d’accès sont vérifiés côté serveur et limités exclusivement au site
                  « {currentProject.title} ».
                </p>

                {!canManageTeam ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    L’envoi d’invitations, la modification des rôles et la révocation d’un accès
                    sont réservés au <strong>Propriétaire</strong> du site. Contactez le
                    propriétaire si un nouveau membre de votre équipe doit obtenir un accès.
                  </div>
                ) : (
                  <div className="mt-5 space-y-6">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!siteId || !directAccessEmail.trim() || !directAccessName.trim() || !directAccessPassword) return;
                        createAccessMutation.mutate({
                          siteId,
                          email: directAccessEmail.trim(),
                          name: directAccessName.trim(),
                          password: directAccessPassword,
                          role: directAccessRole,
                        });
                      }}
                      className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Créer directement un accès de test</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">
                          Option réservée au Propriétaire : aucun e-mail n’est envoyé. L’identité créée reste indépendante du compte global MAZIGHO et limitée à ce site.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5"><Label htmlFor="direct-access-name">Nom</Label><Input id="direct-access-name" required value={directAccessName} onChange={(e) => setDirectAccessName(e.target.value)} className="min-h-[44px] bg-white" /></div>
                        <div className="space-y-1.5"><Label htmlFor="direct-access-email">Adresse e-mail</Label><Input id="direct-access-email" type="email" required value={directAccessEmail} onChange={(e) => setDirectAccessEmail(e.target.value)} placeholder="responsable@association.org" className="min-h-[44px] bg-white" /></div>
                        <div className="space-y-1.5"><Label htmlFor="direct-access-password">Mot de passe provisoire</Label><Input id="direct-access-password" type="password" minLength={8} required value={directAccessPassword} onChange={(e) => setDirectAccessPassword(e.target.value)} className="min-h-[44px] bg-white" /></div>
                        <div className="space-y-1.5"><Label htmlFor="direct-access-role">Rôle</Label><select id="direct-access-role" value={directAccessRole} onChange={(e) => setDirectAccessRole(e.target.value as "admin" | "editor")} className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="editor">Éditeur</option><option value="admin">Administrateur</option></select></div>
                      </div>
                      <Button type="submit" disabled={createAccessMutation.isPending} className="min-h-[44px] bg-[#1e3a2f] text-white hover:bg-[#162b23]"><Lock className="mr-2 h-4 w-4" />{createAccessMutation.isPending ? "Création de l’accès…" : "Créer l’accès immédiatement"}</Button>
                    </form>

                    {/* Formulaire d'invitation client avec explications avant envoi */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!siteId || !inviteEmail.trim()) return;
                        inviteAccessMutation.mutate({
                          siteId,
                          email: inviteEmail.trim(),
                          role: inviteRole,
                          expiresInHours: inviteExpiresHours,
                        });
                      }}
                      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Inviter un membre à administrer ce site
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          La personne invitée recevra un lien personnel à usage unique pour
                          accéder directement à l’administration de{" "}
                          <strong>{currentProject.title}</strong>, sans voir d’autres projets ni
                          le constructeur visuel global.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="invite-email">Adresse e-mail de la personne</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="responsable@association.org"
                            className="min-h-[44px] bg-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="invite-role">Rôle attribué</Label>
                          <select
                            id="invite-role"
                            value={inviteRole}
                            onChange={(e) =>
                              setInviteRole(e.target.value as "admin" | "editor")
                            }
                            className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                          >
                            <option value="editor">Éditeur (contenus et brouillons)</option>
                            <option value="admin">
                              Administrateur (contenus, versions et publication)
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="invite-expiry">Validité du lien</Label>
                          <select
                            id="invite-expiry"
                            value={inviteExpiresHours}
                            onChange={(e) => setInviteExpiresHours(Number(e.target.value))}
                            className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                          >
                            <option value={24}>24 heures</option>
                            <option value={72}>3 jours (recommandé)</option>
                            <option value={168}>7 jours</option>
                          </select>
                        </div>
                      </div>

                      {/* Aperçu du rôle sélectionné avant l'envoi */}
                      <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">
                          Résumé avant envoi — {selectedInviteRoleDetail.label} (
                          {selectedInviteRoleDetail.codeLabel})
                        </p>
                        <p className="mt-1 text-slate-600">{selectedInviteRoleDetail.summary}</p>
                        <p className="mt-1.5 font-medium text-slate-700">
                          {selectedInviteRoleDetail.builderAccessNote}
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={!inviteEmail.trim() || inviteAccessMutation.isPending}
                        className="min-h-[44px] bg-[#1e3a2f] px-5 text-sm font-medium text-white hover:bg-[#162b23]"
                      >
                        <MailPlus className="mr-2 h-4 w-4" />
                        {inviteAccessMutation.isPending
                          ? "Création de l’invitation…"
                          : "Créer le lien d’invitation"}
                      </Button>
                    </form>

                    {/* Lien d'activation fraîchement créé */}
                    {lastInvitation && (
                      <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold">
                            Invitation prête pour {lastInvitation.email} (
                            {lastInvitation.role === "admin" ? "Administrateur" : "Éditeur"})
                          </p>
                          <span className="text-xs tabular-nums text-emerald-900">
                            Valide jusqu’au {formatClientDateTime(lastInvitation.expiresAt)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">
                          {lastInvitation.delivery === "delivered"
                            ? "Un e-mail d’invitation a été envoyé. Vous pouvez également copier le lien ci-dessous pour le transmettre directement."
                            : "Transmettez ce lien personnel à la personne invitée. Elle devra se connecter avec cette adresse e-mail exacte pour activer son accès."}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="min-w-0 flex-1 break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-800">
                            {lastInvitation.invitationUrl}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCopyInviteLink(lastInvitation.invitationUrl)}
                            className="min-h-[40px] whitespace-nowrap border-emerald-300 bg-white text-xs text-emerald-950 hover:bg-emerald-100"
                          >
                            {copiedInviteUrl ? (
                              <>
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                Copier le lien
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Liste des membres et invitations */}
                    {accessQuery.isLoading ? (
                      <p className="text-sm text-slate-500">Chargement de l’équipe…</p>
                    ) : (accessQuery.data?.length ?? 0) === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
                        Aucun membre supplémentaire n’a encore été invité sur ce site.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                        {(accessQuery.data ?? []).map((member) => {
                          const memberStatus = formatClientMemberStatus(member);
                          const isOwnerRow = member.role === "owner";
                          return (
                            <div
                              key={member.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                            >
                              <div className="min-w-0">
                                <p className="break-all text-sm font-semibold text-slate-900">
                                  {member.email}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
                                  <span>
                                    {getIndependentSiteRolePresentation(member.role).shortLabel} (
                                    <code className="font-mono">{member.role}</code>)
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      memberStatus.tone === "emerald"
                                        ? "font-semibold text-emerald-800"
                                        : memberStatus.tone === "amber"
                                          ? "font-semibold text-amber-800"
                                          : memberStatus.tone === "rose"
                                            ? "font-semibold text-rose-800"
                                            : "text-slate-600"
                                    }
                                  >
                                    {memberStatus.label}
                                  </span>
                                </div>
                              </div>

                              {!isOwnerRow && member.status !== "blocked" && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    aria-label={`Rôle de ${member.email}`}
                                    value={member.role === "admin" ? "admin" : "editor"}
                                    disabled={updateAccessRoleMutation.isPending}
                                    onChange={(e) =>
                                      updateAccessRoleMutation.mutate({
                                        siteId,
                                        memberId: member.id,
                                        role: e.target.value as "admin" | "editor",
                                      })
                                    }
                                    className="min-h-[40px] rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800"
                                  >
                                    <option value="editor">Éditeur</option>
                                    <option value="admin">Administrateur</option>
                                  </select>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={revokeAccessMutation.isPending}
                                    onClick={() =>
                                      setInlineConfirm({
                                        title: `Révoquer l’accès de ${member.email} ?`,
                                        description:
                                          "Cette personne ne pourra plus consulter ni modifier ce site, et son lien d’invitation deviendra inutilisable.",
                                        confirmLabel: "Révoquer l’accès",
                                        tone: "danger",
                                        onConfirm: () =>
                                          revokeAccessMutation.mutate({
                                            siteId,
                                            memberId: member.id,
                                          }),
                                      })
                                    }
                                    className="min-h-[40px] whitespace-nowrap border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                                  >
                                    Révoquer
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
              {canManageTeam && (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div>
                      <h2 className="text-base font-bold text-amber-950">Transfert de propriété du site</h2>
                      <p className="mt-1 text-sm leading-relaxed text-amber-900">
                        Opération sensible : le nouveau propriétaire recevra les droits complets sur ce site. Votre accès sera conservé comme administrateur. Cette action ne concerne que ce site.
                      </p>
                    </div>
                  </div>
                  <form
                    className="mt-5 grid gap-4 md:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!siteId || !transferTargetEmail.trim() || !project) return;
                      if (transferConfirmationTitle.trim() !== project.title.trim()) {
                        toast.error("Saisissez le nom exact du site pour confirmer.");
                        return;
                      }
                      setInlineConfirm({
                        title: `Transférer « ${project.title} » ?`,
                        description: `Le compte ${transferTargetEmail.trim()} deviendra propriétaire de ce site. Votre accès restera administrateur.`,
                        confirmLabel: "Confirmer le transfert",
                        tone: "danger",
                        onConfirm: () => transferOwnershipMutation.mutate({
                          siteId,
                          targetEmail: transferTargetEmail.trim(),
                          confirmationSiteTitle: transferConfirmationTitle.trim(),
                        }),
                      });
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="transfer-target-email">E-mail du nouveau propriétaire</Label>
                      <Input
                        id="transfer-target-email"
                        type="email"
                        required
                        value={transferTargetEmail}
                        onChange={(event) => setTransferTargetEmail(event.target.value)}
                        placeholder="responsable@association.org"
                        className="min-h-[44px] border-amber-300 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="transfer-confirmation-title">
                        Saisir exactement : <strong>{project.title}</strong>
                      </Label>
                      <Input
                        id="transfer-confirmation-title"
                        required
                        value={transferConfirmationTitle}
                        onChange={(event) => setTransferConfirmationTitle(event.target.value)}
                        placeholder={project.title}
                        className="min-h-[44px] border-amber-300 bg-white"
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-amber-950">
                      <span>Site concerné : <strong>{project.title}</strong> · aucun autre site ni aucune boutique ne sera modifié.</span>
                      <Button
                        type="submit"
                        disabled={transferOwnershipMutation.isPending || !transferTargetEmail.trim() || transferConfirmationTitle.trim() !== project.title.trim()}
                        className="min-h-[42px] bg-amber-700 text-white hover:bg-amber-800"
                      >
                        {transferOwnershipMutation.isPending ? "Transfert en cours…" : "Préparer le transfert"}
                      </Button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* PIED DE PAGE SOBRE — ZÉRO LIEN BOUTIQUE OU CONSTRUCTEUR PRIVÉ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-600 sm:px-6 lg:px-8">
          <span>
            Administration dédiée de <strong className="text-slate-900">{currentProject.title}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
            >
              Aperçu avant publication
            </button>
            <Link
              href={`/sites/${currentProject.slug}`}
              className="font-medium text-[#1e3a2f] hover:underline"
            >
              Ouvrir la vitrine publique
            </Link>
          </div>
        </div>
      </footer>

      {/* MODALE D'APERÇU INTÉGRÉ AVANT PUBLICATION (SANS QUITTER L'ADMINISTRATION CLIENT) */}
      {previewOpen && activePage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu avant publication"
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/75 p-2 sm:p-5"
        >
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Aperçu — {draftPageTitle || activePage.title} ({currentProject.title})
                </p>
                <p className="text-xs text-slate-300">
                  {hasAnyUnsavedChanges
                    ? "Inclut vos modifications en cours avant enregistrement."
                    : "Rendu fidèle de la dernière version sauvegardée."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Taille d’écran de l’aperçu"
                  className="flex items-center gap-1 rounded-lg bg-slate-800 p-1"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    aria-pressed={previewViewport === "desktop"}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium ${
                      previewViewport === "desktop"
                        ? "bg-white text-slate-900"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    Ordinateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("tablet")}
                    aria-pressed={previewViewport === "tablet"}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium ${
                      previewViewport === "tablet"
                        ? "bg-white text-slate-900"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    <Tablet className="h-3.5 w-3.5" />
                    Tablette
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    aria-pressed={previewViewport === "mobile"}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium ${
                      previewViewport === "mobile"
                        ? "bg-white text-slate-900"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(false)}
                  className="min-h-[40px] border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Fermer l’aperçu
                </Button>
              </div>
            </div>

            <div className="flex flex-1 justify-center overflow-auto bg-slate-950 p-3 sm:p-5">
              <iframe
                title={`Aperçu de ${draftPageTitle || activePage.title}`}
                srcDoc={previewSrcDoc}
                sandbox="allow-same-origin"
                style={{
                  width:
                    previewViewport === "mobile"
                      ? "375px"
                      : previewViewport === "tablet"
                        ? "768px"
                        : "100%",
                  maxWidth: "1280px",
                }}
                className="h-full min-h-[520px] rounded-lg border border-slate-700 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* GUIDE ILLUSTRÉ & VIDÉO DÉDIÉS AU CLIENT (JAMAIS LE GUIDE DU CONSTRUCTEUR) */}
      <SiteTrainingModal
        open={trainingModalOpen}
        mode={trainingModalMode}
        onModeChange={setTrainingModalMode}
        onClose={() => setTrainingModalOpen(false)}
        config={CLIENT_GUIDE_CONFIG}
        activeSiteName={currentProject.title}
      />
    </div>
  );
}
