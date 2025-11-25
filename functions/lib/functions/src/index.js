"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInviteCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Cloud Function para ser acionada na criação de um novo convite.
 * Cria um usuário no Firebase Auth, um documento no Firestore e envia um e-mail
 * para definição de senha.
 */
exports.onInviteCreated = functions.firestore
    .document("invites/{inviteId}")
    .onCreate(async (snap, context) => {
    const inviteData = snap.data();
    const { email, displayName, role, schoolId } = inviteData;
    // Log para debugging
    console.log(`Processing invite for ${email} at school ${schoolId}`);
    try {
        // 1. Verifica se o usuário já existe no Auth
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`User with email ${email} already exists.`);
            // Opcional: Adicionar lógica para lidar com usuário existente
            // Por agora, apenas logamos e encerramos a função para evitar duplicatas.
            await snap.ref.delete();
            return;
        }
        catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error; // Re-lança erros que não sejam "usuário não encontrado"
            }
            // Se o usuário não existe, continua o processo de criação
            console.log(`User with email ${email} not found. Creating new user.`);
        }
        // 2. Cria o novo usuário no Firebase Authentication
        userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: false, // Opcional
            displayName: displayName,
            disabled: false,
        });
        console.log("Successfully created new user:", userRecord.uid);
        // 3. Cria o documento do usuário na coleção 'users'
        await admin.firestore().collection("users").doc(userRecord.uid).set({
            schoolId: schoolId,
            displayName: displayName,
            email: email,
            role: role,
            active: true, // Usuário já nasce ativo
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Successfully created user document for ${userRecord.uid}`);
        // 4. Gera o link para definição de senha e envia o e-mail
        const link = await admin.auth().generatePasswordResetLink(email);
        // A função de envio de email será implementada a seguir
        // Por enquanto, apenas logamos o link para depuração.
        console.log(`Password reset link for ${email}: ${link}`);
        // Enviar email usando um serviço de terceiros (ex: SendGrid, Mailgun) ou uma extensão do Firebase.
        // Para este exemplo, vamos simular o envio criando uma coleção `mail` que a extensão `Trigger Email` ouviria.
        await admin.firestore().collection("mail").add({
            to: email,
            template: {
                name: "welcome_staff", // Nome do template de email (a ser criado no SendGrid/etc)
                data: {
                    displayName: displayName,
                    schoolName: "XPACE OS", // Opcional: buscar o nome da escola do DB
                    action_url: link,
                },
            },
        });
        console.log(`Email trigger document created for ${email}.`);
        // 5. Deleta o documento de convite para evitar reprocessamento
        await snap.ref.delete();
        console.log(`Invite document ${context.params.inviteId} deleted.`);
    }
    catch (error) {
        console.error("Error processing invite:", error);
        // Opcional: Adicionar tratamento de erro, como mover o convite para uma coleção de 'erros'
    }
});
//# sourceMappingURL=index.js.map