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
        titulo: 'MISIÓN 1: Formule un problema de investigación',
        enunciado:
          'Delimite el tema de la tesina y formule el problema central a partir de una situación concreta que requiera explicación o solución.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Elabore la ficha inicial del problema de investigación.',
          pasos: [
            'Describa la situación problemática y su contexto.',
            'Identifique el conocimiento disponible y los aspectos que requieren mayor estudio.',
            'Delimite la población, el lugar y el periodo.',
            'Formule la pregunta central de investigación.',
          ],
          producto: 'Problema de investigación delimitado y pregunta central.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'situacion', descripcion: 'Describe una situación concreta y pertinente', peso: 25 },
            { nombre: 'delimitacion', descripcion: 'Precisa la población, el lugar y el periodo', peso: 25 },
            { nombre: 'vacío', descripcion: 'Identifica el aspecto que se requiere conocer o resolver', peso: 20 },
            { nombre: 'pregunta', descripcion: 'Formula una pregunta clara y susceptible de respuesta', peso: 30 },
          ],
        },
        competencia: 'formulación del problema de investigación',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 130,
        puntosInvestigacion: 25,
      },
      {
        nivelNumero: 2,
        titulo: 'MISIÓN 2: Articule los objetivos y las variables',
        enunciado:
          'Formule el objetivo general y los objetivos específicos de la tesina. Identifique las variables o categorías pertinentes para el estudio.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Alinee la pregunta, los objetivos y las variables o categorías.',
          pasos: [
            'Redacte un objetivo general con un verbo en infinitivo.',
            'Desglose el objetivo general en tres o cuatro objetivos específicos.',
            'Verifique que cada objetivo contribuya a responder la pregunta de investigación.',
            'Identifique las principales variables o categorías de análisis.',
          ],
          controlCoherencia:
            'Cada objetivo debe ser verificable mediante evidencia y distinguirse claramente de los demás.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'objetivo_general', descripcion: 'Es claro, evaluable y coherente con la pregunta', peso: 30 },
            { nombre: 'objetivos_especificos', descripcion: 'Define acciones secuenciales, concretas y alcanzables', peso: 30 },
            { nombre: 'variables', descripcion: 'Identifica variables o categorías pertinentes al estudio', peso: 20 },
            { nombre: 'alineacion', descripcion: 'Mantiene coherencia entre el problema y los objetivos', peso: 20 },
          ],
        },
        competencia: 'formulación de objetivos y definición de variables o categorías',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 150,
        puntosInvestigacion: 30,
      },
      {
        nivelNumero: 3,
        titulo: 'MISIÓN 3: Elabore una fundamentación teórica argumentada',
        enunciado:
          'Seleccione antecedentes y teorías pertinentes para explicar el problema de investigación. Integre las fuentes en una argumentación que sustente el estudio, en lugar de limitarse a reproducir definiciones.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Elabore un esquema documentado del marco teórico.',
          pasos: [
            'Localice antecedentes directamente relacionados y registre la autoría, el año y la contribución de cada fuente.',
            'Seleccione teorías o modelos pertinentes para explicar el fenómeno.',
            'Defina los conceptos y las variables con apoyo de fuentes académicas.',
            'Vincule la literatura con la pregunta de investigación y formule hipótesis cuando corresponda.',
          ],
          producto: 'Esquema de capítulos y matriz de antecedentes con citas bibliográficas.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'antecedentes', descripcion: 'Selecciona antecedentes pertinentes para el problema', peso: 25 },
            { nombre: 'teorias', descripcion: 'Aplica teorías o modelos adecuados al objeto de estudio', peso: 25 },
            { nombre: 'sintesis', descripcion: 'Compara e integra las fuentes consultadas', peso: 30 },
            { nombre: 'citas', descripcion: 'Cita las fuentes con precisión y responsabilidad académica', peso: 20 },
          ],
        },
        competencia: 'revisión de antecedentes y elaboración del marco teórico',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 190,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 4,
        titulo: 'MISIÓN 4: Vincule los conceptos con la metodología',
        enunciado:
          'Operacionalice las variables o categorías y diseñe una metodología coherente con la pregunta de investigación de la tesina.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Complete la matriz de consistencia metodológica.',
          pasos: [
            'Desglose cada variable en dimensiones e indicadores, o cada categoría en subcategorías.',
            'Defina y justifique el enfoque, el tipo y el diseño de investigación.',
            'Describa la población, la muestra o las características de las personas participantes.',
            'Articule los objetivos con los indicadores, las técnicas y los instrumentos.',
          ],
          matrizMinima: [
            'Objetivo específico',
            'Variable o categoría de análisis',
            'Dimensión o subcategoría',
            'Indicador',
            'Técnica e instrumento de recolección',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'operacionalizacion', descripcion: 'Traduce los conceptos en dimensiones e indicadores observables', peso: 30 },
            { nombre: 'metodologia', descripcion: 'Adecua el enfoque y el diseño al problema de investigación', peso: 25 },
            { nombre: 'muestra', descripcion: 'Define la unidad de análisis y el procedimiento de selección', peso: 20 },
            { nombre: 'consistencia', descripcion: 'Articula los objetivos con los indicadores y los instrumentos', peso: 25 },
          ],
        },
        competencia: 'operacionalización de variables y diseño metodológico',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 210,
        puntosInvestigacion: 45,
      },
      {
        nivelNumero: 5,
        titulo: 'MISIÓN 5: Planifique la recolección de datos con rigor ético',
        enunciado:
          'Diseñe el instrumento y el procedimiento para recopilar los datos. Incluya la validación, las condiciones de aplicación y las medidas para proteger a las personas participantes.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Presente el plan de recolección de datos.',
          pasos: [
            'Seleccione la técnica de acuerdo con los indicadores o las categorías de análisis.',
            'Diseñe preguntas, ítems o una guía de observación con redacción clara y precisa.',
            'Describa el proceso de validación, la prueba piloto o la revisión del instrumento.',
            'Especifique las condiciones de aplicación, el consentimiento informado, la confidencialidad y el resguardo de los datos.',
          ],
          listaVerificacion: [
            'Instrumento coherente con los objetivos',
            'Procedimiento claramente documentado y reproducible',
            'Consentimiento informado',
            'Confidencialidad y almacenamiento seguro de la información',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'instrumento', descripcion: 'El instrumento recopila la información necesaria para el estudio', peso: 30 },
            { nombre: 'procedimiento', descripcion: 'Especifica cómo y cuándo se aplicará el instrumento', peso: 25 },
            { nombre: 'validacion', descripcion: 'Incluye un proceso de validación o una prueba piloto', peso: 20 },
            { nombre: 'etica', descripcion: 'Protege los derechos y la confidencialidad de las personas participantes', peso: 25 },
          ],
        },
        competencia: 'diseño de instrumentos, procedimientos y resguardos éticos',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 200,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 6,
        titulo: 'MISIÓN 6: Analice los datos y presente los resultados',
        enunciado:
          'Analice la información recopilada y presente los resultados de la tesina en correspondencia con cada objetivo específico.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Redacte los resultados en función de cada objetivo específico.',
          pasos: [
            'Organice los datos de acuerdo con los objetivos, las variables o las categorías.',
            'Seleccione tablas, gráficos, citas o matrices que documenten los hallazgos.',
            'Describa los patrones y las diferencias con precisión y sin sobredimensionarlos.',
            'Distinga la presentación de los resultados de su interpretación.',
          ],
          advertencia:
            'No invente ni omita datos, incluidos los resultados contradictorios; tampoco interprete una asociación como una relación causal sin evidencia suficiente.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'organizacion', descripcion: 'Organiza los resultados de acuerdo con los objetivos', peso: 25 },
            { nombre: 'evidencia', descripcion: 'Presenta evidencia suficiente y pertinente', peso: 30 },
            { nombre: 'analisis', descripcion: 'Aplica un análisis coherente con la metodología', peso: 30 },
            { nombre: 'objetividad', descripcion: 'Evita formular afirmaciones que carezcan de respaldo', peso: 15 },
          ],
        },
        competencia: 'análisis de datos y presentación de resultados',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 220,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 7,
        titulo: 'MISIÓN 7: Elabore conclusiones y referencias verificables',
        enunciado:
          'Formule conclusiones y recomendaciones sustentadas en los hallazgos. Reconozca las limitaciones del estudio y elabore las referencias conforme a APA 7.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Prepare el cierre académico de la tesina.',
          pasos: [
            'Responda a cada objetivo mediante un hallazgo concreto.',
            'Exponga la contribución principal y reconozca las limitaciones del estudio.',
            'Proponga recomendaciones derivadas de la evidencia.',
            'Verifique que todas las citas aparezcan en la lista de referencias y aplique APA 7.',
          ],
          prohibiciones: [
            'No incorpore resultados que no se hayan presentado previamente.',
            'Evite formular recomendaciones que no estén respaldadas por la evidencia.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'conclusiones', descripcion: 'Responde a los objetivos con hallazgos concretos', peso: 35 },
            { nombre: 'aporte_limitaciones', descripcion: 'Expone la contribución y las limitaciones del estudio', peso: 25 },
            { nombre: 'recomendaciones', descripcion: 'Propone acciones fundamentadas en la evidencia', peso: 15 },
            { nombre: 'referencias', descripcion: 'Aplica APA 7 y asegura la correspondencia entre citas y referencias', peso: 25 },
          ],
        },
        competencia: 'elaboración de conclusiones, recomendaciones y referencias',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 230,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 8,
        titulo: 'MISIÓN 8: Sustente la tesina ante el tribunal',
        enunciado:
          'Prepare una exposición concisa y responda las preguntas del tribunal sobre las decisiones metodológicas, los resultados, las limitaciones y la contribución de la investigación.',
        tipoInteraccion: 'texto_libre' as const,
        contenidoJson: {
          instruccion: 'Elabore el guion de la exposición y prepare las respuestas para el tribunal.',
          pasos: [
            'Presente el problema, la pregunta y el objetivo al inicio de la exposición.',
            'Sintetice el método, la muestra y los instrumentos sin leer íntegramente el documento.',
            'Exponga los resultados y la conclusión principal con respaldo en la evidencia.',
            'Prepare respuestas sobre una decisión metodológica, una limitación y la contribución del estudio.',
          ],
          estructura:
            'Problema → objetivos → metodología → resultados → conclusiones → contribución y limitaciones.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'estructura', descripcion: 'Expone el proceso de investigación en un orden lógico', peso: 25 },
            { nombre: 'dominio', descripcion: 'Demuestra dominio de la metodología y los resultados', peso: 30 },
            { nombre: 'evidencia', descripcion: 'Fundamenta las respuestas con datos y fuentes pertinentes', peso: 25 },
            { nombre: 'respuesta', descripcion: 'Responde con claridad y reconoce las limitaciones del estudio', peso: 20 },
          ],
        },
        competencia: 'presentación y defensa académica de la tesina',
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