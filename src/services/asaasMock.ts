// src/services/asaasMock.ts

// Simula a resposta que o Asaas daria
interface MockResponse {
  success: boolean;
  id: string;
  status: string;
}

export const createFakeSubscription = async (studentData: any): Promise<MockResponse> => {
  console.log("🚀 Iniciando simulação de pagamento para:", studentData.name);

  // Simula o tempo de espera da internet (2 segundos)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Pagamento simulado com sucesso!");
      resolve({
        success: true,
        id: "sub_fake_123456",
        status: "ACTIVE"
      });
    }, 2000);
  });
};