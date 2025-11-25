
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/integrations/firebase/client';

const createAsaasCustomerFunction = httpsCallable(functions, 'createAsaasCustomer');
const createAsaasChargeFunction = httpsCallable(functions, 'createAsaasCharge');

interface CreateChargeData {
  customerId: string;
  value: number;
  dueDate: string; // Format: YYYY-MM-DD
  description?: string;
  billingType?: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
}

/**
 * Triggers the Firebase Function to create an Asaas customer for a given user.
 */
export const triggerCreateAsaasCustomer = async (uid: string): Promise<any> => {
  try {
    const result = await createAsaasCustomerFunction({ uid });
    return result.data;
  } catch (error) {
    console.error("Error calling createAsaasCustomer function:", error);
    throw new Error("Failed to create Asaas customer.");
  }
};

/**
 * Triggers the Firebase Function to create a new charge for an Asaas customer.
 */
export const triggerCreateAsaasCharge = async (data: CreateChargeData): Promise<any> => {
  try {
    const result = await createAsaasChargeFunction(data);
    return result.data;
  } catch (error) {
    console.error("Error calling createAsaasCharge function:", error);
    throw new Error("Failed to create Asaas charge.");
  }
};
