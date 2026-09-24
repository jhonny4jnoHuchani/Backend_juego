import { Injectable } from '@nestjs/common';
import { Mision } from '../../misiones/entities/mision.entity';

@Injectable()
export class PromptBuilderService {
  construirPrompt(
    mision: Mision,
    respuestaEstudiante: string,
    temaInvestigacion: string | null,
  ): string {
    const rubric = mision.rubricJson ?? {};
    const contenido = mision.contenidoJson ?? {};

    const bloqueTema = temaInvestigacion
      ? `
========================================
🎯 TEMA DE INVESTIGACIÓN DEL ESTUDIANTE
========================================
El estudiante está construyendo SU PROPIA investigación sobre:

"${temaInvestigacion}"

IMPORTANTE: Todas las respuestas del estudiante deben estar relacionadas con ESTE tema.
Evalúa si logró aplicar la competencia a SU tema real.
`
      : `
========================================
🎯 TEMA DE INVESTIGACIÓN DEL ESTUDIANTE
========================================
El estudiante NO ha registrado un tema todavía. Evalúa la respuesta como un ejercicio genérico.
`;

    return `
Eres un tutor académico experto en metodología de investigación científica.
Tu rol es EVALUAR la respuesta de un estudiante universitario, NUNCA generar el trabajo por él.

${bloqueTema}

========================================
CONTEXTO DE LA MISIÓN
========================================
Título: ${mision.titulo}
Enunciado: ${mision.enunciado}
Tipo de interacción: ${mision.tipoInteraccion}
Competencia evaluada: ${mision.competencia ?? 'general'}

Datos de la interacción (incluye un ejemplo de referencia que el estudiante puede haber visto):
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
3. Si el estudiante tiene un tema registrado, evalúa si SU respuesta lo aplica correctamente.
4. Si la respuesta es parcial o incorrecta, da una PISTA ESPECÍFICA que diga EXACTAMENTE qué le falta o qué debe mejorar. NUNCA des la respuesta completa.
5. La pista debe ser concreta: "Te falta indicar el lugar" en vez de "Revisa tu respuesta".
6. NO escribas tú el trabajo del estudiante. Solo evalúa y orienta.

IMPORTANTE — CRITERIOS PROPORCIONALES:
Cuando un criterio implique DETECTAR o LISTAR varios elementos (ej. "detectar 4 errores", "mencionar 3 variables"), NO uses todo-o-nada. Asigna puntuación PROPORCIONAL:
- Detecta 0 de 4 → 0% del peso del criterio
- Detecta 1 de 4 → 25% del peso del criterio
- Detecta 2 de 4 → 50% del peso del criterio
- Detecta 3 de 4 → 75% del peso del criterio
- Detecta 4 de 4 → 100% del peso del criterio

Y refleja esa proporcionalidad en el campo "cumplido" (false si < 50%, true si >= 50%).
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
      "comentario": "<explicación breve y específica>"
    }
  ],
  "pista": "<sugerencia CONCRETA si parcial o incorrecto, null si correcto>",
  "explicacion": "<explicación breve del porqué de la evaluación>"
}

REGLAS DE PUNTUACIÓN:
- "correcto" → puntuacion >= 80
- "parcial"  → puntuacion entre 20 y 79
- "incorrecto" → puntuacion < 20

RESPONDE SOLO EL JSON.`;
  }
}