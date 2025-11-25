
import * as admin from 'firebase-admin';

/**
 * Convida um novo membro da equipe (Staff) para a plataforma.
 * 
 * @param {string} email O email do novo membro.
 * @param {'admin' | 'teacher'} role A função do novo membro.
 * @param {string} schoolId O ID da escola à qual o membro pertence.
 * @returns {Promise<admin.auth.UserRecord>} O registro do usuário criado ou atualizado.
 */
export const inviteStaffMember = async (email: string, role: 'admin' | 'teacher', schoolId: string): Promise<admin.auth.UserRecord> => {
    try {
        let userRecord: admin.auth.UserRecord;

        // 1. Verifica se o usuário já existe
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`Usuário existente encontrado: ${userRecord.uid}`);
        } catch (error: any) {
            // Se o erro for 'user-not-found', criamos um novo usuário
            if (error.code === 'auth/user-not-found') {
                console.log(`Nenhum usuário encontrado para ${email}. Criando um novo...`);
                userRecord = await admin.auth().createUser({
                    email: email,
                    emailVerified: false, // O usuário precisará verificar o email
                    displayName: email, // Um nome de exibição padrão
                });
                console.log(`Novo usuário criado: ${userRecord.uid}`);
            } else {
                // Se for outro tipo de erro, nós o relançamos
                throw error;
            }
        }

        // 2. Define as permissões personalizadas (Custom Claims)
        // As permissões são a forma como o front-end saberá o que o usuário pode fazer.
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: role,         // ex: 'admin', 'teacher'
            schoolId: schoolId   // ID da escola para isolamento de dados
        });

        console.log(`Permissões personalizadas definidas para ${email}: { role: '${role}', schoolId: '${schoolId}' }`);

        // 3. Retorna o registro completo do usuário
        return userRecord;

    } catch (error) {
        console.error("Erro detalhado no inviteStaffMember:", error);
        // Lança o erro para que a Cloud Function que chamou possa tratá-lo
        throw new Error('Falha ao processar o convite do membro da equipe.');
    }
};
