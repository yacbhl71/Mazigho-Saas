import { CheckCircle2, CircleDashed, ClipboardCheck, Info, RefreshCw, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STATUS = {
  ok: { icon: CheckCircle2, tone: "text-emerald-600", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", label: "Prêt" },
  todo: { icon: CircleDashed, tone: "text-rose-600", badge: "border-rose-200 bg-rose-50 text-rose-800", label: "À faire" },
  warning: { icon: TriangleAlert, tone: "text-amber-600", badge: "border-amber-200 bg-amber-50 text-amber-900", label: "À vérifier" },
  info: { icon: Info, tone: "text-sky-600", badge: "border-sky-200 bg-sky-50 text-sky-800", label: "Info" },
} as const;

/** Read-only checklist used before a Studio store is sold or offered to its buyer. */
export default function StudioStoreHandoverChecklist({ storeId }: { storeId: number }) {
  const checklist = trpc.admin.studio.getStoreHandoverChecklist.useQuery({ storeId }, { retry: false, refetchOnWindowFocus: false });
  const data = checklist.data;
  const total = data?.items.length ?? 0;
  return <Card className="border-violet-200" data-testid="studio-handover-checklist">
    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
      <div>
        <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-700" /> Liste de contrôle avant remise</CardTitle>
        <CardDescription className="mt-1 max-w-3xl">À vérifier avant de vendre ou d’offrir cette boutique : propriété, accès de l’ancienne équipe, clés de paiement de l’acheteur, mentions légales et paiement de test. Lecture seule : rien n’est modifié.</CardDescription>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={checklist.isFetching} onClick={() => checklist.refetch()} data-testid="studio-handover-refresh"><RefreshCw className={`mr-2 h-4 w-4 ${checklist.isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
    </CardHeader>
    <CardContent className="space-y-4">
      {checklist.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-violet-50" />
        : !data ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" data-testid="studio-handover-error">La liste de contrôle n’a pas pu être chargée. Réessayez dans un instant.</p>
        : <>
          <div className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-violet-950" data-testid="studio-handover-progress">{data.readyCount} / {total} points prêts</span>
              <Badge variant="outline" className={data.blockingCount === 0 ? STATUS.ok.badge : STATUS.warning.badge} data-testid="studio-handover-verdict">{data.blockingCount === 0 ? "Prête pour la remise" : `${data.blockingCount} point(s) à régler`}</Badge>
            </div>
            <Progress value={total ? (data.readyCount / total) * 100 : 0} className="h-2" />
          </div>
          <ul className="divide-y divide-slate-100" data-testid="studio-handover-items">{data.items.map(item => {
            const style = STATUS[item.status];
            const Icon = style.icon;
            return <li key={item.key} className="flex items-start gap-3 py-3" data-testid={`studio-handover-item-${item.key}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.tone}`} aria-hidden />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-950">{item.label}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.detail}</p></div>
              <Badge variant="outline" className={`shrink-0 ${style.badge}`} data-testid={`studio-handover-status-${item.key}`}>{style.label}</Badge>
            </li>;
          })}</ul>
        </>}
    </CardContent>
  </Card>;
}
