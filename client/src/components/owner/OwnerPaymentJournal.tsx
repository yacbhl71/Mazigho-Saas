import { AlertTriangle, CheckCircle2, CircleX, History, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LEVEL_STYLE = {
  info: { icon: CheckCircle2, className: "text-emerald-600", label: "Information" },
  warning: { icon: AlertTriangle, className: "text-amber-600", label: "Attention" },
  error: { icon: CircleX, className: "text-rose-600", label: "Erreur" },
} as const;

const PROVIDER_LABEL: Record<string, string> = { stripe: "Stripe", paypal: "PayPal" };

function formatAmount(minor: number | null, currency: string | null) {
  if (minor === null || !currency) return null;
  return new Intl.NumberFormat("fr-CH", { style: "currency", currency }).format(minor / 100);
}

/** Owner view of the payment journal: openings, outcomes, connector tests and errors. */
export default function OwnerPaymentJournal() {
  const journal = trpc.owner.byokPayments.journal.useQuery(undefined, { retry: 1 });
  const entries = journal.data ?? [];
  return <Card className="border-slate-200" data-testid="owner-payment-journal">
    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
      <div>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-slate-700" /> Journal des paiements</CardTitle>
        <CardDescription className="mt-1 max-w-2xl">Paiements ouverts, confirmés ou refusés, tests de connexion et erreurs de votre boutique, sur les 180 derniers jours. Aucune clé ni donnée de carte n’y figure.</CardDescription>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={journal.isFetching} onClick={() => journal.refetch()} data-testid="owner-payment-journal-refresh"><RefreshCw className={`mr-2 h-4 w-4 ${journal.isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
    </CardHeader>
    <CardContent>
      {journal.isLoading ? <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        : journal.isError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" data-testid="owner-payment-journal-error">Le journal n’a pas pu être chargé. Réessayez dans un instant.</p>
        : entries.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600" data-testid="owner-payment-journal-empty">Aucun événement pour l’instant. Les prochains paiements et tests de connexion apparaîtront ici.</p>
        : <ul className="divide-y divide-slate-100" data-testid="owner-payment-journal-list">{entries.map(entry => {
          const style = LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.info;
          const Icon = style.icon;
          const amount = formatAmount(entry.amountMinor, entry.currency);
          return <li key={entry.id} className="flex items-start gap-3 py-3" data-testid={`owner-payment-journal-entry-${entry.id}`}>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.className}`} aria-label={style.label} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{entry.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("fr-CH", { dateStyle: "short", timeStyle: "short" })}{entry.reference ? ` · ${entry.reference}` : ""}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {entry.provider && <Badge variant="outline">{PROVIDER_LABEL[entry.provider] ?? entry.provider}</Badge>}
              {amount && <span className="text-xs font-semibold text-slate-700">{amount}</span>}
            </div>
          </li>;
        })}</ul>}
    </CardContent>
  </Card>;
}
