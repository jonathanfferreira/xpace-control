import { IPaymentProvider, PaymentCharge, PaymentStatus } from './types';

export class AsaasSandboxProvider implements IPaymentProvider {
  private readonly baseUrl = 'https://sandbox.asaas.com/api/v3';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    // In sandbox mode, use a placeholder key if not provided
    this.apiKey = apiKey || 'SANDBOX_KEY_PLACEHOLDER';
  }

  async criarCobranca(
    studentId: string,
    valor: number,
    vencimento: string,
    descricao?: string
  ): Promise<PaymentCharge> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // This is a mock implementation for sandbox
    // In production, you would make actual API calls to Asaas
    const charge: PaymentCharge = {
      id: `ASAAS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customer: studentId,
      value: valor,
      dueDate: vencimento,
      description: descricao,
      externalReference: `asaas_sandbox_${Date.now()}`,
    };

    console.log('[ASAAS SANDBOX] Cobrança criada (simulado):', charge);
    console.log('[ASAAS SANDBOX] URL da API:', this.baseUrl);
    
    // In a real implementation, you would:
    // const response = await fetch(`${this.baseUrl}/payments`, {
    //   method: 'POST',
    //   headers: {
    //     'access_token': this.apiKey,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     customer: studentId,
    //     billingType: 'PIX',
    //     value: valor,
    //     dueDate: vencimento,
    //     description: descricao,
    //   }),
    // });

    return charge;
  }

  async obterStatus(referencia: string): Promise<PaymentStatus> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const status: PaymentStatus = {
      id: referencia,
      status: 'pending',
    };

    console.log('[ASAAS SANDBOX] Status obtido (simulado):', status);
    return status;
  }

  async marcarPago(
    referencia: string,
    dataPagamento: string,
    metodoPagamento: string
  ): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));

    console.log('[ASAAS SANDBOX] Pagamento marcado (simulado):', {
      referencia,
      dataPagamento,
      metodoPagamento,
    });
  }
}
