import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Phone } from "lucide-react";

const leadSchema = z.object({
  schoolName: z.string().min(3, "Nome da escola deve ter pelo menos 3 caracteres"),
  city: z.string().min(2, "Cidade inválida"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  email: z.string().email("Email inválido"),
});

export function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: "",
    city: "",
    whatsapp: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = leadSchema.parse(formData);

      const { error } = await supabase.from("leads").insert({
        school_name: validated.schoolName,
        city: validated.city,
        whatsapp: validated.whatsapp,
        email: validated.email,
        status: "new",
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso! Em breve entraremos em contato.");
      setFormData({
        schoolName: "",
        city: "",
        whatsapp: "",
        email: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao enviar mensagem. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
          <Phone className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl md:text-3xl">Quero conhecer o Xpace Control</CardTitle>
        <CardDescription className="text-base">
          Preencha o formulário e nossa equipe entrará em contato
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">Nome da Escola</Label>
            <Input
              id="schoolName"
              placeholder="Ex: Studio de Dança Arte e Movimento"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Ex: São Paulo"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" variant="hero" size="lg" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
