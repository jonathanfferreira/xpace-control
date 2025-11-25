
import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const AsaasTestPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('100.00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const functions = getFunctions();

  const handleCreateCustomer = async () => {
    if (!userId) {
      toast({ title: 'Erro', description: 'Por favor, insira um User ID.' });
      return;
    }
    setLoading(true);
    try {
      const createCustomer = httpsCallable(functions, 'createAsaasCustomer');
      const result = await createCustomer({ userId });
      toast({ title: 'Sucesso', description: `Cliente criado no Asaas com ID: ${result.data.customerId}` });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao criar cliente', description: error.message });
    }
    setLoading(false);
  };

  const handleCreatePayment = async () => {
    if (!userId || !amount) {
      toast({ title: 'Erro', description: 'Por favor, insira um User ID e um valor.' });
      return;
    }
    setLoading(true);
    try {
      const createPayment = httpsCallable(functions, 'createAsaasPayment');
      const result = await createPayment({ userId, amount: parseFloat(amount) });
      const paymentDetails = result.data.paymentDetails as any;
      toast({ title: 'Sucesso', description: `Pagamento criado. Link: ${paymentDetails.invoiceUrl}` });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao criar pagamento', description: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Teste - Integração Asaas</h1>
      <div className="space-y-4 max-w-md">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700">User ID</label>
          <Input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Insira o UID do usuário do Firebase"
          />
        </div>
        <Button onClick={handleCreateCustomer} disabled={loading}>
          {loading ? 'Criando...' : '1. Criar Cliente no Asaas'}
        </Button>
        <hr />
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor da Cobrança (R$)</label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button onClick={handleCreatePayment} disabled={loading}>
          {loading ? 'Criando...' : '2. Criar Cobrança para Cliente'}
        </Button>
      </div>
    </div>
  );
};

export default AsaasTestPage;
