import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly nombre = 'openai';

  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI | null;
  private readonly modeloPrimario: string;
  private readonly modeloPremium: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ia.openaiApiKey') ?? '';

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY no configurada. OpenAIProvider deshabilitado.',
      );
      this.client = null;
    } else {
      this.client = new OpenAI({ apiKey });
    }

    this.modeloPrimario =
      this.config.get<string>('ia.openaiModelPrimary') ?? 'gpt-4o-mini';
    this.modeloPremium =
      this.config.get<string>('ia.openaiModelPremium') ?? 'gpt-4o';
  }

  async evaluar(prompt: string): Promise<any> {
    if (!this.client) {
      throw new Error('OpenAI no está configurado (falta OPENAI_API_KEY)');
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de 30s excedido')), 30000),
    );

    const llamada = this.client.chat.completions.create({
      model: this.modeloPrimario,
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

    const json = this.extractJson(texto);

    if (!json) {
      throw new Error('OpenAI devolvió un JSON inválido');
    }

    return json;
  }

  private extractJson(texto: string): any | null {
    if (!texto) return null;

    try {
      return JSON.parse(texto.trim());
    } catch {}

    const bloque = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (bloque) {
      try {
        return JSON.parse(bloque[1].trim());
      } catch {}
    }

    const i = texto.indexOf('{');
    const j = texto.lastIndexOf('}');
    if (i !== -1 && j > i) {
      try {
        return JSON.parse(texto.substring(i, j + 1));
      } catch {}
    }

    return null;
  }
}