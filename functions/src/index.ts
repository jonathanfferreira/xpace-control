
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
// Importa o 'defineSecret' para acessar o Google Secret Manager
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

import { inviteStaffMember } from './authService';
import { AsaasServerService } from './AsaasServerService';

// Define o secret que armazenamos no passo anterior.
// A Cloud Function agora sabe que precisa de acesso a este segredo para ser implantada.
const asaasApiKey = defineSecret('ASAAS_API_KEY');

// ====================================================================
// 1. FUNÇÃO DE CONVITE DE STAFF (Callable)
// ====================================================================
export const inviteStaff = onCall(async (request) => {
    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem convidar novos membros.');
    }
    const { email, role, schoolId } = request.data;
    if (!email || !role || !schoolId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltam dados essenciais (email, role, schoolId).');
    }
    try {
        const result = await inviteStaffMember(email, role, schoolId);
        return { success: true, message: `Usuário ${email} convidado com a função de ${role}.`, uid: result.uid };
    } catch (error: any) {
        console.error("Erro ao convidar membro:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Ocorreu um erro interno ao processar o convite.');
    }
});

// ====================================================================
// 2. FUNÇÃO DE CRIAÇÃO DE COBRANÇA NA ASAAS (Callable)
// ====================================================================
// Adicionamos a opção { secrets: [asaasApiKey] } para dar à função acesso ao segredo.
export const createAsaasCharge = onCall({ secrets: [asaasApiKey] }, async (request) => {
    // Validação de autenticação
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Você precisa estar logado para criar uma cobrança.');
    }

    // Validação de dados
    const { studentData, planData } = request.data;
    if (!studentData || !planData) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados do aluno ou do plano ausentes.');
    }

    try {
        // Acessamos o valor do segredo de forma segura com .value()
        const apiKey = asaasApiKey.value();

        if (!apiKey) {
            // Esta verificação agora é uma camada extra de segurança.
            // O deploy já falharia se o segredo não fosse encontrado.
            console.error("Erro Crítico: O segredo ASAAS_API_KEY não está disponível.");
            throw new functions.https.HttpsError('internal', 'Erro de configuração do servidor. Contate o administrador.');
        }

        const asaasService = new AsaasServerService(apiKey);
        const charge = await asaasService.createCharge(studentData, planData);
        return { success: true, charge };
    } catch (error: any) {
        console.error("Erro ao criar cobrança na Asaas:", error);
        // Evita expor detalhes do erro para o cliente.
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Falha ao gerar cobrança na Asaas.');
    }
});

// ====================================================================
// 3. WEBHOOK DA ASAAS (HTTP Trigger)
// ====================================================================

// Ainda não implementado.
