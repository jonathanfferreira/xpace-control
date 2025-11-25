
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

// Supondo que o perfil do usuário venha como prop
interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  asaasCustomerId?: string;
}

interface AsaasOnboardingProps {
  user: UserProfile;
}

export const AsaasOnboarding = ({ user }: AsaasOnboardingProps) => {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [chargeValue, setChargeValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Se o usuário já tem um ID do Asaas, não mostramos o formulário de onboarding.
  if (user.asaasCustomerId) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Aluno Sincronizado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">Este aluno já está sincronizado com o Asaas.</p>
          <p className="text-sm text-gray-600 mt-2">Asaas Customer ID: {user.asaasCustomerId}</p>
        </CardContent>
      </Card>
    );
  }

  const handleAsaasOnboarding = async () => {
    if (!cpfCnpj || !chargeValue) {
      toast.error("Por favor, preencha o CPF/CNPJ e o valor da cobrança.");
      return;
    }

    setIsLoading(true);
    const functions = getFunctions();
    const createAsaasCustomer = httpsCallable(functions, "createAsaasCustomerAndCharge");

    try {
      const result = await createAsaasCustomer({
        user: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          cpfCnpj: cpfCnpj,
        },
        chargeDetails: {
          value: parseFloat(chargeValue),
          billingType: "PIX", // Poderia ser uma opção no formulário
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split("T")[0], // Vencimento em 5 dias
          description: `Mensalidade inicial - ${user.displayName}`
        }
      });

      toast.success("Aluno sincronizado com o Asaas com sucesso!");
      // Aqui você precisaria atualizar o estado local do usuário para refletir o novo asaasCustomerId
      // Por exemplo, chamando uma função para recarregar os dados da página.
      console.log(result.data);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao sincronizar com o Asaas.", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronizar com Asaas</CardTitle>
        <CardDescription>
          Para começar a cobrar este aluno, insira os dados abaixo para criá-lo como um cliente no Asaas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="cpfCnpj">CPF/CNPJ do Aluno</label>
          <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div className="space-y-2">
          <label htmlFor="chargeValue">Valor da 1ª Mensalidade (R$)</label>
          <Input id="chargeValue" type="number" value={chargeValue} onChange={(e) => setChargeValue(e.target.value)} placeholder="150.00" />
        </div>
        <Button onClick={handleAsaasOnboarding} disabled={isLoading} className="w-full">
          {isLoading ? "Sincronizando..." : "Ativar Cobrança no Asaas"}
        </Button>
      </CardContent>
    </Card>
  );
};
