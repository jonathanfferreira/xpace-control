
import { UserProfile } from "@/integrations/firebase/types";

/**
 * Interface for a generic payment provider.
 * This allows us to swap payment gateways (e.g., Asaas, Stripe) in the future
 * without changing the core application logic.
 */
export interface PaymentProvider {
  createCustomer: (user: UserProfile) => Promise<{ customerId: string }>;
  createPayment: (customerId: string, amount: number) => Promise<{ paymentId: string; invoiceUrl: string; status: string }>;
}
