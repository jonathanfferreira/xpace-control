
import axios from 'axios';
import { PaymentProvider } from './types';
import { UserProfile } from '@/integrations/firebase/types';

/**
 * Server-side implementation for the Asaas payment gateway.
 * This code is intended to run in a secure environment (e.g., Firebase Functions)
 * and requires the ASAAS_API_KEY environment variable to be set.
 */
export class AsaasServerService implements PaymentProvider {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY environment variable is not set.');
    }
    // Use a sandbox URL for development, switch to production URL when ready
    this.apiBaseUrl = 'https://sandbox.asaas.com/api/v3'; 
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
    };
  }

  /**
   * Creates a new customer in Asaas from a user profile.
   */
  async createCustomer(user: UserProfile): Promise<{ customerId: string }> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/customers`,
        {
          name: user.displayName,
          email: user.email,
          externalReference: user.uid, // Link Asaas customer to our Firebase user
        },
        { headers: this.getHeaders() }
      );
      return { customerId: response.data.id };
    } catch (error) {
      console.error('Error creating Asaas customer:', error);
      throw new Error('Failed to create customer in payment gateway.');
    }
  }

  /**
   * Creates a new single payment (boleto or Pix) for a customer.
   */
  async createPayment(customerId: string, amount: number): Promise<{ paymentId: string; invoiceUrl: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/payments`,
        {
          customer: customerId,
          billingType: 'UNDEFINED', // Allows customer to choose Pix or Boleto
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // 7 days from now
          value: amount,
          description: 'Mensalidade XPACE OS',
        },
        { headers: this}        );

      return {
        paymentId: response.data.id,
        invoiceUrl: response.data.invoiceUrl,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Error creating Asaas payment:', error);
      throw new Error('Failed to create payment in payment gateway.');
    }
  }
}
