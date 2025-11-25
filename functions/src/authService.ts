
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Atualiza o documento de um usuário no Firestore com seu ID de cliente Asaas.
 * @param uid O ID do usuário no Firebase Authentication.
 * @param asaasCustomerId O ID do cliente gerado pelo Asaas.
 * @returns Uma promessa que é resolvida quando a atualização é concluída.
 */
export const updateUserAsaasId = async (uid: string, asaasCustomerId: string): Promise<void> => {
  // A referência para o documento do usuário. 
  // Estou assumindo que você tem uma coleção 'users' e o ID do documento é o UID do usuário.
  const userDocRef = db.collection('users').doc(uid);

  try {
    await userDocRef.update({
      asaasCustomerId: asaasCustomerId,
    });
    console.log(`Usuário ${uid} atualizado com o ID Asaas ${asaasCustomerId}.`);
  } catch (error) {
    console.error(`Falha ao atualizar o usuário ${uid} com o ID do Asaas.`, error);
    // Propaga o erro para que a função que o chamou possa lidar com ele.
    throw new Error("Não foi possível salvar o ID do cliente Asaas no perfil do usuário.");
  }
};
