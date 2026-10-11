// Webhook carregado via variável de ambiente para evitar exposição
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "COLE_SEU_WEBHOOK_AQUI";

async function testFeedback() {
  console.log("🚀 Iniciando teste de Feedback...");

  const payload = {
    embeds: [
      {
        title: "🧪 Teste de Integração (Script)",
        color: 3447003, // Blue
        fields: [
          { name: "Versão", value: "v0.0.0-test", inline: true },
          { name: "Ambiente", value: "Node.js Script", inline: true },
          {
            name: "Mensagem",
            value:
              "Este é um teste automático para validar o webhook do Discord.",
          },
        ],
        footer: { text: "Aegis Debug Script" },
      },
    ],
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ Feedback enviado com sucesso!");
    } else {
      console.error(
        "❌ Erro ao enviar feedback:",
        response.status,
        await response.text(),
      );
    }
  } catch (err) {
    console.error("💥 Falha catastrófica no fetch:", err);
  }
}

testFeedback();
