
/**
 * Defines the core data structures for Firestore.
 */

/**
 * Represents the user profile stored in the "users" collection.
 * It links the Firebase Auth user with application-specific data,
 * including their role and financial integration ID.
 */
export interface UserProfile {
  uid: string; // Firebase Auth User ID
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "admin" | "student" | "teacher" | "guardian";
  asaasCustomerId?: string; // ID do cliente no gateway de pagamento Asaas
}

/**
 * Represents a single payment charge or a recurring subscription
 * stored in the "subscriptions" sub-collection for a user.
 */
export interface Subscription {
  id: string; // Document ID in Firestore
  userId: string; // UID of the user this subscription belongs to
  asaasSubscriptionId?: string; // ID da assinatura recorrente no Asaas
  asaasPaymentId?: string; // ID de uma cobrança avulsa no Asaas
  status: "PENDING" | "CONFIRMED" | "OVERDUE" | "INACTIVE";
  dueDate: Date; // Vencimento da cobrança
  value: number;
  paymentLink?: string; // Link para o boleto ou QR Code Pix
  createdAt: Date;
  updatedAt: Date;
}
