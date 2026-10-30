import { useState } from "react";
import { MessageCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OwnerLiveSalesChatSettings() {
  const utils = trpc.useUtils();
  const configQuery = trpc.liveSalesChat.getConfig.useQuery();

  const [enabled, setEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("+41791234567");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [isInitialized, setIsInitialized] = useState(false);

  if (configQuery.data && !isInitialized) {
    setEnabled(configQuery.data.enabled ?? true);
    setWhatsappNumber(configQuery.data.whatsappNumber || "+41791234567");
    setWelcomeMessage(configQuery.data.welcomeMessage || "");
    setPosition(configQuery.data.position || "bottom-right");
    setIsInitialized(true);
  }

  const saveMutation = trpc.liveSalesChat.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Paramètres du Chat WhatsApp enregistrés !");
      utils.liveSalesChat.getConfig.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de sauvegarde."),
  });

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              Bulle de Chat Direct WhatsApp & Ventes ("Shopify Live Sales Chat")
            </CardTitle>
            <CardDescription>
              Affichez une bulle de discussion directe WhatsApp pour répondre instantanément à vos visiteurs et augmenter les conversions.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Bulle de Chat Active</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wa-number" className="text-xs font-semibold">Numéro WhatsApp Business (avec indicatif)</Label>
            <Input
              id="wa-number"
              placeholder="+41 79 123 45 67 ou +33 6 12 34 56 78"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Position du Widget</Label>
            <Select value={position} onValueChange={(v) => setPosition(v as "bottom-right" | "bottom-left")}>
              <SelectTrigger className="mt-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">En bas à droite</SelectItem>
                <SelectItem value="bottom-left">En bas à gauche</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="wa-msg" className="text-xs font-semibold">Message d'accueil personnalisé</Label>
          <Textarea
            id="wa-msg"
            placeholder="Bonjour ! Une question sur nos produits ? Contactez-nous directement !"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="mt-1 text-xs h-20"
          />
        </div>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 text-xs gap-2"
          disabled={saveMutation.isPending}
          onClick={() => {
            saveMutation.mutate({
              enabled,
              whatsappNumber,
              welcomeMessage,
              position,
              showMessenger: false,
            });
          }}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les Paramètres WhatsApp
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
