export type PaymentProvider = 'MOCK' | 'ASAAS_SANDBOX';

export interface PaymentCharge {
  id: string;
  customer: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: string;
}

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
