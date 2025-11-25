/**
 * Defines the available payment provider types.
 */
export type PaymentProvider = 'MOCK' | 'ASAAS_SANDBOX' | 'ASAAS_PRODUCTION';

/**
 * Represents the structure of a payment charge.
 */
export interface PaymentCharge {
  id: string;
  customer: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

/**
 * Represents the status of a payment.
 */
export interface PaymentStatus {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'overdue';
}

/**
 * Interface for a generic payment provider.
 * This allows swapping payment gateways without changing core application logic.
 */
export interface IPaymentProvider {
  criarCobranca(
    studentId: string,
    valor: number,
    vencimento: string,
    descricao?: string
  ): Promise<PaymentCharge>;

  obterStatus(referencia: string): Promise<PaymentStatus>;

  marcarPago(
    referencia: string,
    dataPagamento: string,
    metodoPagamento: string
  ): Promise<void>;
}
