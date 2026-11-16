import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { CheckCircle2, CircleAlert, Loader2, ShoppingBag, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/hooks/useCart";

type ReturnState = { tone: "ok" | "wait" | "error"; title: string; text: string };

function money(minor: number, currency: string) {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function describe(outcome: "success" | "cancel", query: { isPending: boolean; isError: boolean; data?: { status: string; amountMinor: number; currency: string; isTestMode: boolean } }): ReturnState {
  if (outcome === "cancel") return { tone: "error", title: "Paiement annulé", text: "Aucun montant n’a été prélevé. Votre panier est conservé : vous pouvez reprendre la commande quand vous le souhaitez." };
  if (query.isPending || !query.data && !query.isError) return { tone: "wait", title: "Vérification du paiement…", text: "Le statut est vérifié directement auprès du prestataire de paiement de la boutique." };
  if (query.isError || !query.data) return { tone: "error", title: "Vérification du paiement impossible", text: "Ce lien ne permet pas de confirmer un paiement. Si un montant a été prélevé, la boutique le verra dans son espace de paiement." };
  const { status, amountMinor, currency, isTestMode } = query.data;
  if (status === "paid") return { tone: "ok", title: "Paiement confirmé", text: `Votre commande de ${money(amountMinor, currency)} est enregistrée et passe en préparation.${isTestMode ? " Il s’agit d’un paiement en environnement Test." : ""}` };
  if (status === "pending_payment" || status === "processing") return { tone: "wait", title: "Paiement en attente de confirmation", text: "Le prestataire n’a pas encore confirmé ce paiement. Vérifiez de nouveau dans quelques instants ; votre panier est conservé." };
  return { tone: "error", title: "Paiement non abouti", text: "Ce paiement a échoué ou a expiré. Aucune commande payée n’a été enregistrée ; votre panier est conservé." };
}

export default function ByokCheckoutReturn({ outcome }: { outcome: "success" | "cancel" }) {
  const params = new URLSearchParams(window.location.search);
  const storeId = Number(params.get("storeId"));
  const orderId = params.get("orderId") ?? "";
  const validLink = Number.isInteger(storeId) && storeId > 0 && /^ord_[a-f0-9]{32}$/.test(orderId);
  const { clearCart } = useCart();
  const confirm = trpc.checkout.confirmByokReturn.useMutation();
  const started = useRef(false);
  const { mutate } = confirm;

  useEffect(() => {
    if (outcome !== "success" || !validLink || started.current) return;
    started.current = true;
    mutate({ storeId, orderId });
  }, [outcome, validLink, storeId, orderId, mutate]);

  const paid = confirm.data?.status === "paid";
  const cleared = useRef(false);
  useEffect(() => {
    if (!paid || cleared.current) return;
    cleared.current = true;
    clearCart();
  }, [paid, clearCart]);

  const state = describe(outcome, { isPending: confirm.isPending, isError: confirm.isError || (outcome === "success" && !validLink), data: confirm.data });
  const Icon = state.tone === "ok" ? CheckCircle2 : state.tone === "wait" ? (confirm.isPending ? Loader2 : ShoppingBag) : outcome === "cancel" ? XCircle : CircleAlert;
  const toneClass = state.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : state.tone === "wait" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-rose-200 bg-rose-50 text-rose-950";

  return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex-1 px-4 py-14"><div className="mx-auto max-w-xl">
    <Card className={`shadow-none ${toneClass}`} data-testid="byok-checkout-return"><CardContent className="space-y-4 p-6">
      <div className="flex items-start gap-3"><Icon className={`mt-0.5 h-6 w-6 shrink-0 ${confirm.isPending ? "animate-spin" : ""}`} /><div><h1 className="text-xl font-semibold" data-testid="byok-checkout-return-title">{state.title}</h1><p className="mt-2 text-sm leading-6" data-testid="byok-checkout-return-text">{state.text}</p></div></div>
      <div className="flex flex-wrap gap-3">
        {state.tone === "wait" && !confirm.isPending && validLink && <Button type="button" variant="outline" className="bg-white/70" onClick={() => mutate({ storeId, orderId })} data-testid="byok-checkout-return-retry">Vérifier à nouveau</Button>}
        {paid ? <Button asChild className="bg-emerald-700 text-white hover:bg-emerald-800" data-testid="byok-checkout-return-orders"><Link href="/commandes">Voir mes commandes</Link></Button> : <Button asChild variant="outline" className="bg-white/70" data-testid="byok-checkout-return-cart"><Link href="/panier">Retour au panier</Link></Button>}
      </div>
    </CardContent></Card>
  </div></main><Footer /></div>;
}
