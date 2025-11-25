
import axios, { AxiosInstance } from "axios";
import * as admin from 'firebase-admin';

// Tipos de dados da Asaas (poderiam ser movidos para um arquivo de tipos)
interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
}

interface AsaasChargeData {
    customer: string; // ID do cliente Asaas
    billingType: "BOLETO" | "PIX";
    value: number;
    dueDate: string; // Formato YYYY-MM-DD
    description: string;
}

/**
 * Classe para gerenciar interações com a API da Asaas.
 * Encapsula a criação de clientes e cobranças.
 */
export class AsaasServerService {
  private api: AxiosInstance;
  private firestore: admin.firestore.Firestore;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("A chave de API da Asaas é obrigatória.");
    }

    this.api = axios.create({
      baseURL: "https://sandbox.asaas.com/api/v3",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
    });

    this.firestore = admin.firestore();
  }

  /**
   * Cria um novo cliente no Asaas e armazena o ID no Firestore.
   * @param studentData - Dados do aluno para criar o cliente.
   * @returns O ID do cliente Asaas.
   */
  private async getOrCreateCustomer(studentData: any): Promise<string> {
    // 1. Verifica se o aluno já tem um asaasCustomerId no Firestore
    const userRef = this.firestore.collection('users').doc(studentData.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (userData?.asaasCustomerId) {
      console.log(`Cliente Asaas já existe para o usuário ${studentData.uid}: ${userData.asaasCustomerId}`);
      return userData.asaasCustomerId;
    }

    // 2. Se não tiver, cria um novo cliente na Asaas
    console.log(`Criando novo cliente Asaas para o usuário ${studentData.uid}`);
    const customerPayload: AsaasCustomerData = {
      name: studentData.name,
      email: studentData.email,
      cpfCnpj: studentData.cpf, // Assumindo que o CPF está nos dados do aluno
    };

    try {
      const response = await this.api.post("/customers", customerPayload);
      const customerId = response.data.id;

      // 3. Salva o ID do cliente no perfil do usuário no Firestore
      await userRef.update({ asaasCustomerId: customerId });
      console.log(`Cliente Asaas ${customerId} criado e salvo para o usuário ${studentData.uid}`);

      return customerId;
    } catch (error: any) {
      console.error("Erro detalhado ao criar cliente no Asaas:", error.response?.data);
      throw new Error("Falha ao criar cliente na Asaas.");
    }
  }

  /**
   * Cria uma nova cobrança (Boleto ou Pix) para um cliente.
   * @param studentData - Dados do aluno (para encontrar ou criar o cliente Asaas).
   * @param planData - Dados do plano (para detalhes da cobrança).
   * @returns O objeto da cobrança criada no Asaas.
   */
  public async createCharge(studentData: any, planData: any): Promise<any> {
    // Garante que temos um cliente na Asaas
    const customerId = await this.getOrCreateCustomer(studentData);

    // Monta o payload da cobrança
    const chargePayload: AsaasChargeData = {
      customer: customerId,
      billingType: planData.billingType || "PIX", // Default para PIX se não especificado
      value: planData.price,
      dueDate: new Date().toISOString().split('T')[0], // Hoje
      description: `Pagamento referente ao plano ${planData.name}`,
    };

    try {
      const response = await this.api.post("/payments", chargePayload);
      console.log(`Cobrança criada com sucesso: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error("Erro detalhado ao criar cobrança no Asaas:", error.response?.data);
      throw new Error("Falha ao criar cobrança na Asaas.");
    }
  }
}
