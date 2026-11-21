import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function SiteInvitationPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/constructeur-sites/invitation/:token");
  const { user, loading } = useAuth();
  const token =
    params?.token ??
    new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    ).get("token") ??
    "";
  const [error, setError] = useState<string | null>(null);
  const accept = trpc.independentSiteBuilder.acceptSiteInvitation.useMutation({
    onSuccess: (result) =>
      setLocation(`/constructeur-sites?siteId=${result.siteId}`),
    onError: (err) =>
      setError(err.message || "Invitation invalide ou expirée."),
  });
  useEffect(() => {
    if (!loading && !user && token && typeof window !== "undefined") {
      const returnTo = `/constructeur-sites/invitation/${encodeURIComponent(token)}`;
      window.location.assign(
        `${getLoginUrl()}?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }
  }, [loading, user, token]);
  useEffect(() => {
    if (user && token && !accept.isPending && !accept.data && !error)
      accept.mutate({ token });
  }, [user, token]);
  if (!token)
    return (
      <main className="grid min-h-screen place-items-center">
        <p>Invitation introuvable.</p>
      </main>
    );
  if (loading || !user)
    return (
      <main className="grid min-h-screen place-items-center">
        <p>Préparation de votre invitation…</p>
      </main>
    );
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Invitation à un site indépendant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Cette invitation vous donnera accès uniquement au site qui vous a
            été attribué.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {accept.isPending && <p className="text-sm">Activation en cours…</p>}
          {error && (
            <Button
              onClick={() => {
                setError(null);
                accept.mutate({ token });
              }}
            >
              Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
