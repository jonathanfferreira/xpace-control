"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsaasCharge = exports.inviteStaff = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions"); // <-- ADICIONADO
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
// Importando os serviços que vamos usar
const authService_1 = require("./authService");
// CORREÇÃO: O nome da classe importada deve ser o mesmo do arquivo.
const AsaasServerService_1 = require("./AsaasServerService"); // <-- CORRIGIDO
// ====================================================================
// 1. FUNÇÃO DE CONVITE DE STAFF (Callable)
// ====================================================================
exports.inviteStaff = (0, https_1.onCall)(async (request) => {
    if (!request.auth || request.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem convidar novos membros.');
    }
    const { email, role, schoolId } = request.data;
    if (!email || !role || !schoolId) {
        throw new functions.https.HttpsError('invalid-argument', 'Faltam dados essenciais (email, role, schoolId).');
    }
    try {
        const result = await (0, authService_1.inviteStaffMember)(email, role, schoolId);
        return { success: true, message: `Usuário ${email} convidado com a função de ${role}.`, uid: result.uid };
    }
    catch (error) {
        console.error("Erro ao convidar membro:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Ocorreu um erro interno ao processar o convite.');
    }
});
// ====================================================================
// 2. FUNÇÃO DE CRIAÇÃO DE COBRANÇA NA ASAAS (Callable)
// ====================================================================
// Inicializa o serviço da Asaas com a chave de API
const asaasService = new AsaasServerService_1.AsaasServerService(process.env.ASAAS_API_KEY || ''); // <-- CORRIGIDO
exports.createAsaasCharge = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Você precisa estar logado para criar uma cobrança.');
    }
    const { studentData, planData } = request.data;
    if (!studentData || !planData) {
        throw new functions.https.HttpsError('invalid-argument', 'Dados do aluno ou do plano ausentes.');
    }
    try {
        const charge = await asaasService.createCharge(studentData, planData);
        return { success: true, charge };
    }
    catch (error) {
        console.error("Erro ao criar cobrança na Asaas:", error);
        throw new functions.https.HttpsError('internal', 'Falha ao gerar cobrança na Asaas.');
    }
});
// ====================================================================
// 3. WEBHOOK DA ASAAS (HTTP Trigger)
// ====================================================================
// Ainda não implementado.
//# sourceMappingURL=index.js.map