import { IPaymentProvider, PaymentCharge, PaymentStatus } from './types';

export class AsaasProductionProvider implements IPaymentProvider {
  private readonly baseUrl = 'https://api.asaas.com/v3';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error('Asaas production API key is required.');
    }
    this.apiKey = apiKey;
  }

  async criarCobranca(
    studentId: string,
    valor: number,
    vencimento: string,
    descricao?: string
  ): Promise<PaymentCharge> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: studentId,
        billingType: 'PIX', // ou outro tipo, pode ser configurável
        value: valor,
        dueDate: vencimento,
        description: descricao,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Asaas API error:', errorData);
      throw new Error('Failed to create Asaas charge.');
    }

    const data = await response.json();

    return {
      id: data.id,
      customer: data.customer,
      value: data.value,
      dueDate: data.dueDate,
      description: data.description,
      externalReference: data.externalReference,
    };
  }

  async obterStatus(referencia: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/payments/${referencia}/status`, {
      headers: {
        'access_token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Asaas charge status.');
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status,
    };
  }

  async marcarPago(
    referencia: string,
    dataPagamento: string,
    metodoPagamento: string
  ): Promise<void> {
    // A API da Asaas geralmente atualiza o status automaticamente via webhooks.
    // Esta função pode não ser necessária ou pode ter uma implementação diferente
    // dependendo do fluxo exato.
    console.log(`Cobranca ${referencia} paga em ${dataPagamento} via ${metodoPagamento}. Status será atualizado via webhook.`);
  }
}
