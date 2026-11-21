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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  formatIndependentInvitationErrorMessage,
  formatIndependentInvitationStatusNotice,
  getIndependentSiteRolePresentation,
  INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE,
} from "@shared/isolatedSiteBuilder";

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

  const returnToPath = token
    ? `/constructeur-sites/invitation/${encodeURIComponent(token)}`
    : "/constructeur-sites";

  const inspection = inspectionQuery.data ?? {
    status: token ? ("not_found" as const) : ("not_found" as const),
    siteId: null,
    siteTitle: null,
    siteSlug: null,
    role: null,
    invitedEmail: null,
    expiresAt: null,
    emailMatchesViewer: null,
  };

  const rolePresentation = getIndependentSiteRolePresentation(
    acceptedResult?.role ?? inspection.role ?? "editor",
  );

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
      // ignore logout error and proceed to dedicated login
    }
    if (typeof window !== "undefined") {
      window.location.assign(loginUrl);
    } else {
      setLocation(loginUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-slate-900">
      <header className="border-b border-[#dfe7d0] bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#40552d] text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#40552d]">
                Invitation à l’administration d’un site
              </p>
              <p className="text-xs text-slate-600">
                Espace client dédié · Sans boutique ni accès aux autres projets
              </p>
            </div>
          </div>
          <Link href="/connexion-administration">
            <span className="cursor-pointer rounded-md border border-[#dfe7d0] bg-[#fbfcf8] px-3 py-1.5 text-xs font-semibold text-[#40552d] hover:bg-[#eef3e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40552d]">
              Page /connexion-administration
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* ÉTAT APRÈS ACCEPTATION DE L'INVITATION */}
        {acceptedResult ? (
          <Card className="border-emerald-300 bg-white shadow-xl shadow-slate-200/60">
            <CardHeader className="border-b border-emerald-100 bg-emerald-50/70 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="bg-emerald-700 text-white">
                  Accès activé avec succès
                </Badge>
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-white text-emerald-900"
                >
                  Rôle attribué : {rolePresentation.badgeLabel}
                </Badge>
              </div>
              <CardTitle className="mt-2 flex items-center gap-2 text-xl text-emerald-950">
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                Bienvenue dans l’espace de gestion de «{" "}
                {acceptedResult.siteTitle ||
                  inspection.siteTitle ||
                  "votre site"}{" "}
                »
              </CardTitle>
              <CardDescription className="text-sm text-emerald-900">
                Votre invitation à usage unique a bien été validée pour le
                compte <strong>{user?.email}</strong>. Vous pouvez maintenant
                administrer votre site en toute autonomie.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-6">
              <div className="rounded-xl border border-[#dfe7d0] bg-[#f7f9f4] p-4 text-sm">
                <p className="font-semibold text-[#172033]">
                  Résumé de votre rôle : {rolePresentation.title}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {rolePresentation.description}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-bold text-emerald-900">
                      ✓ Ce que vous pouvez faire :
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                      {rolePresentation.allowedActions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold text-slate-800">
                      • Limites de sécurité de ce rôle :
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                      {rolePresentation.restrictedActions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                <p className="font-semibold text-[#172033]">
                  {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.isolationNotice}
                </p>
                <p className="mt-1 text-slate-600">
                  Pour vos prochaines visites, connectez-vous directement sur{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#40552d]">
                    /connexion-administration
                  </code>{" "}
                  avec votre adresse <strong>{user?.email}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  className="bg-[#172033] text-white hover:bg-[#24324f]"
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
                  <Link
                    href={`/sites/${
                      acceptedResult.siteSlug || inspection.siteSlug
                    }`}
                  >
                    <Button type="button" variant="outline">
                      <Globe className="mr-1.5 h-4 w-4" />
                      Voir le site public (/sites/
                      {acceptedResult.siteSlug || inspection.siteSlug})
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ÉTAT AVANT ACCEPTATION DE L'INVITATION */
          <Card className="border-[#dfe7d0] bg-white shadow-xl shadow-slate-200/60">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="border-[#dfe7d0] bg-[#f7f9f4] text-[#40552d]"
                >
                  Invitation personnelle à usage unique
                </Badge>
                {inspection.role && (
                  <Badge
                    variant="outline"
                    className="border-slate-300 bg-slate-50 text-[#172033]"
                  >
                    Rôle attribué : {rolePresentation.badgeLabel}
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-2 text-xl text-[#172033] md:text-2xl">
                {inspection.siteTitle
                  ? `Accès à l’espace de gestion du site « ${inspection.siteTitle} »`
                  : "Vérification de votre lien d’invitation"}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Cet espace vous permet de gérer uniquement le site qui vous a
                été attribué, en toute indépendance de la boutique et des
                autres projets.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-5">
              {loading || inspectionQuery.isLoading ? (
                <div
                  role="status"
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600"
                >
                  Vérification sécurisée de votre invitation en cours…
                </div>
              ) : (
                <>
                  {/* 1. Présentation claire du site, de l'adresse e-mail invitée et de la durée de validité */}
                  {inspection.siteTitle && (
                    <div className="grid gap-3 rounded-xl border border-[#dfe7d0] bg-[#fafcf7] p-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <Globe className="h-3.5 w-3.5 text-[#40552d]" />
                          Site concerné
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#172033]">
                          {inspection.siteTitle}
                        </p>
                        {inspection.siteSlug && (
                          <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                            /sites/{inspection.siteSlug}
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <MailCheck className="h-3.5 w-3.5 text-[#40552d]" />
                          Adresse e-mail invitée
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-[#172033]">
                          {inspection.invitedEmail || "Non renseignée"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          Seul un compte utilisant cet e-mail peut activer ce
                          lien.
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200/80 bg-white p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <CalendarClock className="h-3.5 w-3.5 text-[#40552d]" />
                          Durée de validité
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#172033]">
                          {formattedExpiresAt
                            ? `Jusqu’au ${formattedExpiresAt}`
                            : "Usage unique"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          Lien sécurisé à usage unique.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. État de l'invitation (valide, expirée, révoquée, déjà utilisée, e-mail différent) */}
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
                          → {statusNotice.actionGuidance}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Explication claire du rôle attribué avant acceptation */}
                  {inspection.role && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#172033]">
                          <UserCheck className="h-4 w-4 text-[#40552d]" />
                          Comprendre votre rôle : {rolePresentation.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {rolePresentation.audienceSummary}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {rolePresentation.description}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                          <p className="text-xs font-bold text-emerald-950">
                            ✓ Fonctions disponibles avec ce rôle :
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                            {rolePresentation.allowedActions.map((act) => (
                              <li key={act}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-bold text-slate-800">
                            • Fonctions réservées au Propriétaire / Admin :
                          </p>
                          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
                            {rolePresentation.restrictedActions.map((act) => (
                              <li key={act}>• {act}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message d'erreur éventuel lors du clic sur Activer */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-medium text-rose-900"
                    >
                      {error}
                    </div>
                  )}

                  {/* 4. Actions adaptées : Connexion / Changement de compte / Activation */}
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {user ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                        <span>
                          Compte actuellement connecté :{" "}
                          <strong className="text-[#172033]">
                            {user.email}
                          </strong>
                        </span>
                        {inspection.invitedEmail &&
                          user.email?.trim().toLowerCase() !==
                            inspection.invitedEmail.trim().toLowerCase() && (
                            <Badge
                              variant="outline"
                              className="border-amber-400 bg-amber-100 text-amber-950"
                            >
                              E-mail différent de {inspection.invitedEmail}
                            </Badge>
                          )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700">
                        Vous n’êtes pas encore connecté. Pour activer cette
                        invitation, connectez-vous sur{" "}
                        <strong>/connexion-administration</strong> ou créez
                        votre accès avec l’adresse e-mail invitée{" "}
                        {inspection.invitedEmail ? (
                          <strong>({inspection.invitedEmail})</strong>
                        ) : null}
                        .
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5">
                      {!user && inspection.status === "valid" && (
                        <>
                          <Link href={loginUrl}>
                            <Button
                              type="button"
                              className="bg-[#40552d] text-white hover:bg-[#324423]"
                            >
                              <Lock className="mr-1.5 h-4 w-4" />
                              Se connecter sur /connexion-administration
                            </Button>
                          </Link>
                          <Link href={registerUrl}>
                            <Button type="button" variant="outline">
                              Créer mon compte avec l’e-mail invité
                            </Button>
                          </Link>
                        </>
                      )}

                      {user && statusNotice.canAccept && (
                        <Button
                          type="button"
                          disabled={accept.isPending}
                          className="bg-[#172033] text-white hover:bg-[#24324f]"
                          onClick={() => {
                            setError(null);
                            accept.mutate({ token });
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-300" />
                          {accept.isPending
                            ? "Activation de votre accès en cours…"
                            : "Activer mon accès au site"}
                        </Button>
                      )}

                      {user &&
                        inspection.status === "valid" &&
                        inspection.emailMatchesViewer === false && (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-amber-500 bg-white text-amber-950 hover:bg-amber-50"
                            onClick={handleSwitchAccount}
                          >
                            <LogOut className="mr-1.5 h-4 w-4" />
                            Changer de compte pour utiliser{" "}
                            {inspection.invitedEmail}
                          </Button>
                        )}

                      {inspection.status === "already_used" && (
                        <>
                          {user && inspection.siteId ? (
                            <Button
                              type="button"
                              className="bg-[#172033] text-white hover:bg-[#24324f]"
                              onClick={() =>
                                setLocation(
                                  `/administration-site?siteId=${inspection.siteId}`,
                                )
                              }
                            >
                              Ouvrir l’administration du site
                              <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                          ) : (
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
                              <Button
                                type="button"
                                className="bg-[#40552d] text-white hover:bg-[#324423]"
                              >
                                Aller sur /connexion-administration
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </>
                      )}

                      {inspection.siteSlug && (
                        <Link href={`/sites/${inspection.siteSlug}`}>
                          <Button type="button" variant="outline">
                            <ExternalLink className="mr-1.5 h-4 w-4" />
                            Voir le site public (/sites/{inspection.siteSlug})
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 5. Assistance & Isolation rassurante */}
                  <div className="rounded-xl border border-[#dfe7d0] bg-[#fbfcf8] p-3.5 text-xs text-slate-600">
                    <p className="font-semibold text-[#40552d]">
                      {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.isolationNotice}
                    </p>
                    <p className="mt-1">
                      {INDEPENDENT_SITE_CLIENT_DELIVERY_GUIDE.supportNotice}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
