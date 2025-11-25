
import { UserProfile } from '../../src/integrations/firebase/types';

export interface PaymentProvider {
  createCustomer: (user: UserProfile) => Promise<{ customerId: string }>;
  createPayment: (customerId: string, amount: number) => Promise<{ paymentId: string; invoiceUrl: string; status: string }>;
}
