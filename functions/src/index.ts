
import * as functions from "firebase-functions";
import { createAsaasCustomer, createAsaasCharge } from "./AsaasServerService";
import { updateUserAsaasId } from "./authService"; // Supondo que você tenha um serviço para interagir com o Firestore

// Importe o Vertex AI
import { VertexAI } from "@google-cloud/vertexai";


// É uma boa prática inicializar o app do Firebase, caso ainda não tenha feito em outro lugar
import { initializeApp } from "firebase-admin/app";
initializeApp();


// Roda a função na região de São Paulo
const regionalFunctions = functions.region("southamerica-east1");

// Inicialize o Vertex AI
const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });
const generativeModel = vertexAI.getGenerativeModel({ model: "gemini-1.0-pro" });


/**
 * Função HTTP para criar um cliente no Asaas, associá-lo a um usuário no Firestore
 * e, opcionalmente, criar uma cobrança inicial.
 */
export const createAsaasCustomerAndCharge = regionalFunctions.https.onCall(async (data, context) => {
  // 1. Validação de Autenticação: Garante que apenas usuários autenticados e admins podem chamar a função
  if (!context.auth || !context.auth.token.isAdmin) { // Supondo que você tenha um custom claim isAdmin
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Apenas administradores autenticados podem realizar esta operação."
    );
  }

  // 2. Validação dos Dados de Entrada
  const { user, chargeDetails } = data;
  if (!user || !user.uid || !user.name || !user.email || !user.cpfCnpj) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados do usuário incompletos. 'uid', 'name', 'email' e 'cpfCnpj' são obrigatórios."
    );
  }

  try {
    // 3. Cria o Cliente no Asaas
    const asaasCustomer = await createAsaasCustomer({
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
    });

    // 4. Salva o ID do Cliente Asaas no Perfil do Usuário no Firestore
    const customerId = asaasCustomer.id;
    await updateUserAsaasId(user.uid, customerId);

    let chargeResponse = null;
    // 5. (Opcional) Cria uma Cobrança Inicial se os detalhes foram fornecidos
    if (chargeDetails && chargeDetails.value > 0) {
        chargeResponse = await createAsaasCharge({
            customer: customerId,
            billingType: chargeDetails.billingType || "PIX",
            value: chargeDetails.value,
            dueDate: chargeDetails.dueDate, 
            description: chargeDetails.description || "Cobrança inicial XPACE OS"
        });
    }

    // 6. Retorna o sucesso da operação
    return {
      status: "success",
      message: "Cliente Asaas criado e vinculado com sucesso!",
      customerId: customerId,
      charge: chargeResponse
    };

  } catch (error) {
    console.error("Erro na função createAsaasCustomerAndCharge:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Ocorreu um erro interno ao processar a solicitação com o Asaas.",
      error.message
    );
  }
});


/**
 * Gera 3 mensagens de cobrança (Formal, Amigável, Urgente) usando a API do Gemini.
 */
export const generateBillingMessages = regionalFunctions.https.onCall(async (data, context) => {
  // 1. Validação de Autenticação
  if (!context.auth || !context.auth.token.isAdmin) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Apenas administradores autenticados podem gerar mensagens."
    );
  }

  // 2. Validação dos Dados de Entrada
  const { studentName, debtAmount, dueDate } = data;
  if (!studentName || !debtAmount || !dueDate) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados da dívida incompletos. 'studentName', 'debtAmount' e 'dueDate' são obrigatórios."
    );
  }

  // 3. Montagem do Prompt para o Gemini
  const prompt = `
    Você é um assistente financeiro para uma escola de dança chamada "XPACE OS".
    Sua tarefa é criar 3 mensagens de cobrança para enviar via WhatsApp para um aluno inadimplente.
    Retorne a resposta EXATAMENTE no formato JSON, com as chaves "formal", "friendly" e "urgent".

    Dados da cobrança:
    - Nome do Aluno: ${studentName}
    - Valor da Dívida: R$ ${debtAmount.toFixed(2)}
    - Data de Vencimento: ${dueDate}

    Estilo das mensagens:
    - Formal: Use uma linguagem respeitosa e direta.
    - Friendly: Use uma abordagem mais casual e amigável, como se fosse um lembrete.
    - Urgente: Use um tom mais incisivo, enfatizando a necessidade de regularização imediata.
  `;

  // 4. Chamada para a API do Gemini
  try {
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Limpa e faz o parse da resposta JSON que o Gemini retorna
    const jsonResponse = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
    
    return jsonResponse;

  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Falha ao se comunicar com o serviço de IA."
    );
  }
});
