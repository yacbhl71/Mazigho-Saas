import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Info,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Rocket,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  buildBuyerStoreHandoverMarkdown,
  STUDIO_SANDBOX_TO_PRODUCTION_RUNBOOK,
  STUDIO_SECRET_ROTATION_RUNBOOK,
} from "@shared/studioOperationalGuides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const STATUS = {
  ok: { icon: CheckCircle2, tone: "text-emerald-600", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", label: "Prêt" },
  todo: { icon: CircleDashed, tone: "text-rose-600", badge: "border-rose-200 bg-rose-50 text-rose-800", label: "À faire" },
  warning: { icon: TriangleAlert, tone: "text-amber-600", badge: "border-amber-200 bg-amber-50 text-amber-900", label: "À vérifier" },
  info: { icon: Info, tone: "text-sky-600", badge: "border-sky-200 bg-sky-50 text-sky-800", label: "Info" },
} as const;

type ManualCheckKey =
  | "storefront_visual_qa"
  | "responsive_multi_device"
  | "checkout_e2e_verified"
  | "byok_secrets_isolation"
  | "buyer_handover_guide";

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("fr-CH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Operational checklist used before a Studio store is sold or offered to its buyer.
 * Combines live technical checks + timestamped operator checkboxes + critical blocking gate.
 */
export default function StudioStoreHandoverChecklist({ storeId }: { storeId: number }) {
  const utils = trpc.useUtils();
  const checklist = trpc.admin.studio.getStoreHandoverChecklist.useQuery(
    { storeId },
    { retry: false, refetchOnWindowFocus: false },
  );
  const data = checklist.data;

  const [checkedKeys, setCheckedKeys] = useState<ManualCheckKey[]>([]);
  const [notes, setNotes] = useState("");
  const [confirmationStoreName, setConfirmationStoreName] = useState("");

  useEffect(() => {
    if (!data) return;
    setCheckedKeys(
      (data.manualChecks ?? [])
        .filter(item => item.checked)
        .map(item => item.key as ManualCheckKey),
    );
    setNotes(data.signoff?.notes ?? "");
  }, [data]);

  const updateManualChecksMutation = trpc.admin.studio.updateStoreHandoverManualChecks.useMutation({
    onSuccess: updated => {
      utils.admin.studio.getStoreHandoverChecklist.setData({ storeId }, updated);
      toast.success("Contrôles opérationnels enregistrés et horodatés.");
    },
    onError: err => toast.error(err.message || "Impossible d’enregistrer la checklist."),
  });

  const confirmDeliveryMutation = trpc.admin.studio.confirmStoreHandoverDelivery.useMutation({
    onSuccess: updated => {
      utils.admin.studio.getStoreHandoverChecklist.setData({ storeId }, updated);
      setConfirmationStoreName("");
      toast.success("Livraison de la boutique validée et horodatée !");
    },
    onError: err => toast.error(err.message || "La validation de livraison a été bloquée."),
  });

  const revokeDeliveryMutation = trpc.admin.studio.revokeStoreHandoverDelivery.useMutation({
    onSuccess: updated => {
      utils.admin.studio.getStoreHandoverChecklist.setData({ storeId }, updated);
      toast.info("Horodatage de livraison rouvert pour nouveaux contrôles.");
    },
    onError: err => toast.error(err.message || "Impossible de rouvrir la checklist."),
  });

  const toggleManualCheck = (key: ManualCheckKey) => {
    const next = checkedKeys.includes(key)
      ? checkedKeys.filter(k => k !== key)
      : [...checkedKeys, key];
    setCheckedKeys(next);
    updateManualChecksMutation.mutate({
      storeId,
      checkedKeys: next,
      notes,
    });
  };

  const saveNotesOnly = () => {
    updateManualChecksMutation.mutate({
      storeId,
      checkedKeys,
      notes,
    });
  };

  const totalAutomated = data?.items.length ?? 0;
  const totalManual = data?.manualTotalCount ?? 0;
  const readyAutomated = data?.readyCount ?? 0;
  const readyManual = data?.manualReadyCount ?? 0;
  const combinedTotal = totalAutomated + totalManual;
  const combinedReady = readyAutomated + readyManual;
  const signoff = data?.signoff;
  const totalBlockers =
    (signoff?.criticalAutomatedBlockers.length ?? 0) +
    (signoff?.criticalManualBlockers.length ?? 0);

  return (
    <Card className="border-violet-200 shadow-sm" data-testid="studio-handover-checklist">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Checklist opérationnelle de livraison
            </Badge>
            {signoff?.deliveryStatus === "delivered" ? (
              <Badge className="border-emerald-300 bg-emerald-600 text-white" data-testid="studio-handover-delivery-badge">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Livrée & horodatée
              </Badge>
            ) : signoff?.deliveryStatus === "ready_to_deliver" ? (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-900" data-testid="studio-handover-delivery-badge">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Prête à livrer
              </Badge>
            ) : (
              <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-900" data-testid="studio-handover-delivery-badge">
                <LockKeyhole className="mr-1 h-3.5 w-3.5" /> Livraison bloquée ({totalBlockers} point{totalBlockers > 1 ? "s" : ""} critique{totalBlockers > 1 ? "s" : ""})
              </Badge>
            )}
          </div>
          <CardTitle className="mt-2 flex items-center gap-2 text-xl">
            Liste de contrôle avant remise & blocage de livraison
          </CardTitle>
          <CardDescription className="mt-1 max-w-3xl">
            Workflow unique de validation avant de remettre la boutique à l’acheteur : contrôles techniques automatisés, cases de recette horodatées et blocage strict si un contrôle critique échoue.
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={checklist.isFetching}
            onClick={() => checklist.refetch()}
            data-testid="studio-handover-refresh"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${checklist.isFetching ? "animate-spin" : ""}`} /> Actualiser l’audit
          </Button>
          {data?.evaluatedAt && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500" data-testid="studio-handover-evaluated-at">
              <Clock className="h-3 w-3" /> Audit : {formatDateTime(data.evaluatedAt)}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {checklist.isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-violet-50" />
        ) : !data ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" data-testid="studio-handover-error">
            La liste de contrôle n’a pas pu être chargée. Réessayez dans un instant.
          </p>
        ) : (
          <>
            {/* Global Progress Summary */}
            <div className="space-y-2.5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-violet-950" data-testid="studio-handover-progress">
                    {data.readyCount} / {totalAutomated} points prêts
                  </span>
                  <span className="text-xs text-violet-800">
                    · {readyManual} / {totalManual} contrôles manuels cochés
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={signoff?.canConfirmDelivery ? STATUS.ok.badge : STATUS.warning.badge}
                  data-testid="studio-handover-verdict"
                >
                  {signoff?.canConfirmDelivery
                    ? "Prête pour la remise"
                    : `${totalBlockers} point(s) critique(s) à régler`}
                </Badge>
              </div>
              <Progress value={combinedTotal ? (combinedReady / combinedTotal) * 100 : 0} className="h-2" />
              {signoff?.updatedAt && (
                <p className="text-[11px] text-violet-900">
                  Dernière mise à jour de la checklist : <strong>{formatDateTime(signoff.updatedAt)}</strong>
                </p>
              )}
            </div>

            {/* Section 1: Automated Technical Checks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Contrôles techniques automatisés ({data.readyCount}/{totalAutomated})
                </h3>
                <span className="text-[11px] text-slate-500">Vérifiés en temps réel sur la boutique</span>
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4" data-testid="studio-handover-items">
                {data.items.map(item => {
                  const style = STATUS[item.status];
                  const Icon = style.icon;
                  return (
                    <li key={item.key} className="flex items-start gap-3 py-3" data-testid={`studio-handover-item-${item.key}`}>
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.tone}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.detail}</p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${style.badge}`} data-testid={`studio-handover-status-${item.key}`}>
                        {style.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Section 2: Interactive Manual Checkboxes with Timestamp */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Recette opérationnelle & contrôles humains ({readyManual}/{totalManual})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Chaque case cochée est horodatée et associée à l’opérateur
                </span>
              </div>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white" data-testid="studio-handover-manual-items">
                {(data.manualChecks ?? []).map(item => {
                  const isChecked = checkedKeys.includes(item.key as ManualCheckKey);
                  return (
                    <label
                      key={item.key}
                      className={`flex cursor-pointer items-start gap-3 p-4 transition ${
                        isChecked ? "bg-emerald-50/30" : "hover:bg-slate-50"
                      }`}
                      data-testid={`studio-handover-manual-${item.key}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={updateManualChecksMutation.isPending}
                        onChange={() => toggleManualCheck(item.key as ManualCheckKey)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-violet-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                          <Badge
                            variant="outline"
                            className={
                              item.critical
                                ? "border-rose-200 bg-rose-50 text-[10px] text-rose-900"
                                : "border-slate-200 bg-slate-50 text-[10px] text-slate-700"
                            }
                          >
                            {item.critical ? "Critique · Bloquant" : "Recommandé"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                        {item.checked && item.checkedAt && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-800">
                            <Check className="h-3.5 w-3.5" />
                            Validé le {formatDateTime(item.checkedAt)}
                            {item.checkedBy ? ` par ${item.checkedBy}` : ""}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Operator Notes */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor={`handover-notes-${storeId}`} className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Journal & notes de recette opérateur
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updateManualChecksMutation.isPending}
                    onClick={saveNotesOnly}
                    className="h-8 bg-white text-xs"
                  >
                    {updateManualChecksMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Enregistrer la note
                  </Button>
                </div>
                <Textarea
                  id={`handover-notes-${storeId}`}
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Consignez ici les références de commande de test Stripe/PayPal, les observations responsive ou les consignes transmises au client…"
                  className="bg-white text-xs"
                />
              </div>
            </div>

            {/* Section 3: Critical Blocking Gate & Formal Timestamped Sign-off */}
            {signoff?.deliveryStatus === "delivered" && signoff.deliveredAt ? (
              <div
                className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-950 space-y-3"
                data-testid="studio-handover-delivered-certificate"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-base font-bold">
                        Certificat de livraison opérationnelle validé
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-900">
                        Boutique <strong>{data.store.displayName}</strong> ({data.store.primaryDomain}) validée pour remise commerciale le{" "}
                        <strong>{formatDateTime(signoff.deliveredAt)}</strong>
                        {signoff.deliveredBy ? ` par ${signoff.deliveredBy}` : ""}. Tous les contrôles critiques automatisés et manuels sont conformes.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={revokeDeliveryMutation.isPending}
                    onClick={() => revokeDeliveryMutation.mutate({ storeId })}
                    className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rouvrir la checklist
                  </Button>
                </div>
              </div>
            ) : signoff?.isDeliveryBlocked ? (
              <div
                className="rounded-2xl border-2 border-rose-200 bg-rose-50/80 p-5 text-rose-950 space-y-3"
                data-testid="studio-handover-blocked-gate"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                  <div className="space-y-2">
                    <p className="text-sm font-bold">
                      Livraison verrouillée : {totalBlockers} contrôle(s) critique(s) en attente
                    </p>
                    <p className="text-xs leading-5 text-rose-900">
                      La validation finale de livraison est bloquée tant que tous les contrôles techniques et opérationnels critiques ne sont pas au vert :
                    </p>
                    <ul className="list-disc pl-5 text-xs space-y-1 text-rose-900">
                      {signoff.criticalAutomatedBlockers.map(blocker => (
                        <li key={`auto-${blocker.key}`}>
                          <strong>[Technique] {blocker.label} :</strong> {blocker.detail}
                        </li>
                      ))}
                      {signoff.criticalManualBlockers.map(blocker => (
                        <li key={`manual-${blocker.key}`}>
                          <strong>[Recette] {blocker.label} :</strong> case critique à vérifier et cocher ci-dessus.
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-5 space-y-4"
                data-testid="studio-handover-ready-gate"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-bold text-emerald-950">
                      Tous les contrôles critiques sont validés — Prête à horodater la livraison
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900">
                      Recopiez le nom exact de la boutique (<strong>{data.store.displayName}</strong>) pour sceller et horodater la checklist de livraison.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`confirm-delivery-name-${storeId}`} className="text-xs font-semibold text-emerald-950">
                      Confirmation du nom de la boutique
                    </Label>
                    <Input
                      id={`confirm-delivery-name-${storeId}`}
                      value={confirmationStoreName}
                      onChange={e => setConfirmationStoreName(e.target.value)}
                      placeholder={data.store.displayName}
                      className="bg-white"
                      data-testid="studio-handover-confirm-input"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={
                      confirmDeliveryMutation.isPending ||
                      confirmationStoreName.trim() !== data.store.displayName.trim()
                    }
                    onClick={() =>
                      confirmDeliveryMutation.mutate({
                        storeId,
                        confirmationStoreName,
                        notes,
                      })
                    }
                    className="min-h-10 bg-emerald-700 text-white hover:bg-emerald-800"
                    data-testid="studio-handover-confirm-button"
                  >
                    {confirmDeliveryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Valider et horodater la livraison
                  </Button>
                </div>
              </div>
            )}
            {/* Section 4: Studio Runbooks (Sandbox -> Production, Secret Rotation) & Buyer Handover Guide */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4" data-testid="studio-handover-runbooks">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-violet-700" />
                    3. Procédures Studio & Guide de prise en main Propriétaire
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Bascule Sandbox → Production, rotation des secrets BYOK et guide personnalisé prêt à transmettre à l’acheteur.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 bg-white text-xs"
                    data-testid="studio-handover-copy-buyer-guide"
                    onClick={() => {
                      const md = buildBuyerStoreHandoverMarkdown({
                        displayName: data.store.displayName,
                        primaryDomain: data.store.primaryDomain,
                      });
                      navigator.clipboard?.writeText(md);
                      toast.success("Guide de prise en main propriétaire copié dans le presse-papiers !");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copier le guide client (.md)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 bg-white text-xs"
                    data-testid="studio-handover-download-buyer-guide"
                    onClick={() => {
                      const md = buildBuyerStoreHandoverMarkdown({
                        displayName: data.store.displayName,
                        primaryDomain: data.store.primaryDomain,
                      });
                      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `guide-proprietaire-${data.store.primaryDomain.replace(/[^a-z0-9.-]/gi, "-")}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Guide propriétaire téléchargé.");
                    }}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger le guide
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Rocket className="h-3.5 w-3.5 text-emerald-600" />
                    Procédure Sandbox → Production
                  </p>
                  <ul className="space-y-2 text-[11px] leading-4 text-slate-600">
                    {STUDIO_SANDBOX_TO_PRODUCTION_RUNBOOK.map(section => (
                      <li key={section.id} className="rounded-lg bg-slate-50 p-2">
                        <strong className="text-slate-900">{section.title}</strong>
                        <p className="mt-0.5">{section.summary}</p>
                        <p className="mt-1 font-medium text-emerald-800">Règle : {section.criticalRule}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                    Procédure de rotation des secrets & BYOK
                  </p>
                  <ul className="space-y-2 text-[11px] leading-4 text-slate-600">
                    {STUDIO_SECRET_ROTATION_RUNBOOK.map(section => (
                      <li key={section.id} className="rounded-lg bg-slate-50 p-2">
                        <strong className="text-slate-900">{section.title}</strong>
                        <p className="mt-0.5">{section.summary}</p>
                        <p className="mt-1 font-medium text-amber-900">Sécurité : {section.criticalRule}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

