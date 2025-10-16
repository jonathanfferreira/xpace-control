import { IPaymentProvider, PaymentCharge, PaymentStatus } from './types';

export class MockProvider implements IPaymentProvider {
  async criarCobranca(
    studentId: string,
    valor: number,
    vencimento: string,
    descricao?: string
  ): Promise<PaymentCharge> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const charge: PaymentCharge = {
      id: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customer: studentId,
      value: valor,
      dueDate: vencimento,
      description: descricao,
      externalReference: `mock_ref_${Date.now()}`,
    };

    console.log('[MOCK] Cobrança criada:', charge);
    return charge;
  }

  async obterStatus(referencia: string): Promise<PaymentStatus> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const status: PaymentStatus = {
      id: referencia,
      status: 'pending',
    };

    console.log('[MOCK] Status obtido:', status);
    return status;
  }

  async marcarPago(
    referencia: string,
    dataPagamento: string,
    metodoPagamento: string
  ): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    console.log('[MOCK] Pagamento marcado:', {
      referencia,
      dataPagamento,
      metodoPagamento,
    });
  }
}
