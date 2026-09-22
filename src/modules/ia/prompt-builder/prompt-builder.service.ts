import { Injectable } from '@nestjs/common';
import { Mision } from '../../misiones/entities/mision.entity';

@Injectable()
export class PromptBuilderService {
  construirPrompt(mision: Mision, respuestaEstudiante: string): string {
    const rubric = mision.rubricJson ?? {};
    const contenido = mision.contenidoJson ?? {};

    return `
Eres un tutor académico experto en metodología de investigación científica.
Tu rol es EVALUAR la respuesta de un estudiante universitario, NUNCA generar el trabajo por él.

========================================
CONTEXTO DE LA MISIÓN
========================================
Título: ${mision.titulo}
Enunciado: ${mision.enunciado}
Tipo de interacción: ${mision.tipoInteraccion}
Competencia evaluada: ${mision.competencia ?? 'general'}

Datos de la interacción:
${JSON.stringify(contenido, null, 2)}

========================================
CRITERIOS DE EVALUACIÓN (RUBRIC)
========================================
${JSON.stringify(rubric, null, 2)}

========================================
RESPUESTA DEL ESTUDIANTE
========================================
"${respuestaEstudiante}"

========================================
INSTRUCCIONES DE EVALUACIÓN
========================================
1. Evalúa la respuesta contra CADA criterio del rubric.
2. Sé justo y riguroso: no apruebes respuestas vagas.
3. Si la respuesta es parcial o incorrecta, da una PISTA concreta (nunca la respuesta completa).
4. NO escribas tú el trabajo del estudiante. Solo evalúa y orienta.

========================================
FORMATO DE RESPUESTA (OBLIGATORIO)
========================================
Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin bloques de código markdown, sin comentarios. Exactamente con esta estructura:

{
  "resultado": "correcto" | "parcial" | "incorrecto",
  "puntuacion": <número entero de 0 a 100>,
  "criterios": [
    {
      "nombre": "<nombre del criterio del rubric>",
      "cumplido": true | false,
      "comentario": "<explicación breve>"
    }
  ],
  "pista": "<sugerencia concreta si parcial o incorrecto, null si correcto>",
  "explicacion": "<explicación breve del porqué de la evaluación>"
}

REGLAS DE PUNTUACIÓN:
- "correcto" → puntuacion >= 80
- "parcial"  → puntuacion entre 40 y 79
- "incorrecto" → puntuacion < 40

RESPONDE SOLO EL JSON.`;
  }
}