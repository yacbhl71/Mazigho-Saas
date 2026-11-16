import { Link } from "wouter";
import { CheckCircle2, Circle, CircleAlert, Loader2, PackageSearch, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

type TrackedOrder = { status: string; paymentStatus: string };

const STEPS: Array<{ label: string; done: (order: TrackedOrder) => boolean }> = [
  { label: "Commande enregistrée", done: () => true },
  { label: "Paiement confirmé", done: order => order.paymentStatus !== "unpaid" },
  { label: "En préparation", done: order => ["processing", "shipped", "delivered"].includes(order.status) },
  { label: "Expédiée", done: order => ["shipped", "delivered"].includes(order.status) },
  { label: "Livrée", done: order => order.status === "delivered" },
];

const money = (minor: number, currency: string) => new Intl.NumberFormat("fr-CH", { style: "currency", currency }).format(minor / 100);

/** Public order follow-up opened from the signed link e-mailed to guest customers. */
export default function OrderTracking() {
  const token = new URLSearchParams(window.location.search).get("t") ?? "";
  const tracking = trpc.content.trackOrder.useQuery({ token }, { enabled: token.length >= 20, retry: false, refetchOnWindowFocus: false });
  const order = tracking.data;
  const invalid = token.length < 20 || tracking.isError;

  return <div className="flex min-h-screen flex-col bg-[#fbf7f2]"><Header /><main className="container flex-1 px-4 py-12 md:py-16"><div className="mx-auto max-w-2xl space-y-6">
    <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">Suivi de commande</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="order-tracking-title">{order ? `Commande n° ${order.id}` : "Votre commande"}</h1>{order && <p className="mt-2 text-sm text-slate-600">{order.storeName} · passée le {new Date(order.createdAt).toLocaleDateString("fr-CH", { dateStyle: "long" })}</p>}</div>
    {invalid ? <Card className="border-rose-200 bg-rose-50 shadow-none" data-testid="order-tracking-invalid"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-rose-950"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Lien de suivi invalide ou expiré.</p><p className="mt-1">Utilisez le lien reçu par e-mail après votre paiement, ou contactez la boutique.</p></div></CardContent></Card>
      : !order ? <div className="flex items-center gap-3 rounded-xl border bg-white p-5 text-sm text-slate-600" data-testid="order-tracking-loading"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /> Recherche de votre commande…</div>
      : <>
        {order.status === "cancelled" && <Card className="border-rose-200 bg-rose-50 shadow-none" data-testid="order-tracking-cancelled"><CardContent className="p-5 text-sm leading-6 text-rose-950"><strong>Commande annulée.</strong> {order.paymentStatus === "refunded" ? "Le paiement a été remboursé." : "Aucune autre action n’est prévue sur cette commande."}</CardContent></Card>}
        {order.status !== "cancelled" && <Card className="border-orange-200 bg-white shadow-none"><CardContent className="p-6"><ol className="space-y-4" data-testid="order-tracking-steps">{STEPS.map(step => { const done = step.done(order); const Icon = done ? CheckCircle2 : Circle; return <li key={step.label} className="flex items-center gap-3" data-testid={`order-tracking-step-${done ? "done" : "todo"}`}><Icon className={`h-5 w-5 shrink-0 ${done ? "text-emerald-600" : "text-slate-300"}`} /><span className={`text-sm ${done ? "font-semibold text-slate-950" : "text-slate-500"}`}>{step.label}</span></li>; })}</ol></CardContent></Card>}
        {order.trackingNumber && <Card className="border-sky-200 bg-sky-50 shadow-none" data-testid="order-tracking-parcel"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-sky-950"><span className="flex items-center gap-2"><Truck className="h-5 w-5" /> {order.trackingCarrier ? `${order.trackingCarrier} · ` : ""}<strong>{order.trackingNumber}</strong></span>{order.trackingUrl && <Button asChild size="sm" variant="outline" className="bg-white"><a href={order.trackingUrl} target="_blank" rel="noreferrer noopener" data-testid="order-tracking-carrier-link">Suivre le colis</a></Button>}</CardContent></Card>}
        <Card className="border-[#eadfd2] bg-white shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PackageSearch className="h-5 w-5 text-orange-600" /> Récapitulatif</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3"><span className="text-slate-600">{item.name} × {item.quantity}</span><span className="font-medium text-slate-900">{money(item.unitAmount * item.quantity, order.currencyCode)}</span></div>)}<div className="flex justify-between border-t border-[#eadfd2] pt-3 text-base font-bold"><span>Total payé</span><span className="text-orange-600" data-testid="order-tracking-total">{money(order.totalAmount, order.currencyCode)}</span></div></CardContent></Card>
      </>}
    <Button asChild variant="outline" className="border-[#d9cbbc]"><Link href="/boutique" data-testid="order-tracking-shop-link">Continuer mes achats</Link></Button>
  </div></main><Footer /></div>;
}
