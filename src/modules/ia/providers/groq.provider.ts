import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AIProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class GroqProvider implements AIProvider {
  readonly nombre = 'groq';

  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: Groq;
  private readonly modelo: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ia.groqApiKey') ?? '';
    this.client = new Groq({ apiKey });
    this.modelo =
      this.config.get<string>('ia.groqModel') ?? 'openai/gpt-oss-120b';
  }

  async evaluar(prompt: string): Promise<any> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de 30s excedido')), 30000),
    );

    const llamada = this.client.chat.completions.create({
      model: this.modelo,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un tutor académico. Respondes SIEMPRE con JSON válido, sin texto adicional.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const respuesta = await Promise.race([llamada, timeoutPromise]);

    const texto = respuesta.choices[0]?.message?.content ?? '';

    // Solo extraemos el JSON. La validación de estructura la hace el IAEvaluatorService.
    const json = this.extractJson(texto);

    if (!json) {
      throw new Error('Groq devolvió un JSON inválido');
    }

    return json;
  }

  /**
   * Extrae el primer bloque JSON válido de un string.
   */
  private extractJson(texto: string): any | null {
    if (!texto) return null;

    // 1. Intento directo
    try {
      return JSON.parse(texto.trim());
    } catch {
      // Continuar
    }

    // 2. Buscar bloque entre ```json ... ```
    const bloqueMarkdown = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (bloqueMarkdown) {
      try {
        return JSON.parse(bloqueMarkdown[1].trim());
      } catch {
        // Continuar
      }
    }

    // 3. Buscar el primer { ... último }
    const primerLlave = texto.indexOf('{');
    const ultimaLlave = texto.lastIndexOf('}');
    if (primerLlave !== -1 && ultimaLlave > primerLlave) {
      try {
        return JSON.parse(texto.substring(primerLlave, ultimaLlave + 1));
      } catch {
        // Continuar
      }
    }

    return null;
  }
}