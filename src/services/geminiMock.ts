
// src/services/geminiMock.ts

interface DebtDetails {
  studentName: string;
  debtAmount: number;
  dueDate: string;
}

interface GeneratedMessages {
  formal: string;
  friendly: string;
  urgent: string;
}

// Simula a latência da rede
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geminiMock = {
  async generateBillingMessages(debtInfo: DebtDetails): Promise<GeneratedMessages> {
    await sleep(1500); // Simula o tempo de resposta da API

    console.log("[Gemini MOCK] Generating messages for:", debtInfo);

    const { studentName, debtAmount, dueDate } = debtInfo;
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debtAmount);
    const formattedDate = new Date(dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

    return {
      formal: `Prezado(a) responsável por ${studentName},\n\nEscrevemos para notificá-lo(a) sobre um saldo pendente de ${formattedAmount}, referente à mensalidade com vencimento em ${formattedDate}.\n\nPara regularizar a situação, por favor, realize o pagamento através dos nossos canais habituais. Se o pagamento já foi efetuado, por favor, desconsidere este aviso.\n\nAtenciosamente,\nA Direção.`,

      friendly: `Olá, família de ${studentName}! Tudo bem? 😊\n\nSó passando para lembrar com carinho sobre a mensalidade de ${formattedAmount}, que venceu no dia ${formattedDate}. Às vezes, na correria do dia a dia, a gente acaba esquecendo, né?\n\nQualquer dúvida ou se precisar de ajuda, é só chamar! 😉\n\nUm abraço!`,

      urgent: `ATENÇÃO: Pendência Financeira Urgente\n\nPrezado responsável por ${studentName},\n\nIdentificamos que o pagamento de ${formattedAmount}, com vencimento em ${formattedDate}, ainda não foi registrado em nosso sistema.\n\nA regularização é necessária para garantir a continuidade dos serviços e evitar bloqueios.\n\nPor favor, efetue o pagamento imediatamente. Caso tenha alguma dificuldade, entre em contato conosco com urgência.`,
    };
  },
};
