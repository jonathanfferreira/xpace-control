import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QrCode as QRCodeIcon, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TicketQRDialogProps {
  ticketId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TicketQRDialog({ ticketId, open, onOpenChange }: TicketQRDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDownloadTicket = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-ticket", {
        body: { ticketId },
      });

      if (error) throw error;

      if (data?.html) {
        // Convert base64 to blob and open in new window for printing/saving
        const htmlContent = atob(data.html);
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        URL.revokeObjectURL(url);

        toast.success("Ingresso gerado! Use Ctrl+P para imprimir ou salvar como PDF");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar ingresso: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QRCodeIcon className="h-5 w-5" />
            QR Code do Ingresso
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG value={`TICKET:${ticketId}`} size={200} />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Este QR Code será usado para validação na entrada do evento
          </p>

          <Button
            onClick={handleDownloadTicket}
            disabled={loading}
            className="w-full gradient-xpace"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Gerando..." : "Baixar Ingresso (PDF)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
