import { useState } from "react";
import { Star, CheckCircle2, XCircle, Clock, MessageSquare, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ProductReviewItem, ReviewStatus } from "@shared/productReviewsUgc";

export default function OwnerReviewsModerationManager() {
  const utils = trpc.useUtils();
  const reviewsQuery = trpc.productReviewsUgc.getStoreReviews.useQuery();
  const configQuery = trpc.productReviewsUgc.getConfig.useQuery();

  const [enabled, setEnabled] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Moderation state
  const [selectedReview, setSelectedReview] = useState<ProductReviewItem | null>(null);
  const [newStatus, setNewStatus] = useState<ReviewStatus>("APPROVED");
  const [merchantReply, setMerchantReply] = useState("");

  if (configQuery.data && !isInitialized) {
    setEnabled(configQuery.data.enabled ?? true);
    setRequireApproval(configQuery.data.requireApproval ?? true);
    setIsInitialized(true);
  }

  const saveConfigMutation = trpc.productReviewsUgc.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Paramètres des avis enregistrés !");
      utils.productReviewsUgc.getConfig.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de sauvegarde."),
  });

  const moderateMutation = trpc.productReviewsUgc.moderateReview.useMutation({
    onSuccess: () => {
      toast.success("Statut de l'avis mis à jour !");
      setSelectedReview(null);
      utils.productReviewsUgc.getStoreReviews.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de modération."),
  });

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Modération & Gestion des Avis Clients
            </CardTitle>
            <CardDescription>
              Gérez les avis soumis par vos clients, filtrez les commentaires inappropriés et répondez publiquement.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-xs font-semibold">Avis Clients Actifs</Label>
            <Switch
              checked={enabled}
              onCheckedChange={(val) => {
                setEnabled(val);
                saveConfigMutation.mutate({ enabled: val, requireApproval, allowMediaUploads: true, autoApproveVerified: true });
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
          <Label className="text-xs font-semibold text-indigo-950">
            Modération préalable requise avant publication
          </Label>
          <Switch
            checked={requireApproval}
            onCheckedChange={(val) => {
              setRequireApproval(val);
              saveConfigMutation.mutate({ enabled, requireApproval: val, allowMediaUploads: true, autoApproveVerified: true });
            }}
          />
        </div>

        {/* Reviews Moderation List */}
        {reviewsQuery.isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des avis clients...
          </div>
        ) : !reviewsQuery.data || reviewsQuery.data.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Aucun avis soumis pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewsQuery.data.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{rev.authorName}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    {getStatusBadge(rev.status)}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">"{rev.comment}"</p>
                  <p className="text-[11px] text-slate-500">
                    Email: {rev.authorEmail} | Date: {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReview(rev);
                    setNewStatus(rev.status);
                    setMerchantReply(rev.merchantReply || "");
                  }}
                  className="text-xs whitespace-nowrap shrink-0"
                >
                  Modérer / Répondre
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Moderation Modal */}
        <Dialog open={Boolean(selectedReview)} onOpenChange={(open) => !open && setSelectedReview(null)}>
          {selectedReview && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Modérer l'Avis de {selectedReview.authorName}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <p className="font-semibold text-slate-800">Avis original ({selectedReview.rating}/5 ⭐) :</p>
                  <p className="text-slate-600">"{selectedReview.comment}"</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={newStatus === "APPROVED" ? "default" : "outline"}
                    onClick={() => setNewStatus("APPROVED")}
                    className={newStatus === "APPROVED" ? "bg-emerald-600 text-white text-xs gap-1" : "text-xs gap-1"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant={newStatus === "REJECTED" ? "default" : "outline"}
                    onClick={() => setNewStatus("REJECTED")}
                    className={newStatus === "REJECTED" ? "bg-rose-600 text-white text-xs gap-1" : "text-xs gap-1"}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Refuser
                  </Button>
                </div>

                <div>
                  <Label htmlFor="merchant-reply" className="text-xs font-semibold">Réponse du Vendeur (Publique)</Label>
                  <Textarea
                    id="merchant-reply"
                    placeholder="ex: Merci beaucoup pour votre confiance !"
                    value={merchantReply}
                    onChange={(e) => setMerchantReply(e.target.value)}
                    className="mt-1 text-xs h-20"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedReview(null)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  disabled={moderateMutation.isPending}
                  onClick={() => {
                    moderateMutation.mutate({
                      reviewId: selectedReview.id,
                      status: newStatus,
                      merchantReply,
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {moderateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
