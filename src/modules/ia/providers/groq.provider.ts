import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { EvaluacionResultado } from '../interfaces/evaluacion-resultado.interface';
import { JsonValidatorService } from '../validators/json-validator.service';

@Injectable()
export class GroqProvider implements AIProvider {
  readonly nombre = 'groq';

  private readonly logger = new Logger(GroqProvider.name);
  private readonly client: Groq;
  private readonly modelo: string;

  constructor(
    private readonly config: ConfigService,
    private readonly validator: JsonValidatorService,
  ) {
    const apiKey = this.config.get<string>('ia.groqApiKey') ?? '';
    this.client = new Groq({ apiKey });
    this.modelo = this.config.get<string>('ia.groqModel') ?? 'llama-3.1-8b-instant';
  }

  async evaluar(prompt: string): Promise<EvaluacionResultado> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de 30s excedido')), 30000),
    );

    const llamada = this.client.chat.completions.create({
      model: this.modelo,
      temperature: 0.3,
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
    const json = this.validator.extraerJson(texto);

    if (!json) {
      throw new Error('Groq devolvió un JSON inválido');
    }

    if (!this.validator.validarEstructura(json)) {
      throw new Error('JSON de Groq no cumple con la estructura esperada');
    }

    return json;
  }
}