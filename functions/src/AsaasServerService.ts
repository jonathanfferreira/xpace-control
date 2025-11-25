
import axios from "axios";
import * as functions from "firebase-functions";

// Acessa a chave de API de forma segura através das configs do Firebase
const ASAAS_API_KEY = functions.config().asaas.key;

// Define a URL da API (usando sandbox para desenvolvimento)
const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";

if (!ASAAS_API_KEY) {
  throw new Error("A chave de API do Asaas não está configurada. Rode 'firebase functions:config:set asaas.key=SUA_CHAVE' para configurar.");
}

const asaasApi = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    "Content-Type": "application/json",
    "access_token": ASAAS_API_KEY,
  },
});

interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj: string;
}

interface AsaasCharge {
    customer: string; // ID do cliente Asaas
    billingType: "BOLETO" | "PIX";
    value: number;
    dueDate: string; // Formato YYYY-MM-DD
    description: string;
}

/**
 * Cria um novo cliente no Asaas.
 * @param customerData - Dados do cliente a ser criado.
 * @returns O objeto do cliente criado no Asaas.
 */
export const createAsaasCustomer = async (customerData: AsaasCustomer) => {
  try {
    const response = await asaasApi.post("/customers", customerData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cliente no Asaas:", error.response?.data);
    throw new Error("Falha ao criar cliente no Asaas.");
  }
};

/**
 * Cria uma nova cobrança (Boleto ou Pix) para um cliente.
 * @param chargeData - Dados da cobrança a ser criada.
 * @returns O objeto da cobrança criada no Asaas.
 */
export const createAsaasCharge = async (chargeData: AsaasCharge) => {
  try {
    const response = await asaasApi.post("/payments", chargeData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cobrança no Asaas:", error.response?.data);
    throw new Error("Falha ao criar cobrança no Asaas.");
  }
};
