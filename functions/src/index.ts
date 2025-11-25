
import * as functions from "firebase-functions";
import { createAsaasCustomer, createAsaasCharge } from "./AsaasServerService";
import { updateUserAsaasId } from "./authService";
import { initializeApp } from "firebase-admin/app";

// Garante que o app do Firebase seja inicializado apenas uma vez.
if (getApps().length === 0) {
    initializeApp();
}

// Roda as funções na região de São Paulo para menor latência.
const regionalFunctions = functions.region("southamerica-east1");

/**
 * Sincroniza um usuário do Firebase com o Asaas, criando um cliente.
 */
export const syncUserWithAsaas = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const { uid, name, email, cpfCnpj } = data;
  if (!uid || !name || !email || !cpfCnpj) {
    throw new functions.https.HttpsError("invalid-argument", "Dados incompletos para sincronização.");
  }

  try {
    const asaasCustomer = await createAsaasCustomer({ name, email, cpfCnpj });
    await updateUserAsaasId(uid, asaasCustomer.id);

    return { status: "success", customerId: asaasCustomer.id };
  } catch (error: any) {
    console.error("Erro ao sincronizar usuário com Asaas:", error);
    throw new functions.https.HttpsError("internal", "Falha na sincronização com Asaas.", error.message);
  }
});

/**
 * Cria uma nova cobrança no Asaas para um cliente já existente.
 */
export const createChargeForCustomer = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado.");
  }

  const { customerId, value, dueDate, description, billingType } = data;
  if (!customerId || !value || !dueDate || !billingType) {
    throw new functions.https.HttpsError("invalid-argument", "Dados incompletos para criar cobrança.");
  }

  try {
    const chargeResponse = await createAsaasCharge({
      customer: customerId,
      billingType: billingType,
      value: value,
      dueDate: dueDate,
      description: description || "Cobrança XPACE OS"
    });

    return { status: "success", charge: chargeResponse };
  } catch (error: any) {
    console.error("Erro ao criar cobrança no Asaas:", error);
    throw new functions.https.HttpsError("internal", "Falha ao criar cobrança.", error.message);
  }
});
