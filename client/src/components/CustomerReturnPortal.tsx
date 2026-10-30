import { useState } from "react";
import { RotateCcw, Package, Send, CheckCircle2, Clock, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReturnReason, ReturnResolution, ReturnStatus } from "@shared/returnPortal";

export default function CustomerReturnPortal() {
  const utils = trpc.useUtils();
  const myRequestsQuery = trpc.returnPortal.getMyRequests.useQuery();

  const [step, setStep] = useState<"LIST" | "NEW">("LIST");
  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPriceChf, setItemPriceChf] = useState<number>(0);
  const [reason, setReason] = useState<ReturnReason>("WRONG_SIZE");
  const [resolution, setResolution] = useState<ReturnResolution>("REFUND");
  const [notes, setNotes] = useState("");

  const createMutation = trpc.returnPortal.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Votre demande de retour a été transmise avec succès !");
      setStep("LIST");
      utils.returnPortal.getMyRequests.invalidate();
      // Reset form
      setOrderId("");
      setItemTitle("");
      setNotes("");
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la création de la demande."),
  });

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Approuvé</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
      case "PACKAGE_RECEIVED":
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200"><Package className="w-3 h-3 mr-1" /> Colis Reçu</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Terminé</Badge>;
    }
  };

  const getReasonLabel = (r: ReturnReason) => {
    switch (r) {
      case "WRONG_SIZE": return "Taille non adaptée";
      case "DEFECTIVE": return "Article défectueux ou endommagé";
      case "NOT_AS_PICTURED": return "Non conforme aux photos";
      case "CHANGED_MIND": return "Changement d'avis";
      case "OTHER": return "Autre raison";
    }
  };

  const getResolutionLabel = (res: ReturnResolution) => {
    switch (res) {
      case "REFUND": return "Remboursement bancaire";
      case "EXCHANGE": return "Échange d'article";
      case "STORE_CREDIT": return "Avoir en boutique";
    }
  };

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Portail Auto-Service des Retours & Échanges
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Effectuez une demande de retour ou d'échange en quelques clics.
            </CardDescription>
          </div>
          {step === "LIST" ? (
            <Button
              onClick={() => setStep("NEW")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nouvelle Demande
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setStep("LIST")}
              className="text-slate-600 hover:text-slate-900 text-xs gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour à la liste
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === "NEW" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!orderId || !itemTitle) {
                toast.error("Veuillez renseigner le numéro de commande et l'article.");
                return;
              }
              createMutation.mutate({
                orderId,
                customerName: customerName || "Client",
                customerEmail: customerEmail || "client@example.com",
                items: [
                  {
                    productId: 1,
                    productTitle: itemTitle,
                    quantity: itemQuantity,
                    priceCents: Math.round(itemPriceChf * 100),
                  },
                ],
                reason,
                resolution,
                notes,
              });
            }}
            className="space-y-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/20"
          >
            <h4 className="font-bold text-indigo-950 text-sm">Formulaire de Retour</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="order-id" className="text-xs font-semibold">Numéro de Commande</Label>
                <Input
                  id="order-id"
                  placeholder="ex: CMD-10492"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cust-name" className="text-xs font-semibold">Votre Nom complet</Label>
                <Input
                  id="cust-name"
                  placeholder="ex: Sophie Martin"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cust-email" className="text-xs font-semibold">Votre Adresse Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="ex: sophie@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <Label htmlFor="item-title" className="text-xs font-semibold">Nom de l'article à retourner</Label>
                <Input
                  id="item-title"
                  placeholder="ex: Veste Veste d'Hiver en Laine (M, Noir)"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="item-qty" className="text-xs font-semibold">Quantité</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min={1}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Label className="text-xs font-semibold">Motif du retour</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                  <SelectTrigger className="mt-1 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WRONG_SIZE">Taille non adaptée</SelectItem>
                    <SelectItem value="DEFECTIVE">Article défectueux ou endommagé</SelectItem>
                    <SelectItem value="NOT_AS_PICTURED">Non conforme aux photos</SelectItem>
                    <SelectItem value="CHANGED_MIND">Changement d'avis</SelectItem>
                    <SelectItem value="OTHER">Autre raison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Option souhaitée</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as ReturnResolution)}>
                  <SelectTrigger className="mt-1 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFUND">Remboursement bancaire</SelectItem>
                    <SelectItem value="EXCHANGE">Échange d'article</SelectItem>
                    <SelectItem value="STORE_CREDIT">Avoir en boutique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs font-semibold">Remarques ou précisions (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Explications supplémentaires pour le commerçant..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 bg-white text-xs h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs gap-2 py-4"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi de la demande...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer la demande de retour
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {myRequestsQuery.isLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement de vos demandes de retour...
              </div>
            ) : !myRequestsQuery.data || myRequestsQuery.data.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">Vous n'avez aucune demande de retour en cours.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequestsQuery.data.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{req.id}</span>
                        <span className="text-xs text-slate-500">• Commande #{req.orderId}</span>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-medium text-slate-800">
                        Articles : {req.items.map((i) => `${i.productTitle} (x${i.quantity})`).join(", ")}
                      </p>
                      <p className="text-slate-600">
                        Motif : <strong className="text-slate-800">{getReasonLabel(req.reason)}</strong> | Option : <strong className="text-slate-800">{getResolutionLabel(req.resolution)}</strong>
                      </p>
                      {req.adminNote && (
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-950 mt-2">
                          <strong className="block text-[11px] text-indigo-800">Note du Commerçant :</strong>
                          <p className="text-xs mt-0.5">{req.adminNote}</p>
                        </div>
                      )}
                      {req.returnLabelUrl && (
                        <div className="pt-2">
                          <a
                            href={req.returnLabelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Télécharger l'étiquette de retour prépayée PDF
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
