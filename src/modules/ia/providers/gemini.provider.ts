import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly nombre = 'gemini';

  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modeloPrimario: string;
  private readonly modeloFallback: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ia.geminiApiKey') ?? '';
    this.client = new GoogleGenerativeAI(apiKey);
    this.modeloPrimario =
      this.config.get<string>('ia.geminiModelPrimary') ?? 'gemini-3.6-flash';
    this.modeloFallback =
      this.config.get<string>('ia.geminiModelFallback') ?? 'gemini-3.7-flash';
  }

  async evaluar(prompt: string): Promise<any> {
    // Intento 1: modelo primario
    try {
      return await this.ejecutar(this.modeloPrimario, prompt);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(
        `Modelo primario (${this.modeloPrimario}) falló: ${mensaje}. Probando fallback...`,
      );
    }

    // Intento 2: modelo fallback
    return await this.ejecutar(this.modeloFallback, prompt);
  }

  private async ejecutar(modelo: string, prompt: string): Promise<any> {
    const model = this.client.getGenerativeModel({
      model: modelo,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de 30s excedido')), 30000),
    );

    const respuesta = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);

    const texto = respuesta.response.text();

    // Solo extraemos el JSON. La validación de estructura la hace el IAEvaluatorService.
    const json = this.extractJson(texto);

    if (!json) {
      throw new Error('Gemini devolvió un JSON inválido');
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