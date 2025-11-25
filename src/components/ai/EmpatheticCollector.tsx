
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Wand2, Copy, Loader2 } from "lucide-react";
import { geminiMock } from "@/services/geminiMock"; // Importando o nosso mock

interface DebtDetails {
  studentName: string;
  debtAmount: number;
  dueDate: string;
}

interface EmpatheticCollectorProps {
  debtInfo: DebtDetails | null;
}

interface GeneratedMessages {
  formal: string;
  friendly: string;
  urgent: string;
}

export const EmpatheticCollector = ({ debtInfo }: EmpatheticCollectorProps) => {
  const [messages, setMessages] = useState<GeneratedMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateMessages = async () => {
    if (!debtInfo) {
        toast.warning("Não há informações de débito para gerar a mensagem.");
        return;
    }

    setIsLoading(true);
    setMessages(null);
    
    try {
      // Usando o MOCK em vez da chamada real da Firebase Function
      const data = await geminiMock.generateBillingMessages(debtInfo);
      setMessages(data);
      toast.success("Mensagens geradas com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error("Falha ao gerar mensagens (mock).", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("Mensagem copiada para a área de transferência!");
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center"><Wand2 className="mr-2 text-primary" /> Cobrador Empático</CardTitle>
        <CardDescription>
          {debtInfo ? 
            "Use IA para gerar mensagens de cobrança baseadas no débito atual. Clique no botão e veja a mágica acontecer."
            : "O aluno não possui débitos pendentes."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!messages && (
          <Button onClick={handleGenerateMessages} disabled={isLoading || !debtInfo}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : "Gerar 3 opções de mensagem"}
          </Button>
        )}

        {messages && (
          <div className="space-y-4">
            <MessageCard title="Abordagem Formal" content={messages.formal} onCopy={() => handleCopy(messages.formal)} />
            <MessageCard title="Abordagem Amigável" content={messages.friendly} onCopy={() => handleCopy(messages.friendly)} />
            <MessageCard title="Abordagem Urgente" content={messages.urgent} onCopy={() => handleCopy(messages.urgent)} />
            <Button variant="outline" onClick={() => setMessages(null)} className="w-full">Gerar Novamente</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente auxiliar para exibir cada mensagem
const MessageCard = ({ title, content, onCopy }: { title: string, content: string, onCopy: () => void }) => (
  <div className="p-4 border rounded-lg relative bg-background">
    <h4 className="font-semibold mb-2 text-sm">{title}</h4>
    <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
    <Button variant="ghost" size="icon" onClick={onCopy} className="absolute top-2 right-2 h-8 w-8">
      <Copy className="h-4 w-4" />
    </Button>
  </div>
);
