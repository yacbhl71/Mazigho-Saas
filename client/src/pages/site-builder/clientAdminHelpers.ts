import {
  INDEPENDENT_RESPONSIVE_BASE_CSS,
  sanitizeIndependentCss,
  sanitizeIndependentHtml,
  type IndependentSiteClientRole,
  type IndependentSiteStatus,
} from "@shared/isolatedSiteBuilder";

export interface ClientAdminRoleDetail {
  role: IndependentSiteClientRole;
  label: string;
  codeLabel: "owner" | "admin" | "editor";
  audience: string;
  summary: string;
  canView: string[];
  canEdit: string[];
  cannotDo: string[];
  builderAccessNote: string;
}

export const CLIENT_ADMIN_ROLE_MATRIX: readonly ClientAdminRoleDetail[] = [
  {
    role: "owner",
    label: "Propriétaire",
    codeLabel: "owner",
    audience: "Responsable principal du site",
    summary:
      "Dispose de la gestion complète de ce site, y compris l’équipe et les invitations.",
    canView: [
      "Le tableau de bord, toutes les pages et les aperçus avant mise en ligne",
      "La bibliothèque d’images et de médias du site",
      "L’historique complet des versions enregistrées",
      "La liste des membres, leurs rôles et le statut des invitations",
    ],
    canEdit: [
      "Le titre du site, les pages, textes, actualités et images",
      "La mise en ligne (publier ou repasser en brouillon)",
      "Les points de sauvegarde et la restauration d’une version antérieure",
      "L’envoi d’invitations, le changement de rôle et la révocation d’un accès",
    ],
    cannotDo: [
      "Accéder au constructeur visuel global ou créer de nouveaux sites depuis cet espace",
      "Voir d’autres sites ou accéder à un espace boutique externe",
      "Céder la propriété en un clic (le transfert de propriété suit une validation dédiée)",
    ],
    builderAccessNote:
      "Aucun rôle client, y compris Propriétaire, ne donne accès au constructeur visuel global.",
  },
  {
    role: "admin",
    label: "Administrateur",
    codeLabel: "admin",
    audience: "Président d’association, gérant ou responsable éditorial",
    summary:
      "Pilote le contenu, les médias, l’historique et la publication du site au quotidien.",
    canView: [
      "Le tableau de bord, toutes les pages et les aperçus avant publication",
      "La bibliothèque d’images et de médias du site",
      "L’historique complet des versions sauvegardées",
    ],
    canEdit: [
      "Le titre du site, les textes, actualités, pages et référencement (SEO)",
      "Les images du site et la bibliothèque de médias",
      "La mise en ligne du site (publier ou repasser en brouillon)",
      "La création et la restauration de versions sauvegardées",
    ],
    cannotDo: [
      "Inviter de nouveaux membres, changer un rôle ou révoquer un accès",
      "Modifier la configuration des noms de domaine ou réglages techniques",
      "Accéder au constructeur visuel global ou à d’autres projets",
    ],
    builderAccessNote:
      "Le rôle Administrateur reste strictement limité à ce site, sans accès au constructeur global.",
  },
  {
    role: "editor",
    label: "Éditeur",
    codeLabel: "editor",
    audience: "Bénévole, secrétaire ou rédacteur chargé des mises à jour",
    summary:
      "Met à jour les textes, actualités et images en toute sérénité, sans risque de dépublier le site.",
    canView: [
      "Le tableau de bord et toutes les pages du site",
      "L’aperçu avant publication de ses modifications",
      "La bibliothèque d’images et de médias du site",
    ],
    canEdit: [
      "Le titre du site, les titres de pages, les textes et les actualités",
      "Les images des pages et les éléments de la bibliothèque média",
      "L’enregistrement en brouillon et les informations SEO des pages",
    ],
    cannotDo: [
      "Publier ou dépublier le site en ligne (validation par un Administrateur ou Propriétaire)",
      "Consulter ou restaurer l’historique des versions sauvegardées",
      "Voir ou gérer les membres et les invitations du site",
      "Accéder au constructeur visuel global ou à d’autres projets",
    ],
    builderAccessNote:
      "Le rôle Éditeur permet uniquement de mettre à jour ce site, sans accès au constructeur global.",
  },
] as const;

export const CLIENT_ADMIN_SPACE_DISTINCTIONS = [
  {
    id: "administer",
    title: "Administrer votre site",
    description:
      "Vous êtes ici. Cet espace centralise le statut en ligne de votre site, ses sauvegardes, son aperçu avant publication, ses versions et les membres autorisés.",
  },
  {
    id: "edit",
    title: "Modifier son contenu",
    description:
      "Depuis les onglets « Pages & contenus » et « Images & médias », vous actualisez vos textes, titres, actualités et photos à l’aide de formulaires simples, sans risque de casser la mise en page.",
  },
  {
    id: "build",
    title: "Construire un nouveau site",
    description:
      "La création technique de la structure et l’atelier visuel global restent privés et ne sont accessibles par aucun rôle client. Pour une nouvelle structure ou un autre site, contactez votre référent.",
  },
] as const;

export const CLIENT_ADMIN_FIRST_LOGIN_STEPS = [
  {
    step: "1",
    title: "Ouvrir votre lien personnel",
    detail:
      "Chaque invitation est nominative, limitée dans le temps et utilisable une seule fois.",
  },
  {
    step: "2",
    title: "Se connecter avec l’e-mail invité",
    detail:
      "Connectez-vous ou créez votre mot de passe avec l’adresse e-mail exacte indiquée sur l’invitation.",
  },
  {
    step: "3",
    title: "Accéder directement à votre site",
    detail:
      "Dès l’activation, vous arrivez directement dans l’administration de votre site, selon votre rôle.",
  },
] as const;

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function readFirstHtmlTag(html: string, tag: string): string {
  const safeHtml = html || "";
  const match = safeHtml.match(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  if (!match?.[1]) return "";
  return decodeBasicHtmlEntities(
    match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

export function readFirstHtmlImage(html: string): string {
  const safeHtml = html || "";
  const match = safeHtml.match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
  return (match?.[1] ?? match?.[2] ?? "").trim();
}

export function replaceFirstHtmlTag(
  html: string,
  tag: string,
  value: string,
): string {
  const safeHtml = html || "";
  const escaped = escapeHtmlText(value.trim());
  const pattern = new RegExp(`(<${tag}\\b[^>]*>)[\\s\\S]*?(<\\/${tag}>)`, "i");
  if (pattern.test(safeHtml)) {
    return safeHtml.replace(pattern, `$1${escaped}$2`);
  }
  return safeHtml;
}

export function replaceFirstHtmlImage(
  html: string,
  src: string,
  alt?: string,
): string {
  const safeHtml = html || "";
  const cleanSrc = src.trim().replace(/"/g, "&quot;");
  if (!cleanSrc) return safeHtml;
  const imgSrcPattern = /(<img\b[^>]*\bsrc\s*=\s*)(["'])([^"']*)(\2)/i;
  if (!imgSrcPattern.test(safeHtml)) return safeHtml;
  let updated = safeHtml.replace(imgSrcPattern, `$1$2${cleanSrc}$4`);
  if (alt && alt.trim()) {
    const cleanAlt = escapeHtmlText(alt.trim());
    const firstImgMatch = updated.match(/<img\b[^>]*>/i);
    if (firstImgMatch) {
      const imgTag = firstImgMatch[0];
      const nextImgTag = /\balt\s*=\s*(?:"[^"]*"|'[^']*')/i.test(imgTag)
        ? imgTag.replace(/\balt\s*=\s*(["'])[^"']*\1/i, `alt="${cleanAlt}"`)
        : imgTag.replace(/<img\b/i, `<img alt="${cleanAlt}"`);
      updated = updated.replace(imgTag, nextImgTag);
    }
  }
  return updated;
}

export function appendClientSectionHtml(
  html: string,
  input: {
    title: string;
    body: string;
    kind: "section" | "actualite";
    dateLabel?: string;
  },
): string {
  const safeTitle = escapeHtmlText(input.title.trim());
  const safeBody = escapeHtmlText(input.body.trim()).replace(/\n/g, "<br />");
  const safeDate = input.dateLabel ? escapeHtmlText(input.dateLabel.trim()) : "";
  const kicker =
    input.kind === "actualite"
      ? `<p style="margin:0 0 8px;color:#40552d;font-size:13px;font-weight:600">${safeDate || "Actualité"}</p>`
      : "";
  const section = `<section data-site-block="${input.kind === "actualite" ? "client-news" : "client-section"}" style="padding:40px 24px;background:#f8fafc;border-top:1px solid #e2e8f0"><div style="max-width:920px;margin:0 auto">${kicker}<h2 style="margin:0 0 12px;color:#0f172a;font-size:clamp(22px,3vw,32px);line-height:1.25">${safeTitle}</h2><p style="margin:0;color:#334155;font-size:16px;line-height:1.7">${safeBody}</p></div></section>`;
  return `${html || ""}${section}`;
}

export function buildClientPreviewSrcDoc(input: {
  pageTitle: string;
  siteTitle: string;
  html: string;
  css: string;
  theme?: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    headingFont: string;
    bodyFont: string;
  };
}): string {
  const safeHtml = sanitizeIndependentHtml(input.html || "");
  const safeCss = sanitizeIndependentCss(input.css || "");
  const title = escapeHtmlText(`${input.pageTitle} — ${input.siteTitle}`);
  const theme = input.theme ?? {
    primaryColor: "#172033",
    accentColor: "#9b563e",
    backgroundColor: "#faf8f5",
    headingFont: "Georgia, serif",
    bodyFont: "Inter, system-ui, sans-serif",
  };
  const safeThemeColor = (value: string, fallback: string) =>
    /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : fallback;
  const safeThemeFont = (value: string, fallback: string) => {
    const sanitized = value.replace(/[^a-zA-Z0-9\s,'"_-]/g, "").trim().slice(0, 120);
    return sanitized || fallback;
  };
  const primaryColor = safeThemeColor(theme.primaryColor, "#172033");
  const accentColor = safeThemeColor(theme.accentColor, "#9b563e");
  const backgroundColor = safeThemeColor(theme.backgroundColor, "#faf8f5");
  const headingFont = safeThemeFont(theme.headingFont, "Georgia, serif");
  const bodyFont = safeThemeFont(theme.bodyFont, "Inter, system-ui, sans-serif");
  const themeCss = `
    :root {
      --site-primary: ${primaryColor};
      --site-accent: ${accentColor};
      --site-background: ${backgroundColor};
      --site-heading-font: ${headingFont};
      --site-body-font: ${bodyFont};
    }
    html, body { background: var(--site-background) !important; }
    [style*="background:#faf8f5"], [style*="background: #faf8f5"],
    [style*="background:#f7f4ef"], [style*="background: #f7f4ef"],
    [style*="background:#f3eee8"], [style*="background: #f3eee8"] {
      background: var(--site-background) !important;
    }
    [style*="color:#172033"], [style*="color: #172033"] { color: var(--site-primary) !important; }
    [style*="color:#9b563e"], [style*="color: #9b563e"], [style*="color:#f5b98f"], [style*="color: #f5b98f"] { color: var(--site-accent) !important; }
    [style*="background:#9b563e"], [style*="background: #9b563e"], [style*="background:#f5b98f"], [style*="background: #f5b98f"] { background: var(--site-accent) !important; }
    [style*="border:#9b563e"], [style*="border: #9b563e"], [style*="border-left:5px solid #9b563e"] { border-color: var(--site-accent) !important; }
    body { color: var(--site-primary) !important; font-family: var(--site-body-font); }
    h1, h2, h3, h4, h5, h6 { color: var(--site-primary) !important; font-family: var(--site-heading-font) !important; }
    a { color: var(--site-primary); }
    button, [role="button"] { background-color: var(--site-accent); }
  `;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    ${INDEPENDENT_RESPONSIVE_BASE_CSS}
    ${safeCss}
    ${themeCss}
  </style>
</head>
<body style="margin:0">
  ${safeHtml}
</body>
</html>`;
}

export function formatClientDateTime(iso?: string | null): string {
  if (!iso) return "Aucune sauvegarde enregistrée";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClientStatusSummary(
  status: IndependentSiteStatus,
  hasUnsavedChanges: boolean,
  lastSavedIso?: string | null,
): {
  statusLabel: "Brouillon" | "Publié" | "Archivé";
  saveStateLabel: string;
  statusDetail: string;
  tone: "emerald" | "amber" | "slate";
  lastSavedText: string;
} {
  const lastSavedText = formatClientDateTime(lastSavedIso);
  if (status === "published") {
    return {
      statusLabel: "Publié",
      saveStateLabel: hasUnsavedChanges
        ? "Modifications non enregistrées"
        : "Sauvegardé et en ligne",
      statusDetail: hasUnsavedChanges
        ? "Votre site est en ligne, mais vos dernières retouches dans le formulaire ne sont pas encore enregistrées."
        : "Votre site est visible par vos visiteurs sur son adresse publique.",
      tone: hasUnsavedChanges ? "amber" : "emerald",
      lastSavedText,
    };
  }
  if (status === "archived") {
    return {
      statusLabel: "Archivé",
      saveStateLabel: hasUnsavedChanges
        ? "Modifications non enregistrées"
        : "Sauvegardé (archivé)",
      statusDetail:
        "Ce site est archivé et n’est plus accessible publiquement.",
      tone: "slate",
      lastSavedText,
    };
  }
  return {
    statusLabel: "Brouillon",
    saveStateLabel: hasUnsavedChanges
      ? "Modifications non enregistrées"
      : "Sauvegardé en brouillon",
    statusDetail: hasUnsavedChanges
      ? "Pensez à cliquer sur « Enregistrer » pour conserver vos changements."
      : "Vos changements sont sauvegardés en privé. Publiez le site lorsqu’il est prêt pour vos visiteurs.",
    tone: "amber",
    lastSavedText,
  };
}

export function formatClientMemberStatus(member: {
  status: string;
  invitationExpiresAt?: string | null;
}): {
  label: string;
  tone: "emerald" | "amber" | "rose" | "slate";
} {
  if (member.status === "active") {
    return { label: "Accès actif", tone: "emerald" };
  }
  if (member.status === "blocked" || member.status === "revoked") {
    return { label: "Accès révoqué", tone: "rose" };
  }
  if (member.status === "invited") {
    if (member.invitationExpiresAt) {
      const expiresAt = new Date(member.invitationExpiresAt).getTime();
      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        return { label: "Invitation expirée", tone: "rose" };
      }
    }
    return { label: "Invitation en attente", tone: "amber" };
  }
  return { label: member.status || "Inconnu", tone: "slate" };
}
