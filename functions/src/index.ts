
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

admin.initializeApp();

import { inviteStaffMember } from './authService';
import { AsaasServerService } from './AsaasServerService';

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
export const createAsaasCharge = onCall(async (request) => {
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
        // CORREÇÃO DEFINITIVA:
        // 1. Buscamos a chave da API a partir da configuração de runtime do Firebase.
        // 2. Verificamos se a chave existe ANTES de instanciar o serviço.
        //    Durante a análise do deploy, `functions.config().asaas` pode não existir,
        //    então esta verificação impede que o construtor seja chamado e lance um erro.
        const apiKey = functions.config().asaas?.key;

        if (!apiKey) {
            // Se a chave não estiver configurada, a função falhará em tempo de execução,
            // mas o deploy não será interrompido.
            console.error("Erro Crítico: A chave da API da Asaas não foi encontrada na configuração do Firebase.");
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
