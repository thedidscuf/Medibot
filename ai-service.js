export class AIService {
  constructor() {
    this.API_KEY = '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';
    this.BASE_URL = 'https://openrouter.ai/api/v1';
    this.conversationHistory = [
      {
        role: 'system',
        content: `Eres MediBot, un asistente médico virtual especializado en diagnóstico preliminar.

PROCESO DE CONSULTA:
1. Primero pregunta sobre el síntoma principal
2. Luego pregunta sobre detalles específicos (uno a la vez):
   - Duración
   - Intensidad
   - Factores que lo agravan/alivian
   - Síntomas asociados
3. Solo después de tener suficiente información, proporciona:
   - Evaluación
   - Recomendaciones
   - Medicamentos específicos con dosis

FORMATO PARA PREGUNTAS:
<div class="section">
  <strong>🤔 Sobre tu síntoma:</strong>
  <span class="bullet-point">[UNA pregunta específica]</span>
</div>

FORMATO PARA MEDICAMENTOS:
<div class="section">
  <strong>💊 Medicamentos recomendados:</strong>
  <span class="bullet-point">Nombre del medicamento (dosis específica)</span>
  <span class="bullet-point">Frecuencia y duración</span>
  <span class="bullet-point">Modo de uso</span>
</div>

FORMATO PARA EVALUACIÓN FINAL:
<div class="section">
  <strong>📋 Evaluación:</strong>
  <span class="bullet-point">Conclusión basada en la información recopilada</span>
</div>

<div class="section">
  <strong>💡 Plan de tratamiento:</strong>
  <span class="bullet-point">Medidas específicas a tomar</span>
</div>

<div class="section">
  <strong>⚠️ Busca atención médica si:</strong>
  <span class="bullet-point">Señales de alarma específicas</span>
</div>

REGLAS PARA MEDICAMENTOS:
- Solo recomienda medicamentos de venta libre
- Especifica dosis por peso/edad
- Menciona contraindicaciones importantes
- Incluye duración del tratamiento
- Advierte sobre efectos secundarios comunes

IMPORTANTE:
- Haz UNA sola pregunta a la vez
- Espera la respuesta antes de continuar
- Sé específico con las dosis
- Menciona precauciones importantes
- En casos graves, recomienda atención médica inmediata`
      }
    ];
    this.models = ['google/gemini-2.0-flash-lite-preview-02-05:free']; // Volvemos a usar deepseek
    this.currentModelIndex = 0;
  }

  async getResponse(message) {
    try {
      // Manejo especial para saludos
      const lowerMessage = message.toLowerCase().trim();
      if (this.isGreeting(lowerMessage)) {
        const greeting = `<div class="section">
          <strong>👋 ¡Hola!</strong>
          <span class="bullet-point">Soy MediBot, tu asistente médico virtual. ¿En qué puedo ayudarte hoy?</span>
        </div>`;
        
        this.conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: greeting }
        );
        return greeting;
      }

      this.conversationHistory.push({
        role: 'user',
        content: message
      });

      let lastError = null;
      
      // Intentar con cada modelo disponible
      for (const model of this.models) {
        try {
          const response = await fetch(`${this.BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://medibot.example.com',
              'X-Title': 'MediBot Medical Assistant'
            },
            body: JSON.stringify({
              model: this.models[0],
              messages: this.conversationHistory,
              temperature: 0.3,    // Reducido para respuestas más consistentes
              max_tokens: 800,     // Limitado para respuestas más concisas
              presence_penalty: 0.2,
              frequency_penalty: 0.3,
              top_p: 0.8
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          if (data?.choices?.[0]?.message?.content) {
            const cleanResponse = this.cleanResponse(data.choices[0].message.content);
            
            // Verificar que la respuesta sea válida y completa
            if (cleanResponse.length > 20) {
              this.conversationHistory.push({
                role: 'assistant',
                content: cleanResponse
              });
              return cleanResponse;
            }
          }
          
          // Si llegamos aquí, la respuesta no fue válida
          throw new Error('Respuesta incompleta');

        } catch (error) {
          lastError = error;
          // Continuar con el siguiente modelo
          continue;
        }
      }

      throw lastError;

    } catch (error) {
      console.error('Error en AI Service:', error);
      return 'Lo siento, hubo un problema al procesar tu consulta. Por favor, intenta de nuevo o reformula tu pregunta.';
    }
  }

  isGreeting(message) {
    const greetings = [
      'hola', 'buenos días', 'buenas tardes', 'buenas noches', 
      'hi', 'hello', 'hey', 'saludos', 'buen día'
    ];
    return greetings.some(greeting => message.includes(greeting));
  }

  cleanResponse(text) {
    return text
      .replace(/\n\n+/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/^["']|["']$/g, '')
      .replace(/\*\*/g, '') // Eliminar marcadores de negrita de Markdown
      .replace(/\*/g, '');  // Eliminar bullets de Markdown
  }
}