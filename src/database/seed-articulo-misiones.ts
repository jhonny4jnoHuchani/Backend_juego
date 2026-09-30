import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de MISIONES de ARTÍCULO...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadArticulo = await modalidadesRepo.findOne({
      where: { nombre: 'articulo' },
    });

    if (!modalidadArticulo) {
      throw new Error(
        'No se encontró la modalidad "articulo". Ejecuta primero `npm run seed` y `npm run seed:articulo`.',
      );
    }

    const nivelesRepo = dataSource.getRepository(Nivel);
    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadArticulo.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error('No hay niveles de artículo. Ejecuta primero `npm run seed:articulo`.');
    }

    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) nivelesPorNumero.set(nivel.numero, nivel);

    const misionesData: Array<{
      nivelNumero: number;
      titulo: string;
      enunciado: string;
      tipoInteraccion: 'texto_libre' | 'marcar_errores';
      contenidoJson: any;
      rubricJson: any;
      competencia: string;
      esPrincipal: boolean;
      vidasIniciales: number;
      xpRecompensa: number;
      puntosInvestigacion: number;
    }> = [
      {
        nivelNumero: 1,
        titulo: 'MISIÓN 1: Delimite una propuesta de artículo publicable',
        enunciado:
          'Transforme una idea general en un tema de artículo claramente delimitado. Precise el fenómeno o la variable, la población, el contexto, el periodo y la contribución prevista.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Elabore la ficha de delimitación del artículo.',
          pasos: [
            'Identifique el fenómeno, la variable o la categoría central.',
            'Delimite la población o unidad de análisis.',
            'Especifique el lugar y el periodo del estudio.',
            'Describa brevemente la brecha de conocimiento o la contribución que abordará el artículo.',
          ],
          formatoRespuesta:
            'Tema delimitado + población + lugar + periodo + contribución prevista.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'tema_especifico', descripcion: 'Define un fenómeno o una variable de manera específica', peso: 25 },
            { nombre: 'delimitacion', descripcion: 'Precisa la población, el lugar y el periodo', peso: 30 },
            { nombre: 'aporte', descripcion: 'Formula una contribución susceptible de investigación', peso: 25 },
            { nombre: 'viabilidad', descripcion: 'Propone un alcance abordable en un artículo', peso: 20 },
          ],
        },
        competencia: 'delimitación temática y formulación de la contribución',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 120,
        puntosInvestigacion: 25,
      },
      {
        nivelNumero: 2,
        titulo: 'MISIÓN 2: Estructure una introducción fundamentada',
        enunciado:
          'Estructure la introducción del artículo e incluya el contexto del problema, los antecedentes disponibles, la brecha de conocimiento, la pregunta de investigación y el objetivo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacte una introducción concisa y organizada.',
          pasos: [
            'Presente el problema mediante fuentes pertinentes y actualizadas.',
            'Sintetice el conocimiento disponible e identifique los aspectos pendientes de resolver.',
            'Formule la pregunta de investigación.',
            'Concluya con el objetivo general del artículo.',
          ],
          advertencias: [
            'Sustente las afirmaciones relevantes con fuentes.',
            'Presente la metodología después de justificar la pertinencia del estudio.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'contexto', descripcion: 'Contextualiza el problema con evidencia pertinente', peso: 25 },
            { nombre: 'vacio', descripcion: 'Identifica una brecha o controversia en la literatura', peso: 25 },
            { nombre: 'pregunta', descripcion: 'Formula una pregunta clara y delimitada', peso: 25 },
            { nombre: 'objetivo', descripcion: 'Alinea el objetivo con la pregunta de investigación', peso: 25 },
          ],
        },
        competencia: 'elaboración de la introducción y planteamiento del problema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 140,
        puntosInvestigacion: 30,
      },
      {
        nivelNumero: 3,
        titulo: 'MISIÓN 3: Desarrolle la fundamentación científica',
        enunciado:
          'Organice la fundamentación del artículo para justificar la pertinencia del estudio y explicar las relaciones entre sus conceptos, variables o categorías.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Elabore un esquema de la argumentación teórica.',
          pasos: [
            'Seleccione entre tres y cinco antecedentes directamente relacionados con el tema.',
            'Defina los conceptos centrales con apoyo de fuentes académicas.',
            'Explique la relación entre las variables o categorías.',
            'Formule hipótesis únicamente cuando sean pertinentes al enfoque del estudio.',
          ],
          producto:
            'Mapa conceptual o esquema de párrafos con citas en formato autor-año.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'antecedentes', descripcion: 'Selecciona antecedentes pertinentes y actualizados', peso: 25 },
            { nombre: 'conceptos', descripcion: 'Define los conceptos con respaldo bibliográfico', peso: 25 },
            { nombre: 'coherencia', descripcion: 'Articula la teoría, las variables y la pregunta', peso: 30 },
            { nombre: 'hipotesis', descripcion: 'Formula una hipótesis comprobable cuando corresponda', peso: 20 },
          ],
        },
        competencia: 'fundamentación teórica y argumentación científica',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 160,
        puntosInvestigacion: 35,
      },
      {
        nivelNumero: 4,
        titulo: 'MISIÓN 4: Describa una metodología reproducible',
        enunciado:
          'Describa el plan metodológico del artículo con suficiente precisión para que otras personas comprendan cómo se obtendrán y analizarán los datos.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacte la metodología de forma ordenada y precisa.',
          pasos: [
            'Indique el enfoque, el tipo y el diseño de investigación, y justifique cada elección.',
            'Defina la población, la muestra o las características de las personas participantes.',
            'Describa las técnicas, los instrumentos y el procedimiento de recolección.',
            'Explique el método de análisis y las medidas éticas previstas.',
          ],
          listaVerificacion: [
            'Enfoque y diseño de investigación',
            'Población y muestra',
            'Instrumentos y procedimiento de recolección',
            'Plan de análisis y consideraciones éticas',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'diseno', descripcion: 'Mantiene coherencia entre el enfoque, el tipo y el diseño', peso: 25 },
            { nombre: 'muestra', descripcion: 'Delimita la población participante y el procedimiento de selección', peso: 25 },
            { nombre: 'procedimiento', descripcion: 'Describe con claridad la recolección de los datos', peso: 25 },
            { nombre: 'analisis_etica', descripcion: 'Especifica el análisis y las medidas de protección ética', peso: 25 },
          ],
        },
        competencia: 'diseño metodológico para la elaboración de un artículo',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 180,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 5,
        titulo: 'MISIÓN 5: Presente los resultados con objetividad',
        enunciado:
          'Redacte la presentación de un hallazgo central del artículo. Este debe responder a un objetivo y estar respaldado por datos, tablas, figuras o categorías.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Presente un resultado con evidencia y lenguaje objetivo.',
          pasos: [
            'Indique a qué objetivo o pregunta responde el resultado.',
            'Presente el dato, patrón o categoría principal.',
            'Señale la evidencia que respalda el hallazgo.',
            'Distinga la descripción del resultado de su interpretación.',
          ],
          regla:
            'No atribuya causalidad a una asociación sin sustento metodológico ni presente resultados que no hayan sido obtenidos.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'relacion_objetivo', descripcion: 'Vincula el resultado con un objetivo del estudio', peso: 25 },
            { nombre: 'evidencia', descripcion: 'Presenta datos o evidencia verificable', peso: 35 },
            { nombre: 'objetividad', descripcion: 'Emplea un lenguaje descriptivo y evita afirmaciones excesivas', peso: 25 },
            { nombre: 'orden', descripcion: 'Expone el resultado de manera clara y organizada', peso: 15 },
          ],
        },
        competencia: 'presentación de resultados',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 180,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 6,
        titulo: 'MISIÓN 6: Elabore la discusión y las conclusiones',
        enunciado:
          'Interprete el hallazgo, compárelo con los antecedentes, identifique una limitación y formule una conclusión vinculada con el objetivo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacte un párrafo de discusión y una conclusión.',
          pasos: [
            'Explique la relevancia del hallazgo para el problema de investigación.',
            'Compare el hallazgo con al menos un antecedente pertinente.',
            'Identifique una limitación que incida en el alcance del estudio.',
            'Formule una conclusión concreta y vinculada con el objetivo.',
          ],
          evitar: [
            'Atribuir causalidad sin que el diseño de investigación permita demostrarla.',
            'Incorporar resultados o temas nuevos en la conclusión.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'interpretacion', descripcion: 'Interpreta el hallazgo con rigor académico', peso: 25 },
            { nombre: 'contraste', descripcion: 'Contrasta el hallazgo con la literatura pertinente', peso: 25 },
            { nombre: 'limitacion', descripcion: 'Identifica una limitación relevante', peso: 20 },
            { nombre: 'conclusion', descripcion: 'Responde de manera directa al objetivo', peso: 30 },
          ],
        },
        competencia: 'discusión y conclusiones',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 200,
        puntosInvestigacion: 45,
      },
      {
        nivelNumero: 7,
        titulo: 'MISIÓN 7: Prepare el manuscrito para evaluación editorial',
        enunciado:
          'Complete los elementos necesarios para la localización, evaluación y publicación del artículo: resumen, palabras clave, citas, referencias, originalidad y formato editorial.',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion: 'Revise el manuscrito mediante una lista de verificación editorial.',
          pasos: [
            'Sintetice el objetivo, el método, los resultados y la conclusión en un solo texto.',
            'Seleccione entre cuatro y seis palabras clave específicas.',
            'Verifique la correspondencia entre las citas y la lista de referencias.',
            'Compruebe el formato, el cumplimiento ético, el consentimiento y la originalidad.',
          ],
          erroresObjetivo: [
            'Resumen que omite los resultados',
            'Palabras clave excesivamente generales',
            'Cita sin referencia bibliográfica correspondiente',
            'Referencia bibliográfica no citada en el texto',
            'Afirmación que carece de respaldo bibliográfico',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'resumen', descripcion: 'Integra el propósito, el método, los resultados y la conclusión', peso: 25 },
            { nombre: 'indexacion', descripcion: 'Selecciona palabras clave específicas y pertinentes', peso: 15 },
            { nombre: 'apa', descripcion: 'Mantiene correspondencia entre citas y referencias según APA 7', peso: 30 },
            { nombre: 'etica_formato', descripcion: 'Verifica los aspectos éticos, la originalidad y los requisitos editoriales', peso: 30 },
          ],
        },
        competencia: 'preparación editorial y aplicación de APA 7',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 220,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 8,
        titulo: 'MISIÓN 8: Responda a la evaluación por pares',
        enunciado:
          'Un evaluador señala que la muestra es reducida y que la fundamentación teórica requiere mayor desarrollo. Responda de manera profesional, fundamentada y precisa, e indique los cambios que realizará.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacte una carta de respuesta a los evaluadores.',
          pasos: [
            'Agradezca y sintetice cada observación.',
            'Exponga la respuesta metodológica o bibliográfica correspondiente.',
            'Especifique el cambio realizado y la sección en la que se incorporó.',
            'Si decide no adoptar una sugerencia, fundamente la decisión con evidencia.',
          ],
          estructura:
            'Observación del evaluador → respuesta fundamentada → cambio realizado → ubicación en el manuscrito.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'tono', descripcion: 'Mantiene un tono académico, profesional y respetuoso', peso: 25 },
            { nombre: 'respuesta', descripcion: 'Atiende cada observación de manera directa', peso: 30 },
            { nombre: 'argumento', descripcion: 'Sustenta la respuesta con fundamentos metodológicos o bibliográficos', peso: 30 },
            { nombre: 'trazabilidad', descripcion: 'Identifica los cambios y su ubicación en el manuscrito', peso: 15 },
          ],
        },
        competencia: 'respuesta a evaluadores y comunicación para la publicación',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 300,
        puntosInvestigacion: 75,
      },
    ];

    const misionesRepo = dataSource.getRepository(Mision);
    let insertadas = 0;
    let actualizadas = 0;

    for (const misionData of misionesData) {
      const nivel = nivelesPorNumero.get(misionData.nivelNumero);
      if (!nivel) {
        console.warn(`   ⚠️  No se encontró el nivel ${misionData.nivelNumero}.`);
        continue;
      }

      let mision = await misionesRepo.findOne({
        where: { nivelId: nivel.id, esPrincipal: true },
      });

      if (mision) {
        mision.titulo = misionData.titulo;
        mision.enunciado = misionData.enunciado;
        mision.tipoInteraccion = misionData.tipoInteraccion;
        mision.contenidoJson = misionData.contenidoJson;
        mision.rubricJson = misionData.rubricJson;
        mision.competencia = misionData.competencia;
        mision.esPrincipal = misionData.esPrincipal;
        mision.vidasIniciales = misionData.vidasIniciales;
        mision.xpRecompensa = misionData.xpRecompensa;
        mision.puntosInvestigacion = misionData.puntosInvestigacion;
        await misionesRepo.save(mision);
        actualizadas++;
      } else {
        mision = misionesRepo.create({
          nivelId: nivel.id,
          titulo: misionData.titulo,
          enunciado: misionData.enunciado,
          tipoInteraccion: misionData.tipoInteraccion,
          contenidoJson: misionData.contenidoJson,
          rubricJson: misionData.rubricJson,
          competencia: misionData.competencia,
          esPrincipal: misionData.esPrincipal,
          vidasIniciales: misionData.vidasIniciales,
          xpRecompensa: misionData.xpRecompensa,
          puntosInvestigacion: misionData.puntosInvestigacion,
        });
        await misionesRepo.save(mision);
        insertadas++;
      }
    }

    console.log('\n✅ Seed de MISIONES de ARTÍCULO completado');
    console.log(`   - Misiones insertadas: ${insertadas}`);
    console.log(`   - Misiones actualizadas: ${actualizadas}`);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed de misiones de artículo:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();