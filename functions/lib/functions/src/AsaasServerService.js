"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsaasCharge = exports.createAsaasCustomer = void 0;
const axios_1 = require("axios");
const functions = require("firebase-functions");
// Acessa a chave de API de forma segura através das configs do Firebase
const ASAAS_API_KEY = functions.config().asaas.key;
// Define a URL da API (usando sandbox para desenvolvimento)
const ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";
if (!ASAAS_API_KEY) {
    throw new Error("A chave de API do Asaas não está configurada. Rode 'firebase functions:config:set asaas.key=SUA_CHAVE' para configurar.");
}
const asaasApi = axios_1.default.create({
    baseURL: ASAAS_API_URL,
    headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
    },
});
/**
 * Cria um novo cliente no Asaas.
 * @param customerData - Dados do cliente a ser criado.
 * @returns O objeto do cliente criado no Asaas.
 */
const createAsaasCustomer = async (customerData) => {
    var _a;
    try {
        const response = await asaasApi.post("/customers", customerData);
        return response.data;
    }
    catch (error) {
        console.error("Erro ao criar cliente no Asaas:", (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
        throw new Error("Falha ao criar cliente no Asaas.");
    }
};
exports.createAsaasCustomer = createAsaasCustomer;
/**
 * Cria uma nova cobrança (Boleto ou Pix) para um cliente.
 * @param chargeData - Dados da cobrança a ser criada.
 * @returns O objeto da cobrança criada no Asaas.
 */
const createAsaasCharge = async (chargeData) => {
    var _a;
    try {
        const response = await asaasApi.post("/payments", chargeData);
        return response.data;
    }
    catch (error) {
        console.error("Erro ao criar cobrança no Asaas:", (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
        throw new Error("Falha ao criar cobrança no Asaas.");
    }
};
exports.createAsaasCharge = createAsaasCharge;
//# sourceMappingURL=AsaasServerService.js.map