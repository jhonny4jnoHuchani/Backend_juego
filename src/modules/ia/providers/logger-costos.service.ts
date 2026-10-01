import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerCostosService {
  private readonly logger = new Logger(LoggerCostosService.name);
  private readonly carpetaLogs: string;
  private readonly archivo: string;

  constructor() {
    // Ruta: <raíz del proyecto>/logs/costos_openai.log
    this.carpetaLogs = path.join(process.cwd(), 'logs');
    this.archivo = path.join(this.carpetaLogs, 'costos_openai.log');

    // Asegurar que la carpeta exista
    if (!fs.existsSync(this.carpetaLogs)) {
      fs.mkdirSync(this.carpetaLogs, { recursive: true });
    }
  }

  /**
   * Registra una llamada a OpenAI con su costo.
   */
  registrar(data: {
    modelo: string;
    inputTokens: number;
    outputTokens: number;
    costoUsd: number;
    contexto?: string;
  }) {
    const linea =
      `[${new Date().toISOString()}] ` +
      `modelo=${data.modelo} | ` +
      `input=${data.inputTokens} | ` +
      `output=${data.outputTokens} | ` +
      `costo=$${data.costoUsd.toFixed(6)} | ` +
      `contexto=${data.contexto ?? 'general'}\n`;

    try {
      fs.appendFileSync(this.archivo, linea, 'utf8');
    } catch (err) {
      this.logger.warn(
        `No se pudo escribir el log de costos: ${
          err instanceof Error ? err.message : 'error desconocido'
        }`,
      );
    }
  }
}