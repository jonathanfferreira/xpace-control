import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { doc, getDoc, updateDoc, query, where, collection, getDocs } from "firebase/firestore";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
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
    if (user) {
      fetchData();
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileDocRef = doc(db, "profiles", user.uid);
      const profileDoc = await getDoc(profileDocRef);
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfileForm({ full_name: data.full_name || "", phone: data.phone || "" });
      }

      const schoolQuery = query(collection(db, "schools"), where("admin_id", "==", user.uid));
      const schoolSnapshot = await getDocs(schoolQuery);
      if (!schoolSnapshot.empty) {
        const schoolData = schoolSnapshot.docs[0].data();
        const schoolId = schoolSnapshot.docs[0].id;
        setSchoolId(schoolId);
        setSchoolForm({
          name: schoolData.name || "",
          primary_color: schoolData.primary_color || "#6324b2",
          payment_provider: schoolData.payment_provider || "MOCK",
        });
      } else {
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchool = async () => {
    if (!schoolId) return;
    try {
      await updateDoc(doc(db, "schools", schoolId), schoolForm);
      toast.success("Escola atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar escola: " + error.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "profiles", user.uid), profileForm);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} placeholder="Nome Completo" />
            <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="Telefone" />
            <Button onClick={handleUpdateProfile}>Salvar Perfil</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Escola</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={schoolForm.name} onChange={e => setSchoolForm({...schoolForm, name: e.target.value})} placeholder="Nome da Escola" />
            <Input type="color" value={schoolForm.primary_color} onChange={e => setSchoolForm({...schoolForm, primary_color: e.target.value})} />
            <Select value={schoolForm.payment_provider} onValueChange={(v: "MOCK" | "ASAAS_SANDBOX") => setSchoolForm({...schoolForm, payment_provider: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MOCK">MOCK</SelectItem>
                <SelectItem value="ASAAS_SANDBOX">ASAAS Sandbox</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleUpdateSchool}>Salvar Configurações da Escola</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
