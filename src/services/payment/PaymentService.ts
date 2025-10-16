import { IPaymentProvider, PaymentProvider } from './types';
import { MockProvider } from './MockProvider';
import { AsaasSandboxProvider } from './AsaasSandboxProvider';

export class PaymentService {
  private provider: IPaymentProvider;

  constructor(providerType: PaymentProvider = 'MOCK', apiKey?: string) {
    switch (providerType) {
      case 'ASAAS_SANDBOX':
        this.provider = new AsaasSandboxProvider(apiKey);
        break;
      case 'MOCK':
      default:
        this.provider = new MockProvider();
        break;
    }
  }

  async criarCobranca(
    studentId: string,
    valor: number,
    vencimento: string,
    descricao?: string
  ) {
    return this.provider.criarCobranca(studentId, valor, vencimento, descricao);
  }

  async obterStatus(referencia: string) {
    return this.provider.obterStatus(referencia);
  }

  async marcarPago(
    referencia: string,
    dataPagamento: string,
    metodoPagamento: string
  ) {
    return this.provider.marcarPago(referencia, dataPagamento, metodoPagamento);
  }
}
