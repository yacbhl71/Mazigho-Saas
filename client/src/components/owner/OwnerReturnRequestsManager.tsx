import { useState } from "react";
import { RotateCcw, CheckCircle2, XCircle, Package, Clock, Loader2, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ReturnRequest, ReturnStatus } from "@shared/returnPortal";

export default function OwnerReturnRequestsManager() {
  const utils = trpc.useUtils();
  const requestsQuery = trpc.returnPortal.getStoreRequests.useQuery();

  const [selectedReq, setSelectedReq] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState<ReturnStatus>("PENDING");
  const [adminNote, setAdminNote] = useState("");
  const [returnLabelUrl, setReturnLabelUrl] = useState("");

  const updateMutation = trpc.returnPortal.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de la demande mis à jour !");
      setSelectedReq(null);
      utils.returnPortal.getStoreRequests.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de mise à jour."),
  });

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
      case "PACKAGE_RECEIVED":
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200"><Package className="w-3 h-3 mr-1" /> Colis Reçu</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Terminé</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Gestion des Retours & Échanges Clients
            </CardTitle>
            <CardDescription>
              Gérez les demandes de retour, validez ou refusez les renvois et fournissez des étiquettes de transporteur.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {requestsQuery.isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des demandes de retour...
          </div>
        ) : !requestsQuery.data || requestsQuery.data.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <RotateCcw className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Aucune demande de retour enregistrée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requestsQuery.data.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{req.id}</span>
                    <span className="text-xs text-slate-500">
                      Commande #{req.orderId} • {req.customerName} ({req.customerEmail})
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Articles : <strong>{req.items.map((i) => `${i.productTitle} (x${i.quantity})`).join(", ")}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Motif : {req.reason} | Résolution : {req.resolution}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReq(req);
                    setNewStatus(req.status);
                    setAdminNote(req.adminNote || "");
                    setReturnLabelUrl(req.returnLabelUrl || "");
                  }}
                  className="text-xs whitespace-nowrap"
                >
                  Gérer la demande
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Traitement du Retour */}
        <Dialog open={Boolean(selectedReq)} onOpenChange={(open) => !open && setSelectedReq(null)}>
          {selectedReq && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  Traiter le Retour #{selectedReq.id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="text-xs bg-slate-50 p-3 rounded-lg space-y-1 border border-slate-100">
                  <p>Client : <strong>{selectedReq.customerName}</strong> ({selectedReq.customerEmail})</p>
                  <p>Commande : <strong>#{selectedReq.orderId}</strong></p>
                  <p>Motif : <strong>{selectedReq.reason}</strong> | Option : <strong>{selectedReq.resolution}</strong></p>
                  {selectedReq.notes && <p className="italic text-slate-600">Note client: "{selectedReq.notes}"</p>}
                </div>

                <div>
                  <Label className="text-xs font-semibold">Changer le statut</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReturnStatus)}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">En attente de revue</SelectItem>
                      <SelectItem value="APPROVED">Approuvé (en attente du colis)</SelectItem>
                      <SelectItem value="PACKAGE_RECEIVED">Colis Reçu à l'entrepôt</SelectItem>
                      <SelectItem value="COMPLETED">Retour Terminé / Remboursé</SelectItem>
                      <SelectItem value="REJECTED">Demande Refusée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="admin-note" className="text-xs font-semibold">Instructions au client (Note marchand)</Label>
                  <Textarea
                    id="admin-note"
                    placeholder="Ex: Merci d'imprimer l'étiquette jointe et de déposer le colis au bureau de poste Swiss Post..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1 text-xs h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="return-label" className="text-xs font-semibold">Lien URL de l'étiquette de retour PDF</Label>
                  <Input
                    id="return-label"
                    placeholder="https://..."
                    value={returnLabelUrl}
                    onChange={(e) => setReturnLabelUrl(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedReq(null)}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    updateMutation.mutate({
                      returnId: selectedReq.id,
                      status: newStatus,
                      adminNote,
                      returnLabelUrl,
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Enregistrer les modifications
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
