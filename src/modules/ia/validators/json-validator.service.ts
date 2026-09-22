import { Injectable } from '@nestjs/common';
import { EvaluacionResultado } from '../interfaces/evaluacion-resultado.interface';

@Injectable()
export class JsonValidatorService {
  /**
   * Extrae el primer bloque JSON válido de un string.
   * Sirve porque a veces la IA envuelve el JSON en ```json ... ```
   */
  extraerJson(texto: string): any | null {
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

  /**
   * Valida que el JSON tenga la estructura correcta del EvaluacionResultado.
   */
  validarEstructura(json: any): json is EvaluacionResultado {
    if (!json || typeof json !== 'object') return false;

    // Campos obligatorios
    if (
      !['correcto', 'parcial', 'incorrecto'].includes(json.resultado)
    ) {
      return false;
    }

    if (
      typeof json.puntuacion !== 'number' ||
      json.puntuacion < 0 ||
      json.puntuacion > 100
    ) {
      return false;
    }

    if (!Array.isArray(json.criterios)) {
      return false;
    }

    for (const criterio of json.criterios) {
      if (
        typeof criterio.nombre !== 'string' ||
        typeof criterio.cumplido !== 'boolean' ||
        typeof criterio.comentario !== 'string'
      ) {
        return false;
      }
    }

    if (json.pista !== null && typeof json.pista !== 'string') {
      return false;
    }

    if (typeof json.explicacion !== 'string') {
      return false;
    }

    return true;
  }
}