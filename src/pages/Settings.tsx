import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<School | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    primary_color: "#6324b2",
    payment_provider: "MOCK" as "MOCK" | "ASAAS_SANDBOX",
  });
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch school
      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (schoolData) {
        setSchool(schoolData);
        setSchoolForm({
          name: schoolData.name,
          primary_color: schoolData.primary_color || "#6324b2",
          payment_provider: (schoolData.payment_provider as "MOCK" | "ASAAS_SANDBOX") || "MOCK",
        });
      } else {
        // No school found, redirect to onboarding
        navigate("/onboarding");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name,
          phone: profileData.phone || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("schools")
        .insert({
          name: schoolForm.name,
          primary_color: schoolForm.primary_color,
          payment_provider: schoolForm.payment_provider,
          admin_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create trial subscription
      const { error: functionError } = await supabase.rpc("create_trial_subscription", {
        _school_id: data.id,
      });

      if (functionError) {
        console.error("Error creating trial subscription:", functionError);
      }

      setSchool(data);
      toast.success("Escola criada com sucesso! Trial de 15 dias ativado.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar escola");
    }
  };

  const handleUpdateSchool = async () => {
    if (!school) return;

    try {
      const { error } = await supabase
        .from("schools")
        .update({
          name: schoolForm.name,
          primary_color: schoolForm.primary_color,
          payment_provider: schoolForm.payment_provider,
        })
        .eq("id", school.id);

      if (error) throw error;

      toast.success("Escola atualizada com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar escola");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
            <CardDescription>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <Button onClick={handleUpdateProfile} className="gradient-xpace">
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* School Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Escola</CardTitle>
            <CardDescription>
              {school ? "Atualize as informações da escola" : "Crie sua escola"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Escola</Label>
              <Input
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                placeholder="Nome da sua escola de dança"
              />
            </div>
            <div>
              <Label>Cor Principal (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={schoolForm.primary_color}
                  onChange={(e) => setSchoolForm({ ...schoolForm, primary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={schoolForm.primary_color}
                  onChange={(e) => setSchoolForm({ ...schoolForm, primary_color: e.target.value })}
                  placeholder="#6324b2"
                />
              </div>
            </div>
            <div>
              <Label>Gateway de Pagamento</Label>
              <Select
                value={schoolForm.payment_provider}
                onValueChange={(value: "MOCK" | "ASAAS_SANDBOX") =>
                  setSchoolForm({ ...schoolForm, payment_provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOCK">MOCK (Teste)</SelectItem>
                  <SelectItem value="ASAAS_SANDBOX">ASAAS Sandbox</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha o provedor de pagamentos para cobranças
              </p>
            </div>
            <Button
              onClick={school ? handleUpdateSchool : handleCreateSchool}
              className="gradient-xpace"
            >
              {school ? "Atualizar Escola" : "Criar Escola"}
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações WhatsApp</CardTitle>
            <CardDescription>
              Configure lembretes automáticos por WhatsApp para alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Lembrete de Aula (1h antes)</h4>
                <p className="text-sm text-muted-foreground">
                  Envio automático 1 hora antes da aula começar
                </p>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
                Ativo
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Pagamento Atrasado</h4>
                <p className="text-sm text-muted-foreground">
                  Lembrete quando pagamento está vencido há mais de 5 dias
                </p>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
                Ativo
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Confirmação de Matrícula</h4>
                <p className="text-sm text-muted-foreground">
                  Mensagem de boas-vindas ao matricular novo aluno
                </p>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium">
                Ativo
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Nota:</strong> As mensagens WhatsApp são enviadas automaticamente. 
                Para configurar API do WhatsApp (Twilio/Evolution), entre em contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
