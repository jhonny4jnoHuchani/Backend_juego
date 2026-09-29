import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de MISIONES de TESINA...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadTesina = await modalidadesRepo.findOne({
      where: { nombre: 'tesina' },
    });

    if (!modalidadTesina) {
      throw new Error('No se encontró la modalidad "tesina".');
    }

    const nivelesRepo = dataSource.getRepository(Nivel);
    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadTesina.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error('No hay niveles de tesina. Ejecuta primero `seed:tesina`.');
    }

    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) nivelesPorNumero.set(nivel.numero, nivel);

    const misionesData = [
      {
        nivelNumero: 1,
        titulo: 'MISIÓN 1: Convierte una idea en problema investigable',
        enunciado:
          'Delimita el tema de tu tesina y formula el problema central a partir de una situación real que necesite explicación o solución.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Redacta la ficha inicial del problema.',
          pasos: [
            'Describe la situación problemática con contexto.',
            'Identifica qué se conoce y qué falta conocer.',
            'Delimita población, lugar y periodo.',
            'Formula la pregunta central de investigación.',
          ],
          producto: 'Problema delimitado y pregunta central.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'situacion', descripcion: 'Describe una situación real y relevante', peso: 25 },
            { nombre: 'delimitacion', descripcion: 'Delimita población, lugar y periodo', peso: 25 },
            { nombre: 'vacío', descripcion: 'Explica qué falta conocer o resolver', peso: 20 },
            { nombre: 'pregunta', descripcion: 'Formula una pregunta clara y respondible', peso: 30 },
          ],
        },
        competencia: 'planteamiento del problema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 130,
        puntosInvestigacion: 25,
      },
      {
        nivelNumero: 2,
        titulo: 'MISIÓN 2: Alinea objetivos y variables',
        enunciado:
          'Construye el objetivo general y los objetivos específicos de tu tesina. Identifica las variables o categorías que necesitarás estudiar.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Alinea pregunta, objetivos y variables o categorías.',
          pasos: [
            'Escribe un objetivo general con verbo en infinitivo.',
            'Divide el objetivo en tres o cuatro objetivos específicos.',
            'Comprueba que cada objetivo responda a la pregunta.',
            'Identifica las variables o categorías principales.',
          ],
          controlCoherencia:
            'Cada objetivo debe poder demostrarse con datos y no repetir a otro.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'objetivo_general', descripcion: 'Es claro, medible y coherente con la pregunta', peso: 30 },
            { nombre: 'objetivos_especificos', descripcion: 'Ordena acciones concretas y alcanzables', peso: 30 },
            { nombre: 'variables', descripcion: 'Identifica variables o categorías pertinentes', peso: 20 },
            { nombre: 'alineacion', descripcion: 'Mantiene coherencia entre problema y objetivos', peso: 20 },
          ],
        },
        competencia: 'formulación de objetivos y variables',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 150,
        puntosInvestigacion: 30,
      },
      {
        nivelNumero: 3,
        titulo: 'MISIÓN 3: Construye un marco teórico que argumente',
        enunciado:
          'Selecciona antecedentes y teorías para explicar tu problema. No copies definiciones: organiza un argumento que sostenga tu investigación.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Elabora el esquema documentado de tu marco teórico.',
          pasos: [
            'Busca antecedentes directamente relacionados y registra autor, año y aporte.',
            'Selecciona teorías o modelos que expliquen el fenómeno.',
            'Define conceptos y variables con fuentes académicas.',
            'Relaciona la literatura con tu pregunta y, si corresponde, formula hipótesis.',
          ],
          producto: 'Esquema de capítulos y matriz de antecedentes con citas.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'antecedentes', descripcion: 'Selecciona antecedentes pertinentes', peso: 25 },
            { nombre: 'teorias', descripcion: 'Usa teorías o modelos adecuados', peso: 25 },
            { nombre: 'sintesis', descripcion: 'Compara y conecta las fuentes', peso: 30 },
            { nombre: 'citas', descripcion: 'Cita las fuentes de forma responsable', peso: 20 },
          ],
        },
        competencia: 'antecedentes y marco teórico',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 190,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 4,
        titulo: 'MISIÓN 4: Lleva los conceptos al método',
        enunciado:
          'Operacionaliza tus variables o categorías y diseña una metodología coherente con la pregunta de tu tesina.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Completa la matriz de consistencia metodológica.',
          pasos: [
            'Divide cada variable en dimensiones e indicadores, o cada categoría en subcategorías.',
            'Define enfoque, tipo y diseño con una justificación.',
            'Describe población, muestra o participantes.',
            'Relaciona objetivos, indicadores, técnicas e instrumentos.',
          ],
          matrizMinima: [
            'Objetivo específico',
            'Variable o categoría',
            'Dimensión o subcategoría',
            'Indicador',
            'Técnica e instrumento',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'operacionalizacion', descripcion: 'Pasa conceptos a dimensiones e indicadores observables', peso: 30 },
            { nombre: 'metodologia', descripcion: 'El enfoque y diseño responden al problema', peso: 25 },
            { nombre: 'muestra', descripcion: 'Define unidad de análisis y selección', peso: 20 },
            { nombre: 'consistencia', descripcion: 'Alinea objetivos, indicadores e instrumentos', peso: 25 },
          ],
        },
        competencia: 'operacionalización y metodología',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 210,
        puntosInvestigacion: 45,
      },
      {
        nivelNumero: 5,
        titulo: 'MISIÓN 5: Recoge datos con rigor y ética',
        enunciado:
          'Diseña el instrumento y el procedimiento de recolección de datos. Incluye validación, aplicación y protección de los participantes.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Presenta tu plan de recolección de datos.',
          pasos: [
            'Elige la técnica según tus indicadores o categorías.',
            'Diseña preguntas, ítems o guía de observación sin ambigüedades.',
            'Explica validación, prueba piloto o revisión del instrumento.',
            'Describe aplicación, consentimiento, confidencialidad y resguardo de datos.',
          ],
          listaVerificacion: [
            'Instrumento alineado con objetivos',
            'Procedimiento reproducible',
            'Consentimiento informado',
            'Confidencialidad y almacenamiento seguro',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'instrumento', descripcion: 'El instrumento recoge la información necesaria', peso: 30 },
            { nombre: 'procedimiento', descripcion: 'Explica cómo y cuándo se aplicará', peso: 25 },
            { nombre: 'validacion', descripcion: 'Incluye validación o prueba piloto', peso: 20 },
            { nombre: 'etica', descripcion: 'Protege derechos y confidencialidad', peso: 25 },
          ],
        },
        competencia: 'instrumentos, procedimiento y ética',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 200,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 6,
        titulo: 'MISIÓN 6: Convierte datos en resultados',
        enunciado:
          'Analiza la información reunida y presenta los resultados de tu tesina respondiendo a cada objetivo específico.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Redacta un resultado por objetivo específico.',
          pasos: [
            'Organiza los datos según objetivos, variables o categorías.',
            'Selecciona tablas, gráficos, citas o matrices que evidencien los hallazgos.',
            'Describe patrones y diferencias sin exagerar.',
            'Separa la presentación del resultado de su interpretación.',
          ],
          advertencia:
            'No inventes datos, no ocultes resultados contradictorios y no confundas asociación con causalidad.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'organizacion', descripcion: 'Ordena los resultados por objetivos', peso: 25 },
            { nombre: 'evidencia', descripcion: 'Usa evidencia suficiente y pertinente', peso: 30 },
            { nombre: 'analisis', descripcion: 'Aplica un análisis coherente con el método', peso: 30 },
            { nombre: 'objetividad', descripcion: 'Evita afirmaciones no respaldadas', peso: 15 },
          ],
        },
        competencia: 'análisis y presentación de resultados',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 220,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 7,
        titulo: 'MISIÓN 7: Cierra la tesina con trazabilidad',
        enunciado:
          'Redacta conclusiones y recomendaciones a partir de los hallazgos. Revisa limitaciones y construye las referencias en APA 7.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Prepara el cierre académico de tu tesina.',
          pasos: [
            'Responde cada objetivo con un hallazgo concreto.',
            'Explica el aporte principal y reconoce las limitaciones.',
            'Propón recomendaciones que se desprendan de la evidencia.',
            'Revisa que todas las citas estén en la lista de referencias y aplica APA 7.',
          ],
          prohibiciones: [
            'No introduzcas resultados nuevos.',
            'No conviertas recomendaciones en opiniones sin base.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'conclusiones', descripcion: 'Responde los objetivos con hallazgos concretos', peso: 35 },
            { nombre: 'aporte_limitaciones', descripcion: 'Explica aporte y limitaciones', peso: 25 },
            { nombre: 'recomendaciones', descripcion: 'Propone acciones derivadas de la evidencia', peso: 15 },
            { nombre: 'referencias', descripcion: 'Aplica APA 7 y mantiene trazabilidad', peso: 25 },
          ],
        },
        competencia: 'conclusiones, recomendaciones y referencias',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 230,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 8,
        titulo: 'MISIÓN 8: Defiende tu tesina ante el tribunal',
        enunciado:
          'Prepara una defensa breve y responde preguntas sobre las decisiones, resultados, límites y aporte de tu investigación.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Escribe el guion de tu exposición y respuestas al tribunal.',
          pasos: [
            'Expón problema, pregunta y objetivo en el inicio.',
            'Resume método, muestra e instrumentos sin leer todo el documento.',
            'Presenta los resultados y la conclusión principal con evidencia.',
            'Prepara respuestas para una pregunta metodológica, una limitación y una sobre el aporte.',
          ],
          estructura:
            'Problema → objetivos → método → resultados → conclusiones → aporte y límites.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'estructura', descripcion: 'Presenta el proceso en un orden lógico', peso: 25 },
            { nombre: 'dominio', descripcion: 'Demuestra dominio de método y resultados', peso: 30 },
            { nombre: 'evidencia', descripcion: 'Sustenta respuestas con datos y fuentes', peso: 25 },
            { nombre: 'respuesta', descripcion: 'Responde con claridad y reconoce límites', peso: 20 },
          ],
        },
        competencia: 'defensa académica de la tesina',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 300,
        puntosInvestigacion: 60,
      },
    ];

    const misionesRepo = dataSource.getRepository(Mision);
    let insertadas = 0;
    let actualizadas = 0;

    for (const misionData of misionesData) {
      const nivel = nivelesPorNumero.get(misionData.nivelNumero);
      if (!nivel) {
        console.log(`   ⚠️  No se encontró el nivel ${misionData.nivelNumero}.`);
        continue;
      }

      const existeMision = await misionesRepo.findOne({
        where: { nivelId: nivel.id, esPrincipal: true },
      });

      if (existeMision) {
        await misionesRepo.update(
          { id: existeMision.id },
          {
            titulo: misionData.titulo,
            enunciado: misionData.enunciado,
            tipoInteraccion: misionData.tipoInteraccion,
            contenidoJson: misionData.contenidoJson as any,
            rubricJson: misionData.rubricJson as any,
            competencia: misionData.competencia,
            esPrincipal: misionData.esPrincipal,
            vidasIniciales: misionData.vidasIniciales,
            xpRecompensa: misionData.xpRecompensa,
            puntosInvestigacion: misionData.puntosInvestigacion,
          } as any,
        );
        actualizadas++;
        continue;
      }

      const nuevaMision = misionesRepo.create({
        nivelId: nivel.id,
        titulo: misionData.titulo,
        enunciado: misionData.enunciado,
        tipoInteraccion: misionData.tipoInteraccion,
        contenidoJson: misionData.contenidoJson as any,
        rubricJson: misionData.rubricJson as any,
        competencia: misionData.competencia,
        esPrincipal: misionData.esPrincipal,
        vidasIniciales: misionData.vidasIniciales,
        xpRecompensa: misionData.xpRecompensa,
        puntosInvestigacion: misionData.puntosInvestigacion,
      });

      await misionesRepo.save(nuevaMision);
      insertadas++;
    }

    console.log('\n✅ Seed de MISIONES de TESINA completado');
    console.log(`   - Misiones insertadas: ${insertadas}`);
    console.log(`   - Misiones actualizadas: ${actualizadas}`);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed de misiones:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();