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
        titulo: 'MISIÓN 1: Define el artículo que sí puede publicarse',
        enunciado:
          'Toma una idea amplia y conviértela en el tema de un artículo. Define el fenómeno o variable, la población, el contexto, el periodo y la contribución que esperas ofrecer.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacta la ficha de delimitación de tu artículo.',
          pasos: [
            'Escribe el fenómeno, variable o categoría central.',
            'Delimita la población o unidad de análisis.',
            'Indica lugar y periodo del estudio.',
            'Explica en dos líneas qué vacío o aporte aborda el artículo.',
          ],
          formatoRespuesta:
            'Tema delimitado + población + lugar + periodo + aporte esperado.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'tema_especifico', descripcion: 'Define un fenómeno o variable concreto', peso: 25 },
            { nombre: 'delimitacion', descripcion: 'Incluye población, lugar y periodo', peso: 30 },
            { nombre: 'aporte', descripcion: 'Explica una contribución investigable', peso: 25 },
            { nombre: 'viabilidad', descripcion: 'El alcance puede resolverse en un artículo', peso: 20 },
          ],
        },
        competencia: 'delimitación del tema y contribución',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 120,
        puntosInvestigacion: 25,
      },
      {
        nivelNumero: 2,
        titulo: 'MISIÓN 2: Abre la puerta con una introducción sólida',
        enunciado:
          'Redacta el esqueleto de la introducción de tu artículo: contexto del problema, evidencia previa, vacío de conocimiento, pregunta y objetivo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Construye una introducción breve y ordenada.',
          pasos: [
            'Presenta el problema con una fuente actual.',
            'Resume qué se conoce y qué todavía no está resuelto.',
            'Formula la pregunta de investigación.',
            'Cierra con el objetivo general del artículo.',
          ],
          advertencias: [
            'No uses afirmaciones sin fuente.',
            'No presentes la metodología antes de justificar el estudio.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'contexto', descripcion: 'Contextualiza el problema con evidencia', peso: 25 },
            { nombre: 'vacio', descripcion: 'Identifica un vacío o tensión en la literatura', peso: 25 },
            { nombre: 'pregunta', descripcion: 'Formula una pregunta clara y delimitada', peso: 25 },
            { nombre: 'objetivo', descripcion: 'El objetivo responde a la pregunta', peso: 25 },
          ],
        },
        competencia: 'introducción y planteamiento del problema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 140,
        puntosInvestigacion: 30,
      },
      {
        nivelNumero: 3,
        titulo: 'MISIÓN 3: Construye el argumento científico',
        enunciado:
          'Organiza el sustento de tu artículo para demostrar por qué tu estudio es necesario y cómo se relacionan sus conceptos, variables o categorías.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Elabora un mapa del argumento teórico.',
          pasos: [
            'Selecciona tres a cinco antecedentes directamente relacionados.',
            'Define los conceptos centrales con fuentes académicas.',
            'Explica la relación entre variables o categorías.',
            'Formula la hipótesis solo si corresponde a tu enfoque.',
          ],
          producto:
            'Mapa conceptual o esquema de párrafos con citas autor-año.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'antecedentes', descripcion: 'Usa antecedentes pertinentes y recientes', peso: 25 },
            { nombre: 'conceptos', descripcion: 'Define los conceptos con fuentes', peso: 25 },
            { nombre: 'coherencia', descripcion: 'Conecta teoría, variables y pregunta', peso: 30 },
            { nombre: 'hipotesis', descripcion: 'Incluye una hipótesis comprobable cuando corresponde', peso: 20 },
          ],
        },
        competencia: 'sustento teórico y argumento científico',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 160,
        puntosInvestigacion: 35,
      },
      {
        nivelNumero: 4,
        titulo: 'MISIÓN 4: Haz replicable tu metodología',
        enunciado:
          'Escribe el plan metodológico de tu artículo para que otro investigador entienda exactamente cómo obtendrás y analizarás los datos.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacta la metodología en el orden correcto.',
          pasos: [
            'Indica enfoque, tipo y diseño, y justifica cada elección.',
            'Define población, muestra o participantes.',
            'Describe técnica, instrumento y procedimiento.',
            'Explica cómo analizarás los datos y qué aspectos éticos atenderás.',
          ],
          listaVerificacion: [
            'Enfoque y diseño',
            'Población y muestra',
            'Instrumentos y procedimiento',
            'Plan de análisis y ética',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'diseno', descripcion: 'El enfoque, tipo y diseño son coherentes', peso: 25 },
            { nombre: 'muestra', descripcion: 'Delimita participantes y selección', peso: 25 },
            { nombre: 'procedimiento', descripcion: 'Permite comprender cómo se recogerán los datos', peso: 25 },
            { nombre: 'analisis_etica', descripcion: 'Incluye análisis y resguardos éticos', peso: 25 },
          ],
        },
        competencia: 'diseño metodológico de artículo',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 180,
        puntosInvestigacion: 40,
      },
      {
        nivelNumero: 5,
        titulo: 'MISIÓN 5: Presenta resultados sin interpretarlos de más',
        enunciado:
          'Redacta la presentación de un hallazgo central de tu artículo. Debe responder a un objetivo y apoyarse en datos, tablas, figuras o categorías.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Presenta un resultado con evidencia y lenguaje objetivo.',
          pasos: [
            'Indica qué objetivo o pregunta responde.',
            'Presenta el dato, patrón o categoría principal.',
            'Menciona la evidencia que lo respalda.',
            'Separa la descripción del resultado de su interpretación.',
          ],
          regla:
            'No confundas correlación con causalidad ni inventes resultados que aún no tienes.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'relacion_objetivo', descripcion: 'El resultado responde a un objetivo', peso: 25 },
            { nombre: 'evidencia', descripcion: 'Presenta datos o evidencia concreta', peso: 35 },
            { nombre: 'objetividad', descripcion: 'Usa lenguaje descriptivo sin exagerar', peso: 25 },
            { nombre: 'orden', descripcion: 'Organiza el resultado con claridad', peso: 15 },
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
        titulo: 'MISIÓN 6: Discute y cierra con evidencia',
        enunciado:
          'Interpreta tu hallazgo, compáralo con antecedentes, reconoce una limitación y redacta una conclusión que responda al objetivo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Escribe un párrafo de discusión y una conclusión.',
          pasos: [
            'Explica qué significa el hallazgo para tu problema.',
            'Compáralo con al menos un antecedente.',
            'Reconoce una limitación que afecte el alcance.',
            'Redacta una conclusión concreta vinculada al objetivo.',
          ],
          evitar: [
            'Afirmar causalidad sin diseño que la demuestre.',
            'Introducir resultados o temas nuevos en la conclusión.',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'interpretacion', descripcion: 'Interpreta el hallazgo con rigor', peso: 25 },
            { nombre: 'contraste', descripcion: 'Contrasta con literatura previa', peso: 25 },
            { nombre: 'limitacion', descripcion: 'Reconoce una limitación real', peso: 20 },
            { nombre: 'conclusion', descripcion: 'Responde directamente al objetivo', peso: 30 },
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
        titulo: 'MISIÓN 7: Deja listo el manuscrito',
        enunciado:
          'Completa los elementos que permiten encontrar, evaluar y publicar tu artículo: resumen, palabras clave, citas, referencias, originalidad y formato.',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion: 'Revisa el manuscrito con una lista editorial de control.',
          pasos: [
            'Resume objetivo, método, resultado y conclusión en un solo texto.',
            'Selecciona de cuatro a seis palabras clave específicas.',
            'Comprueba que cada cita tenga su referencia y viceversa.',
            'Verifica formato, ética, consentimiento y originalidad.',
          ],
          erroresObjetivo: [
            'Resumen sin resultados',
            'Palabras clave demasiado generales',
            'Cita sin referencia',
            'Referencia no citada',
            'Afirmación sin fuente',
          ],
        },
        rubricJson: {
          criterios: [
            { nombre: 'resumen', descripcion: 'Integra propósito, método, resultados y conclusión', peso: 25 },
            { nombre: 'indexacion', descripcion: 'Usa palabras clave precisas', peso: 15 },
            { nombre: 'apa', descripcion: 'Relaciona correctamente citas y referencias', peso: 30 },
            { nombre: 'etica_formato', descripcion: 'Revisa ética, originalidad y formato editorial', peso: 30 },
          ],
        },
        competencia: 'preparación editorial y APA 7',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 220,
        puntosInvestigacion: 50,
      },
      {
        nivelNumero: 8,
        titulo: 'MISIÓN 8: Supera la revisión por pares',
        enunciado:
          'Un revisor observa que tu muestra es pequeña y que falta sustento teórico. Responde de forma profesional, argumentada y concreta, indicando qué cambiarás.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Redacta una carta de respuesta a revisores.',
          pasos: [
            'Agradece y repite brevemente cada observación.',
            'Explica la respuesta metodológica o bibliográfica.',
            'Indica el cambio realizado y la sección donde aparece.',
            'Si no aceptas una sugerencia, justifica la decisión con evidencia.',
          ],
          estructura:
            'Observación del revisor → respuesta → cambio realizado → ubicación en el manuscrito.',
        },
        rubricJson: {
          criterios: [
            { nombre: 'tono', descripcion: 'Mantiene un tono profesional y respetuoso', peso: 25 },
            { nombre: 'respuesta', descripcion: 'Responde cada observación de forma directa', peso: 30 },
            { nombre: 'argumento', descripcion: 'Usa fundamentos metodológicos o bibliográficos', peso: 30 },
            { nombre: 'trazabilidad', descripcion: 'Indica cambios y ubicación en el manuscrito', peso: 15 },
          ],
        },
        competencia: 'respuesta a revisores y publicación',
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