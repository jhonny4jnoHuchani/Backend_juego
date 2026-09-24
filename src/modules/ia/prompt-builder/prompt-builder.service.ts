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

  // ============================================================
  // PROMPT PARA GENERAR TEXTO CON ERRORES
  // ============================================================
  construirPromptGenerarTexto(
    mision: Mision,
    temaInvestigacion: string,
  ): string {
    const contenido = mision.contenidoJson ?? {};
    const tipoErrores = (contenido as any).tiposErrores ?? [
      'Falta de cita (menciona "un estudio" sin autor ni año)',
      'Generalización falsa ("todos los investigadores...")',
      'Expresión vaga ("muchos estudios...")',
      'Afirmación sin fuente ("la IA es muy importante...")',
    ];

    return `
Eres un experto en metodología de investigación académica.

Tu tarea es GENERAR un párrafo académico con ERRORES INTENCIONALES sobre el siguiente tema:

"${temaInvestigacion}"

Contexto de la misión: ${mision.titulo}
Competencia: ${mision.competencia ?? 'general'}

========================================
REQUISITOS DEL TEXTO
========================================
- Debe ser un párrafo de 4-5 oraciones
- Tema del párrafo: antecedentes o marco teórico de la investigación
- Debe ser coherente con el tema del estudiante
- Debe contener EXACTAMENTE 4 errores, uno de cada tipo:
${tipoErrores.map((e: string, i: number) => `  ${i + 1}. ${e}`).join('\n')}

========================================
FORMATO DE RESPUESTA (OBLIGATORIO)
========================================
Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin bloques de código markdown, sin comentarios. Exactamente con esta estructura:

{
  "texto": "<el párrafo completo con los 4 errores>",
  "erroresEsperados": [
    { "fragmento": "<texto exacto que aparece en el párrafo>", "tipo": "<tipo_de_error>" }
  ],
  "respuestasCorrectas": {
    "errores": [
      {
        "fragmento": "<texto exacto>",
        "tipo": "<tipo_de_error>",
        "razon_completa": "<explicación detallada de por qué es un error>",
        "peso": 25
      }
    ]
  }
}

REGLAS:
- Los "fragmento" en erroresEsperados y respuestasCorrectas deben coincidir EXACTAMENTE con el texto del párrafo.
- Cada error debe ser claramente identificable.
- NO generes errores ambiguos.

RESPONDE SOLO EL JSON.`;
  }

  // ============================================================
  // PROMPT PARA EVALUAR DETECCIÓN DE ERRORES
  // ============================================================
  construirPromptEvaluarErrores(
    mision: Mision,
    textoGenerado: string,
    respuestasCorrectas: any,
    respuestaEstudiante: string,
  ): string {
    return `
Eres un tutor académico experto en metodología de investigación científica.
Tu rol es EVALUAR la respuesta de un estudiante universitario, NUNCA generar el trabajo por él.

========================================
CONTEXTO DE LA MISIÓN
========================================
Título: ${mision.titulo}
Enunciado: ${mision.enunciado}
Competencia evaluada: ${mision.competencia ?? 'general'}

========================================
TEXTO QUE EL ESTUDIANTE DEBÍA ANALIZAR
========================================
"${textoGenerado}"

========================================
ERRORES CORRECTOS (RESPUESTAS ESPERADAS)
========================================
${JSON.stringify(respuestasCorrectas, null, 2)}

========================================
RESPUESTA DEL ESTUDIANTE
========================================
"${respuestaEstudiante}"

========================================
INSTRUCCIONES DE EVALUACIÓN
========================================
1. Evalúa cuántos de los errores correctos logró identificar el estudiante.
2. El estudiante NO tiene que usar las mismas palabras exactas — evalúa si su descripción corresponde al error.
3. Sé justo: si el estudiante describe correctamente el error aunque use otras palabras, cuéntalo como detectado.
4. CRITERIOS PROPORCIONALES: si el estudiante detecta 1 de 4 errores → 25% del peso. 2 de 4 → 50%. 3 de 4 → 75%. 4 de 4 → 100%.
5. Da una PISTA ESPECÍFICA sobre los errores que no detectó. NO des la respuesta completa.

========================================
FORMATO DE RESPUESTA (OBLIGATORIO)
========================================
Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin bloques de código markdown, sin comentarios:

{
  "resultado": "correcto" | "parcial" | "incorrecto",
  "puntuacion": <número entero de 0 a 100>,
  "criterios": [
    {
      "nombre": "<nombre del criterio>",
      "cumplido": true | false,
      "comentario": "<explicación específica>"
    }
  ],
  "pista": "<sugerencia concreta sobre los errores no detectados, null si correcto>",
  "explicacion": "<explicación breve del porqué de la evaluación>"
}

REGLAS DE PUNTUACIÓN:
- "correcto" → puntuacion >= 80
- "parcial"  → puntuacion entre 20 y 79
- "incorrecto" → puntuacion < 20

RESPONDE SOLO EL JSON.`;
  }
}