import { logger } from "../lib/logger";

export interface AIMessage {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens?: number;
}

/**
 * AI Provider configuration
 */
const AI_PROVIDER = process.env.AI_PROVIDER ?? "mock"; // mock, openai, anthropic
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * System prompt for Brisa Cubana Concierge AI
 */
function getSystemPrompt(context: Record<string, unknown>): string {
  const user = context.user as { name?: string; email: string } | undefined;
  const services = context.availableServices as {
    name: string;
    basePrice: number;
    description?: string;
  }[];

  return `Eres el Concierge Virtual de Brisa Cubana Clean Intelligence, un servicio premium de limpieza residencial y comercial en Miami, Florida.

**Tu rol:**
- Asistir a clientes con información sobre servicios, precios y disponibilidad
- Ayudar con reservas, cambios y consultas sobre servicios completados
- Proveer información sobre CleanScore™, nuestro sistema de calificación de calidad
- Ser amable, profesional y eficiente

**Información del cliente:**
${user?.name ? `- Nombre: ${user.name}` : ""}
- Email: ${user?.email ?? "No disponible"}

**Servicios disponibles:**
${services?.map((s) => `- ${s.name}: $${s.basePrice} (${s.description ?? "Servicio profesional de limpieza"})`).join("\n")}

**Política de servicio:**
- Servimos el área de Miami-Dade County, Florida
- Horario: Lunes a Sábado, 8am-6pm
- Aceptamos pagos con tarjeta (Stripe)
- Todos nuestros servicios incluyen un reporte CleanScore™

**Instrucciones importantes:**
- Siempre responde en español profesional y amigable
- Si el cliente pregunta por disponibilidad específica, sugiere contactar al equipo (no tienes acceso al calendario en tiempo real)
- Para reservas, explica el proceso pero indica que debe completarse a través del panel web o app
- Si preguntan sobre un servicio no listado, ofrece alternativas similares
- Mantén respuestas concisas pero completas (máximo 3-4 párrafos)

**Contexto de la conversación:**
${context.currentBooking ? `- Cliente tiene una reserva activa (ID: ${(context.currentBooking as { id: string }).id})` : ""}
${context.recentBookings ? `- Total de reservas previas: ${(context.recentBookings as unknown[]).length}` : ""}
`;
}

/**
 * Generate AI response using configured provider
 */
export async function generateAIResponse(
  messages: AIMessage[],
  context: Record<string, unknown>,
): Promise<AIResponse> {
  const systemPrompt = getSystemPrompt(context);

  logger.info(
    {
      provider: AI_PROVIDER,
      messageCount: messages.length,
    },
    "Generating AI response",
  );

  switch (AI_PROVIDER) {
    case "openai":
      return generateOpenAIResponse(systemPrompt, messages);
    case "anthropic":
      return generateAnthropicResponse(systemPrompt, messages);
    case "mock":
    default:
      return generateMockResponse(systemPrompt, messages);
  }
}

/**
 * OpenAI GPT-4 integration
 */
async function generateOpenAIResponse(
  systemPrompt: string,
  messages: AIMessage[],
): Promise<AIResponse> {
  if (!OPENAI_API_KEY) {
    logger.warn("OpenAI API key not configured, falling back to mock");
    return generateMockResponse(systemPrompt, messages);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role.toLowerCase(),
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens: number };
    };

    return {
      content: data.choices[0].message.content,
      model: "gpt-4",
      tokens: data.usage?.total_tokens,
    };
  } catch (error) {
    logger.error({ error }, "OpenAI API error, falling back to mock");
    return generateMockResponse(systemPrompt, messages);
  }
}

/**
 * Anthropic Claude integration
 */
async function generateAnthropicResponse(
  systemPrompt: string,
  messages: AIMessage[],
): Promise<AIResponse> {
  if (!ANTHROPIC_API_KEY) {
    logger.warn("Anthropic API key not configured, falling back to mock");
    return generateMockResponse(systemPrompt, messages);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === "USER" ? "user" : "assistant",
          content: m.content,
        })),
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      content: { text: string }[];
      usage?: { input_tokens: number; output_tokens: number };
    };

    return {
      content: data.content[0].text,
      model: "claude-3-sonnet",
      tokens: data.usage
        ? data.usage.input_tokens + data.usage.output_tokens
        : undefined,
    };
  } catch (error) {
    logger.error({ error }, "Anthropic API error, falling back to mock");
    return generateMockResponse(systemPrompt, messages);
  }
}

/**
 * Mock AI responses for development/testing
 */
function generateMockResponse(
  _systemPrompt: string,
  messages: AIMessage[],
): AIResponse {
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage.content.toLowerCase();

  // Simple keyword-based responses
  let response = "";

  if (
    content.includes("hola") ||
    content.includes("buenos") ||
    content.includes("buenas")
  ) {
    response =
      "¡Hola! Bienvenido a Brisa Cubana Clean Intelligence. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre nuestros servicios, precios, o responder preguntas sobre tus reservas.";
  } else if (
    content.includes("servicio") ||
    content.includes("precio") ||
    content.includes("costo")
  ) {
    response =
      "Ofrecemos varios servicios de limpieza profesional:\n\n• Limpieza Regular: $89 - Ideal para mantenimiento semanal o quincenal\n• Deep Clean: $149 - Limpieza profunda completa de toda la propiedad\n• Move In/Out Clean: $199 - Perfecta para mudanzas\n• Post-Construction: $249 - Limpieza después de remodelaciones\n\nTodos incluyen nuestro reporte CleanScore™. ¿Te gustaría más detalles sobre algún servicio específico?";
  } else if (
    content.includes("reserva") ||
    content.includes("agendar") ||
    content.includes("cita")
  ) {
    response =
      "Para agendar un servicio, puedes:\n\n1. Usar nuestro panel web en brisacubanaclean.com\n2. Llamarnos al (305) 555-0100\n3. Enviarnos un WhatsApp\n\nNecesitaremos:\n• Dirección de la propiedad\n• Tipo de servicio deseado\n• Fecha y hora preferida\n\n¿Tienes alguna preferencia de fecha o servicio en mente?";
  } else if (
    content.includes("cleanscore") ||
    content.includes("calidad") ||
    content.includes("reporte")
  ) {
    response =
      "CleanScore™ es nuestro sistema exclusivo de calificación de calidad. Después de cada servicio:\n\n✓ El equipo documenta el trabajo con fotos\n✓ Evaluamos 6 métricas clave (limpieza general, cocina, baños, detalles, ambiente, puntualidad)\n✓ Generas un reporte con tu puntuación (0-5)\n✓ Recibes el reporte por email en PDF\n\nNuestro promedio es 4.8/5. ¡La calidad es nuestra prioridad!";
  } else if (
    content.includes("disponibilidad") ||
    content.includes("horario")
  ) {
    response =
      "Nuestro horario de servicio es:\n\n📅 Lunes a Sábado: 8:00 AM - 6:00 PM\n🚫 Domingos: Cerrado\n\nPara disponibilidad específica en tu zona, te recomiendo contactar a nuestro equipo. Normalmente podemos agendar servicios con 48-72 horas de anticipación, pero en ocasiones tenemos slots disponibles para el día siguiente.";
  } else if (
    content.includes("pago") ||
    content.includes("forma") ||
    content.includes("método")
  ) {
    response =
      "Aceptamos pagos de forma segura a través de:\n\n💳 Tarjetas de crédito/débito (Visa, Mastercard, Amex)\n💰 El pago se procesa antes del servicio a través de Stripe\n🔒 Todas las transacciones son 100% seguras\n\nNo trabajamos con efectivo por políticas de seguridad.";
  } else if (
    content.includes("gracias") ||
    content.includes("perfecto") ||
    content.includes("excelente")
  ) {
    response =
      "¡De nada! Estoy aquí para ayudarte. Si necesitas algo más, no dudes en preguntar. ¡Que tengas un excelente día! ✨";
  } else {
    response =
      "Entiendo tu consulta. Te puedo ayudar con:\n\n• Información sobre servicios y precios\n• Proceso de reserva\n• CleanScore™ y calidad de servicio\n• Horarios y disponibilidad\n• Métodos de pago\n\n¿Sobre cuál de estos temas te gustaría saber más?";
  }

  logger.info(
    { response: response.substring(0, 50) },
    "Mock AI response generated",
  );

  return {
    content: response,
    model: "mock-concierge-v1",
    tokens: Math.floor(response.length / 4), // Rough estimate
  };
}
