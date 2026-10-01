import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { LoggerCostosService } from './logger-costos.service';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly nombre = 'openai';

  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI | null;
  private readonly modeloPrimario: string;
  private readonly modeloPremium: string;

  // Precios de gpt-4.1-nano (por 1M tokens)
  private readonly PRECIO_INPUT_POR_MILLON = 0.10;
  private readonly PRECIO_OUTPUT_POR_MILLON = 0.40;

  constructor(
    private readonly config: ConfigService,
    private readonly loggerCostos: LoggerCostosService,
  ) {
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
      this.config.get<string>('ia.openaiModelPrimary') ?? 'gpt-4.1-nano';
    this.modeloPremium =
      this.config.get<string>('ia.openaiModelPremium') ?? 'gpt-4o-mini';
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

    // ---------- LOG DE COSTO ----------
    const usage = (respuesta as any).usage;
    if (usage) {
      const inputTokens = usage.prompt_tokens ?? 0;
      const outputTokens = usage.completion_tokens ?? 0;

      const costoInput =
        (inputTokens / 1_000_000) * this.PRECIO_INPUT_POR_MILLON;
      const costoOutput =
        (outputTokens / 1_000_000) * this.PRECIO_OUTPUT_POR_MILLON;
      const costoTotal = costoInput + costoOutput;

      this.logger.log(
        `💰 OpenAI (${this.modeloPrimario}) — ` +
          `in: ${inputTokens} tok | out: ${outputTokens} tok | ` +
          `costo: $${costoTotal.toFixed(6)} USD`,
      );

      this.loggerCostos.registrar({
        modelo: this.modeloPrimario,
        inputTokens,
        outputTokens,
        costoUsd: costoTotal,
        contexto: 'evaluacion',
      });
    }
    // ---------- FIN LOG DE COSTO ----------

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