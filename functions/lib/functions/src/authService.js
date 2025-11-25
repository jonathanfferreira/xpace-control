"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserAsaasId = void 0;
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * Atualiza o documento de um usuário no Firestore com seu ID de cliente Asaas.
 * @param uid O ID do usuário no Firebase Authentication.
 * @param asaasCustomerId O ID do cliente gerado pelo Asaas.
 * @returns Uma promessa que é resolvida quando a atualização é concluída.
 */
const updateUserAsaasId = async (uid, asaasCustomerId) => {
    // A referência para o documento do usuário. 
    // Estou assumindo que você tem uma coleção 'users' e o ID do documento é o UID do usuário.
    const userDocRef = db.collection('users').doc(uid);
    try {
        await userDocRef.update({
            asaasCustomerId: asaasCustomerId,
        });
        console.log(`Usuário ${uid} atualizado com o ID Asaas ${asaasCustomerId}.`);
    }
    catch (error) {
        console.error(`Falha ao atualizar o usuário ${uid} com o ID do Asaas.`, error);
        // Propaga o erro para que a função que o chamou possa lidar com ele.
        throw new Error("Não foi possível salvar o ID do cliente Asaas no perfil do usuário.");
    }
};
exports.updateUserAsaasId = updateUserAsaasId;
//# sourceMappingURL=authService.js.map