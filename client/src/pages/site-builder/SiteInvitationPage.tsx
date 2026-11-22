import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Globe,
  Lock,
  LogOut,
  MailCheck,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  formatIndependentInvitationErrorMessage,
  formatIndependentInvitationStatusNotice,
  getIndependentSiteRolePresentation,
} from "@shared/isolatedSiteBuilder";
import {
  CLIENT_ADMIN_FIRST_LOGIN_STEPS,
  CLIENT_ADMIN_ROLE_MATRIX,
} from "./clientAdminHelpers";

export default function SiteInvitationPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/constructeur-sites/invitation/:token");
  const { user, loading, logout } = useAuth();
  const utils = trpc.useUtils();

  const token = (
    params?.token ??
    new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    ).get("token") ??
    ""
  ).trim();

  const [error, setError] = useState<string | null>(null);
  const [acceptedResult, setAcceptedResult] = useState<{
    siteId: number;
    siteTitle?: string;
    siteSlug?: string | null;
    role: "owner" | "admin" | "editor";
  } | null>(null);

  const inspectionQuery =
    trpc.independentSiteBuilder.inspectSiteInvitation.useQuery(
      { token },
      {
        enabled: Boolean(token),
        retry: false,
        refetchOnWindowFocus: false,
      },
    );

  const accept = trpc.independentSiteBuilder.acceptSiteInvitation.useMutation({
    onSuccess: async (result) => {
      setError(null);
      setAcceptedResult(result);
      await Promise.all([
        utils.independentSiteBuilder.listProjects.invalidate(),
        inspectionQuery.refetch(),
      ]);
    },
    onError: (err) => {
      setError(formatIndependentInvitationErrorMessage(err));
    },
  });

  // Ne jamais renvoyer un client vers le constructeur privé en l'absence de jeton
  const returnToPath = token
    ? `/constructeur-sites/invitation/${encodeURIComponent(token)}`
    : "/administration-site";

  const inspection = inspectionQuery.data ?? {
    status: "not_found" as const,
    siteId: null,
    siteTitle: null,
    siteSlug: null,
    role: null,
    invitedEmail: null,
    expiresAt: null,
    emailMatchesViewer: null,
  };

  const activeRoleKey = acceptedResult?.role ?? inspection.role ?? "editor";
  const rolePresentation = getIndependentSiteRolePresentation(activeRoleKey);
  const roleDetail =
    CLIENT_ADMIN_ROLE_MATRIX.find((item) => item.role === activeRoleKey) ??
    CLIENT_ADMIN_ROLE_MATRIX[2];

  const statusNotice = formatIndependentInvitationStatusNotice(
    inspection,
    user?.email ?? null,
  );

  const loginUrl = `/connexion-administration?returnTo=${encodeURIComponent(
    returnToPath,
  )}${
    inspection.invitedEmail
      ? `&email=${encodeURIComponent(inspection.invitedEmail)}`
      : ""
  }`;

  const registerUrl = `/register?intent=independent&returnTo=${encodeURIComponent(
    returnToPath,
  )}${
    inspection.invitedEmail
      ? `&email=${encodeURIComponent(inspection.invitedEmail)}`
      : ""
  }`;

  const formattedExpiresAt = inspection.expiresAt
    ? new Date(inspection.expiresAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleSwitchAccount = async () => {
    try {
      await logout();
    } catch {
      // Poursuivre vers la page de connexion dédiée même si la déconnexion échoue
    }
    if (typeof window !== "undefined") {
      window.location.assign(loginUrl);
    } else {
      setLocation(loginUrl);
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a2f] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-900">
              Administration du site — Invitation personnelle
            </span>
          </div>
          <Link
            href="/connexion-administration"
            className="inline-flex min-h-[40px] items-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
          >
            Connexion administration
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
        {acceptedResult ? (
          <section className="rounded-xl border border-emerald-300 bg-white">
            <div className="border-b border-emerald-200 bg-emerald-50/70 p-6">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-emerald-900">
                <span>Accès activé</span>
                <span aria-hidden="true">·</span>
                <span>
                  Rôle attribué : {rolePresentation.shortLabel} ({roleDetail.codeLabel})
                </span>
              </div>
              <h1 className="mt-2 flex items-start gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                <span>
                  Bienvenue dans l’administration de «{" "}
                  {acceptedResult.siteTitle ||
                    inspection.siteTitle ||
                    "votre site"}{" "}
                  »
                </span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Votre invitation à usage unique a bien été validée pour{" "}
                <strong>{user?.email}</strong>. Vous pouvez dès maintenant
                administrer votre site en toute autonomie.
              </p>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Votre rôle : {roleDetail.label} ({roleDetail.codeLabel})
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{roleDetail.summary}</p>
                </div>

                <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Ce que vous pouvez consulter
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                      {roleDetail.canView.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Ce que vous pouvez modifier
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-700">
                      {roleDetail.canEdit.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Limites de sécurité
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                      {roleDetail.cannotDo.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-slate-900">
                  {roleDetail.builderAccessNote}
                </p>
                <p className="mt-1">
                  Pour vos prochaines visites, reconnectez-vous directement sur
                  la page de connexion dédiée avec votre adresse{" "}
                  <strong>{user?.email}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="min-h-[44px] bg-[#1e3a2f] px-5 text-sm font-medium text-white hover:bg-[#162b23]"
                  onClick={() =>
                    setLocation(
                      `/administration-site?siteId=${acceptedResult.siteId}`,
                    )
                  }
                >
                  Ouvrir l’administration de mon site
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {(acceptedResult.siteSlug || inspection.siteSlug) && (
                  <Button asChild type="button" variant="outline" className="min-h-[44px]">
                    <Link
                      href={`/sites/${
                        acceptedResult.siteSlug || inspection.siteSlug
                      }`}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Voir le site public
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-[#1e3a2f]">
                  Invitation personnelle à usage unique
                </span>
                {inspection.role && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Rôle proposé : {rolePresentation.shortLabel} ({roleDetail.codeLabel})
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                {inspection.siteTitle
                  ? `Rejoindre l’administration de « ${inspection.siteTitle} »`
                  : "Vérification de votre invitation"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Cette invitation vous donne accès uniquement à l’administration
                du site qui vous a été attribué, sans accès au constructeur
                visuel global ni aux autres projets.
              </p>
            </div>

            <div className="space-y-6 p-6">
              {loading || inspectionQuery.isLoading ? (
                <div
                  role="status"
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600"
                >
                  Vérification sécurisée de votre lien d’invitation en cours…
                </div>
              ) : (
                <>
                  {/* 1. Détails clés de l'invitation */}
                  {inspection.siteTitle && (
                    <div className="grid gap-4 border-b border-slate-200 pb-6 sm:grid-cols-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Globe className="h-3.5 w-3.5 text-[#1e3a2f]" />
                          Site concerné
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {inspection.siteTitle}
                        </p>
                        {inspection.siteSlug && (
                          <p className="mt-0.5 font-mono text-xs text-slate-500">
                            /sites/{inspection.siteSlug}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MailCheck className="h-3.5 w-3.5 text-[#1e3a2f]" />
                          Adresse e-mail invitée
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-900">
                          {inspection.invitedEmail || "Non renseignée"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Utilisez exactement cette adresse pour activer l’accès.
                        </p>
                      </div>

                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <CalendarClock className="h-3.5 w-3.5 text-[#1e3a2f]" />
                          Durée de validité
                        </p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                          {formattedExpiresAt
                            ? `Jusqu’au ${formattedExpiresAt}`
                            : "Usage unique"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Lien sécurisé utilisable une seule fois.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. Statut de l'invitation */}
                  <div
                    role={
                      statusNotice.tone === "rose" ||
                      statusNotice.tone === "amber"
                        ? "alert"
                        : "status"
                    }
                    className={`rounded-xl border p-4 text-sm ${
                      statusNotice.tone === "emerald"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                        : statusNotice.tone === "amber"
                          ? "border-amber-300 bg-amber-50 text-amber-950"
                          : "border-rose-300 bg-rose-50 text-rose-950"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {statusNotice.tone === "emerald" ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      ) : statusNotice.tone === "amber" ? (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                      ) : (
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold">{statusNotice.title}</p>
                        <p className="text-xs leading-relaxed">
                          {statusNotice.description}
                        </p>
                        <p className="pt-1 text-xs font-semibold">
                          Prochaine étape : {statusNotice.actionGuidance}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Détail complet du rôle proposé */}
                  {inspection.role && (
                    <div className="space-y-4 border-b border-slate-200 pb-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <UserCheck className="h-4 w-4 text-[#1e3a2f]" />
                          Votre futur rôle : {roleDetail.label} ({roleDetail.codeLabel})
                        </h2>
                        <span className="text-xs text-slate-600">
                          {roleDetail.audience}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{roleDetail.summary}</p>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            Peut consulter
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                            {roleDetail.canView.map((act) => (
                              <li key={act}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-emerald-900">
                            Peut modifier
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-700">
                            {roleDetail.canEdit.map((act) => (
                              <li key={act}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Ne peut pas faire
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-600">
                            {roleDetail.cannotDo.map((act) => (
                              <li key={act}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        {roleDetail.builderAccessNote}
                      </p>
                    </div>
                  )}

                  {/* 4. Parcours de première connexion (3 étapes simples) */}
                  {inspection.status === "valid" && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-bold text-slate-900">
                        Comment activer votre accès (première connexion)
                      </h2>
                      <ol className="grid gap-4 sm:grid-cols-3">
                        {CLIENT_ADMIN_FIRST_LOGIN_STEPS.map((item) => (
                          <li key={item.step} className="space-y-1">
                            <p className="text-xs font-semibold tabular-nums text-[#1e3a2f]">
                              Étape {item.step}
                            </p>
                            <p className="text-xs font-bold text-slate-900">
                              {item.title}
                            </p>
                            <p className="text-xs leading-relaxed text-slate-600">
                              {item.detail}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Message d'erreur lors de l'activation */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-medium text-rose-900"
                    >
                      {error}
                    </div>
                  )}

                  {/* 5. Actions adaptées */}
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    {user ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                        <span>
                          Compte actuellement connecté :{" "}
                          <strong className="text-slate-900">{user.email}</strong>
                        </span>
                        {inspection.invitedEmail &&
                          user.email?.trim().toLowerCase() !==
                            inspection.invitedEmail.trim().toLowerCase() && (
                            <span className="font-semibold text-amber-900">
                              Adresse différente de {inspection.invitedEmail}
                            </span>
                          )}
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-slate-700">
                        Connectez-vous ou créez votre compte d’administration
                        avec l’adresse e-mail invitée{" "}
                        {inspection.invitedEmail ? (
                          <strong>({inspection.invitedEmail})</strong>
                        ) : null}{" "}
                        pour activer votre accès.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      {!user && inspection.status === "valid" && (
                        <>
                          <Button
                            asChild
                            className="h-auto min-h-[44px] w-full whitespace-normal bg-[#1e3a2f] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white hover:bg-[#162b23] sm:w-auto sm:px-5"
                          >
                            <Link href={loginUrl}>
                              <Lock className="mr-1.5 h-4 w-4 shrink-0" />
                              <span>Se connecter à l’administration du site</span>
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="h-auto min-h-[44px] w-full whitespace-normal bg-white px-4 py-2.5 text-center text-sm leading-snug sm:w-auto sm:px-5"
                          >
                            <Link href={registerUrl}>
                              <span>Créer mon compte avec l’e-mail invité</span>
                            </Link>
                          </Button>
                        </>
                      )}

                      {user && statusNotice.canAccept && (
                        <Button
                          type="button"
                          disabled={accept.isPending}
                          className="h-auto min-h-[44px] w-full whitespace-normal bg-[#1e3a2f] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white hover:bg-[#162b23] sm:w-auto sm:px-5"
                          onClick={() => {
                            setError(null);
                            accept.mutate({ token });
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4 shrink-0" />
                          <span>
                            {accept.isPending
                              ? "Activation de votre accès en cours…"
                              : "Activer mon accès au site"}
                          </span>
                        </Button>
                      )}

                      {user &&
                        inspection.status === "valid" &&
                        inspection.emailMatchesViewer === false && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-auto min-h-[44px] w-full whitespace-normal border-amber-400 bg-white px-4 py-2.5 text-center text-sm leading-snug text-amber-950 hover:bg-amber-50 sm:w-auto"
                            onClick={handleSwitchAccount}
                          >
                            <LogOut className="mr-1.5 h-4 w-4 shrink-0" />
                            <span>
                              Changer de compte pour utiliser{" "}
                              {inspection.invitedEmail}
                            </span>
                          </Button>
                        )}

                      {inspection.status === "already_used" && (
                        <>
                          {user && inspection.siteId ? (
                            <Button
                              type="button"
                              className="h-auto min-h-[44px] w-full whitespace-normal bg-[#1e3a2f] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white hover:bg-[#162b23] sm:w-auto sm:px-5"
                              onClick={() =>
                                setLocation(
                                  `/administration-site?siteId=${inspection.siteId}`,
                                )
                              }
                            >
                              <span>Ouvrir l’administration du site</span>
                              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0" />
                            </Button>
                          ) : (
                            <Button
                              asChild
                              className="h-auto min-h-[44px] w-full whitespace-normal bg-[#1e3a2f] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white hover:bg-[#162b23] sm:w-auto sm:px-5"
                            >
                              <Link
                                href={`/connexion-administration?returnTo=${encodeURIComponent(
                                  inspection.siteId
                                    ? `/administration-site?siteId=${inspection.siteId}`
                                    : "/administration-site",
                                )}${
                                  inspection.invitedEmail
                                    ? `&email=${encodeURIComponent(
                                        inspection.invitedEmail,
                                      )}`
                                    : ""
                                }`}
                              >
                                <span>Se connecter à l’administration du site</span>
                                <ArrowRight className="ml-1.5 h-4 w-4 shrink-0" />
                              </Link>
                            </Button>
                          )}
                        </>
                      )}

                      {inspection.siteSlug && (
                        <Button
                          asChild
                          variant="outline"
                          className="h-auto min-h-[44px] w-full whitespace-normal bg-white px-4 py-2.5 text-center text-sm leading-snug sm:w-auto"
                        >
                          <Link href={`/sites/${inspection.siteSlug}`}>
                            <ExternalLink className="mr-1.5 h-4 w-4 shrink-0" />
                            <span>Voir le site public</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
