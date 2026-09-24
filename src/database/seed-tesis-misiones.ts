import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de MISIONES de TESIS...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // ============================================================
    // 1. Verificar modalidad "tesis"
    // ============================================================
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadTesis = await modalidadesRepo.findOne({
      where: { nombre: 'tesis' },
    });

    if (!modalidadTesis) {
      throw new Error(
        'No se encontró la modalidad "tesis". Ejecuta primero `npm run seed` y `npm run seed:tesis`.',
      );
    }

    console.log(
      `   ℹ️  Modalidad "tesis" encontrada (id: ${modalidadTesis.id})\n`,
    );

    // ============================================================
    // 2. Cargar niveles de tesis
    // ============================================================
    const nivelesRepo = dataSource.getRepository(Nivel);
    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadTesis.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error(
        'No hay niveles de tesis. Ejecuta primero `npm run seed:tesis`.',
      );
    }

    console.log(`   ℹ️  ${niveles.length} niveles encontrados\n`);

    // Mapa de niveles por número (para acceso rápido)
    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) {
      nivelesPorNumero.set(nivel.numero, nivel);
    }

    // ============================================================
    // 3. Definir las 18 misiones
    // ============================================================
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
      // ==========================================================
      // ⬇️ BLOQUE 1: Misiones 1-4
            // ---------- MISIÓN 1: Del tema vago al tema investigable ----------
      {
        nivelNumero: 1,
        titulo: 'MISIÓN 1: Del tema vago al tema investigable',
        enunciado:
          'Un estudiante te muestra su tema: "La inteligencia artificial en estudiantes universitarios". ' +
          'Su tutor le dijo: "Ese tema es demasiado amplio. Delimítalo con variable, población, lugar y tiempo."\n\n' +
          'TU MISIÓN: Aplica lo mismo a TU PROPIO tema de investigación. Reescríbelo incluyendo los 4 elementos.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Delimita TU tema con los 4 elementos: variable, población, lugar y tiempo',
          ejemplo: {
            temaVago: 'La inteligencia artificial en estudiantes universitarios',
            respuestaEjemplo:
              'Impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz, 2025',
            explicacion:
              'Cumple con: variable (rendimiento académico), población (estudiantes de Ingeniería), lugar (Universidad X, La Paz) y tiempo (2025).',
          },
          requisitos: [
            'Variable o fenómeno específico a estudiar',
            'Población delimitada (quiénes)',
            'Lugar donde se realizará la investigación',
            'Período de tiempo (año o rango)',
          ],
          ayuda:
            'Un buen tema responde QUÉ, QUIÉNES, DÓNDE y CUÁNDO. Si te falta alguno, el tema es demasiado amplio.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_clara',
              descripcion:
                'El tema identifica una variable o fenómeno específico a estudiar',
              peso: 30,
            },
            {
              nombre: 'poblacion_definida',
              descripcion:
                'El tema especifica claramente quiénes serán los sujetos de estudio',
              peso: 25,
            },
            {
              nombre: 'lugar_delimitado',
              descripcion:
                'El tema menciona el lugar donde se realizará la investigación',
              peso: 20,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'El tema indica el período de tiempo de la investigación',
              peso: 25,
            },
          ],
        },
        competencia: 'delimitación del tema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 100,
        puntosInvestigacion: 20,
      },

      // ---------- MISIÓN 2: El problema oculto ----------
      {
        nivelNumero: 2,
        titulo: 'MISIÓN 2: El problema oculto',
        enunciado:
          'Un grupo de investigadores afirma que "los estudiantes universitarios tienen dificultades para redactar sus investigaciones". ' +
          'Pero eso NO es un problema de investigación, es solo una afirmación vaga.\n\n' +
          'TU MISIÓN: Aplica lo mismo a TU tema. Formula el PROBLEMA de investigación siguiendo esta estructura: ' +
          '"¿Qué relación existe entre [variable 1] y [variable 2] en [población] de [lugar] durante [tiempo]?"',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Formula el problema de investigación de TU tema con la estructura sugerida',
          ejemplo: {
            afirmacionVaga:
              'Los estudiantes tienen dificultades para redactar sus investigaciones',
            problemaCorrecto:
              '¿Qué relación existe entre el uso de inteligencia artificial y el rendimiento académico en estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz durante 2025?',
            explicacion:
              'Un buen problema de investigación es una PREGUNTA clara que relaciona variables y delimita población, lugar y tiempo.',
          },
          requisitos: [
            'Es una pregunta (empieza con ¿)',
            'Relaciona al menos dos variables',
            'Menciona la población',
            'Menciona el lugar',
            'Menciona el tiempo',
          ],
          ayuda:
            'Un problema de investigación NO es una afirmación. Es una pregunta que el estudio busca responder.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'es_pregunta',
              descripcion: 'El problema está formulado como una pregunta clara',
              peso: 20,
            },
            {
              nombre: 'variables_relacionadas',
              descripcion: 'La pregunta relaciona al menos dos variables',
              peso: 30,
            },
            {
              nombre: 'poblacion_lugar',
              descripcion: 'Menciona la población y el lugar del estudio',
              peso: 25,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'Incluye el período de tiempo',
              peso: 25,
            },
          ],
        },
        competencia: 'planteamiento del problema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 120,
        puntosInvestigacion: 25,
      },

      // ---------- MISIÓN 3: El título perdido ----------
      {
        nivelNumero: 3,
        titulo: 'MISIÓN 3: El título perdido',
        enunciado:
          'Una estudiante escribió como título: "Inteligencia artificial en estudiantes universitarios". ' +
          'Su tutor le dijo que ese NO es un título científico, es solo un tema.\n\n' +
          'TU MISIÓN: Transforma TU tema en un TÍTULO CIENTÍFICO correcto. Un título científico debe incluir ' +
          'las variables, la relación entre ellas, la población, el lugar y el tiempo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Escribe el TÍTULO CIENTÍFICO de tu investigación',
          ejemplo: {
            tituloIncorrecto: 'Inteligencia artificial en estudiantes universitarios',
            tituloCorrecto:
              'Impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz, 2025',
            explicacion:
              'Un título científico es una versión compacta del tema, con variables, relación, población, lugar y tiempo.',
          },
          requisitos: [
            'Menciona las variables del estudio',
            'Indica la relación entre ellas (impacto, influencia, relación)',
            'Especifica la población',
            'Especifica el lugar',
            'Especifica el tiempo',
          ],
          ayuda:
            'Los títulos científicos suelen empezar con palabras como "Impacto de...", "Influencia de...", "Relación entre...".',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variables_explicitas',
              descripcion: 'El título menciona las variables del estudio',
              peso: 25,
            },
            {
              nombre: 'relacion_expresa',
              descripcion: 'Indica la relación entre las variables (impacto, influencia, relación)',
              peso: 25,
            },
            {
              nombre: 'poblacion_lugar',
              descripcion: 'Menciona la población y el lugar del estudio',
              peso: 25,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'Incluye el período de tiempo',
              peso: 25,
            },
          ],
        },
        competencia: 'formulación de título',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 130,
        puntosInvestigacion: 25,
      },

      // ---------- MISIÓN 4: La gran pregunta ----------
      {
        nivelNumero: 4,
        titulo: 'MISIÓN 4: La gran pregunta',
        enunciado:
          'Ya tienes tu tema, tu problema y tu título. Pero falta lo más importante: ' +
          'la PREGUNTA DE INVESTIGACIÓN. Esta debe ser DIRECTA, CLARA y RESPONDIBLE.\n\n' +
          'TU MISIÓN: Formula la pregunta de investigación de TU estudio. Debe ser específica y coherente con tu problema.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Formula la PREGUNTA DE INVESTIGACIÓN que tu estudio buscará responder',
          ejemplo: {
            preguntaVaga: '¿Cómo afecta la IA a los estudiantes?',
            preguntaCorrecta:
              '¿Cuál es el impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz durante 2025?',
            explicacion:
              'Una pregunta de investigación es específica, delimitada y respondible con datos. La versión vaga es demasiado amplia.',
          },
          requisitos: [
            'Es una pregunta clara (empieza con ¿)',
            'Es específica (no vaga)',
            'Delimita población, lugar y tiempo',
            'Es respondible mediante investigación',
          ],
          ayuda:
            'Una buena pregunta de investigación debe poder responderse con datos recolectables. Si es muy amplia, no sirve.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'es_pregunta',
              descripcion: 'Es una pregunta clara y directa',
              peso: 20,
            },
            {
              nombre: 'especificidad',
              descripcion: 'Es específica y delimitada (no vaga)',
              peso: 30,
            },
            {
              nombre: 'delimitacion',
              descripcion: 'Incluye población, lugar y tiempo',
              peso: 30,
            },
            {
              nombre: 'respondible',
              descripcion: 'Es respondible mediante investigación empírica',
              peso: 20,
            },
          ],
        },
        competencia: 'pregunta de investigación',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 140,
        puntosInvestigacion: 30,
      },

      // ==========================================================

      // ⬇️ BLOQUE 2: Misiones 5-8

            // ---------- MISIÓN 5: La brújula de la investigación ----------
      {
        nivelNumero: 5,
        titulo: 'MISIÓN 5: La brújula de la investigación',
        enunciado:
          'Un objetivo general es como una brújula: marca el destino de tu investigación. ' +
          'Sin él, tu estudio no sabe a dónde va.\n\n' +
          'TU MISIÓN: Formula el OBJETIVO GENERAL de TU investigación. Debe empezar con un verbo en infinitivo ' +
          '(analizar, determinar, evaluar, identificar...) y describir QUÉ lograrás con tu estudio.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Formula el OBJETIVO GENERAL de tu investigación con verbo + qué + población + lugar + tiempo',
          ejemplo: {
            objetivoIncorrecto: 'Quiero estudiar la inteligencia artificial',
            objetivoCorrecto:
              'Determinar el impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz durante 2025',
            explicacion:
              'Un objetivo general empieza con verbo en infinitivo (Determinar) e incluye qué, población, lugar y tiempo.',
          },
          requisitos: [
            'Empieza con verbo en infinitivo (determinar, analizar, evaluar...)',
            'Indica QUÉ se va a lograr',
            'Menciona la población',
            'Menciona el lugar y el tiempo',
          ],
          ayuda:
            'Verbos comunes para objetivos generales: Determinar, Analizar, Evaluar, Identificar, Establecer, Comparar.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'verbo_infinitivo',
              descripcion: 'Empieza con un verbo en infinitivo apropiado',
              peso: 25,
            },
            {
              nombre: 'que_claro',
              descripcion: 'Indica claramente QUÉ se busca lograr',
              peso: 30,
            },
            {
              nombre: 'poblacion_lugar',
              descripcion: 'Menciona la población y el lugar',
              peso: 25,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'Incluye el período de tiempo',
              peso: 20,
            },
          ],
        },
        competencia: 'objetivo general',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 150,
        puntosInvestigacion: 30,
      },

      // ---------- MISIÓN 6: Divide y vencerás ----------
      {
        nivelNumero: 6,
        titulo: 'MISIÓN 6: Divide y vencerás',
        enunciado:
          'Un objetivo general es grande. Para lograrlo, hay que dividirlo en objetivos específicos. ' +
          'Cada objetivo específico es un paso concreto que te acerca a la meta.\n\n' +
          'TU MISIÓN: A partir de TU objetivo general, formula 2 o 3 OBJETIVOS ESPECÍFICOS. ' +
          'Cada uno debe empezar con verbo en infinitivo y describir una acción concreta.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Formula 2-3 objetivos específicos de tu investigación, cada uno en una línea separada',
          ejemplo: {
            objetivoGeneral:
              'Determinar el impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X en La Paz durante 2025',
            objetivosEspecificos: [
              'Identificar las herramientas de inteligencia artificial más utilizadas por los estudiantes.',
              'Medir el rendimiento académico de los estudiantes en las materias principales.',
              'Establecer la relación entre el uso de IA y el rendimiento académico.',
            ],
            explicacion:
              'Los objetivos específicos descomponen el general. Cada uno es un paso lógico y medible.',
          },
          requisitos: [
            'Al menos 2 objetivos específicos',
            'Cada uno empieza con verbo en infinitivo',
            'Cada uno es un paso concreto y medible',
            'En conjunto, cubren el objetivo general',
          ],
          ayuda:
            'Cada objetivo específico responde a una parte del objetivo general. Piensa: ¿qué pasos necesito para lograr mi meta?',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'cantidad_adecuada',
              descripcion: 'Presenta al menos 2 objetivos específicos',
              peso: 20,
            },
            {
              nombre: 'verbos_infinitivos',
              descripcion: 'Todos los objetivos empiezan con verbo en infinitivo',
              peso: 25,
            },
            {
              nombre: 'concrecion',
              descripcion: 'Cada objetivo es concreto y medible',
              peso: 30,
            },
            {
              nombre: 'coherencia_general',
              descripcion: 'En conjunto, los objetivos cubren el objetivo general',
              peso: 25,
            },
          ],
        },
        competencia: 'objetivos específicos',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 160,
        puntosInvestigacion: 35,
      },

      // ---------- MISIÓN 7: Cazador de variables ----------
      {
        nivelNumero: 7,
        titulo: 'MISIÓN 7: Cazador de variables',
        enunciado:
          'Las variables son los elementos que vas a medir o analizar en tu investigación. ' +
          'Identificarlas bien es fundamental para que tu estudio tenga sentido.\n\n' +
          'TU MISIÓN: Identifica las VARIABLES de TU investigación. Debes indicar: ' +
          'cuál es la variable independiente (la que causa o influye) y cuál es la variable dependiente ' +
          '(la que es afectada). Si tu estudio es cualitativo, indica la categoría principal.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Identifica las variables de tu investigación (independiente y dependiente, o categorías)',
          ejemplo: {
            variableIndependiente: 'Uso de inteligencia artificial',
            variableDependiente: 'Rendimiento académico',
            explicacion:
              'La variable independiente (uso de IA) influye sobre la variable dependiente (rendimiento académico).',
          },
          requisitos: [
            'Identifica la variable independiente (o la categoría principal)',
            'Identifica la variable dependiente (o la categoría secundaria)',
            'Explica brevemente la relación entre ellas',
          ],
          ayuda:
            'Pregúntate: ¿qué estoy midiendo? ¿qué influye sobre qué? Eso te da las variables.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_independiente',
              descripcion: 'Identifica correctamente la variable independiente (o categoría principal)',
              peso: 35,
            },
            {
              nombre: 'variable_dependiente',
              descripcion: 'Identifica correctamente la variable dependiente (o categoría secundaria)',
              peso: 35,
            },
            {
              nombre: 'relacion_explicada',
              descripcion: 'Explica la relación entre las variables',
              peso: 30,
            },
          ],
        },
        competencia: 'identificación de variables',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 170,
        puntosInvestigacion: 35,
      },

      // ---------- MISIÓN 8: Operación medir lo invisible ----------
      {
        nivelNumero: 8,
        titulo: 'MISIÓN 8: Operación medir lo invisible',
        enunciado:
          'Las variables son conceptos abstractos. Para poder medirlas, necesitas convertirlas ' +
          'en DIMENSIONES e INDICADORES concretos.\n\n' +
          'TU MISIÓN: Toma UNA de tus variables y desarróllala en dimensiones e indicadores. ' +
          'Mínimo 2 dimensiones y 1 indicador por dimensión.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Desarrolla UNA de tus variables en al menos 2 dimensiones con sus indicadores',
          ejemplo: {
            variable: 'Rendimiento académico',
            dimensiones: [
              {
                nombre: 'Calificaciones',
                indicadores: ['Promedio general', 'Notas por materia'],
              },
              {
                nombre: 'Participación',
                indicadores: ['Asistencia a clases', 'Participación en actividades'],
              },
            ],
            explicacion:
              'Una variable se mide a través de dimensiones, y cada dimensión se mide con indicadores concretos.',
          },
          requisitos: [
            'Indica la variable que vas a operacionalizar',
            'Al menos 2 dimensiones',
            'Al menos 1 indicador por dimensión',
            'Los indicadores deben ser medibles',
          ],
          ayuda:
            'Una dimensión es un aspecto de la variable. Un indicador es algo concreto que puedes medir u observar.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_indicada',
              descripcion: 'Indica claramente la variable a operacionalizar',
              peso: 20,
            },
            {
              nombre: 'dimensiones_adecuadas',
              descripcion: 'Presenta al menos 2 dimensiones coherentes',
              peso: 35,
            },
            {
              nombre: 'indicadores_medibles',
              descripcion: 'Cada dimensión tiene al menos 1 indicador medible',
              peso: 30,
            },
            {
              nombre: 'coherencia',
              descripcion: 'Las dimensiones e indicadores se relacionan con la variable',
              peso: 15,
            },
          ],
        },
        competencia: 'operacionalización',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 180,
        puntosInvestigacion: 40,
      },

      // ==========================================================

      // ⬇️ BLOQUE 3: Misiones 9-12

            // ---------- MISIÓN 9: La apuesta científica ----------
      {
        nivelNumero: 9,
        titulo: 'MISIÓN 9: La apuesta científica',
        enunciado:
          'Una hipótesis es una "apuesta" que hace el investigador: una respuesta tentativa al problema ' +
          'que se comprobará o rechazará con datos.\n\n' +
          'TU MISIÓN: Formula la HIPÓTESIS de TU investigación. Debe ser clara, específica y relacionar ' +
          'las variables de tu estudio. Si tu investigación es cualitativa, indica que no lleva hipótesis y explica por qué.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Formula la hipótesis de tu investigación (o explica por qué no aplica)',
          ejemplo: {
            hipotesisIncorrecta: 'La inteligencia artificial es buena',
            hipotesisCorrecta:
              'El uso de inteligencia artificial influye positivamente en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X durante 2025',
            explicacion:
              'Una hipótesis relaciona las variables, indica la dirección de la relación y es comprobable con datos.',
          },
          requisitos: [
            'Relaciona las variables del estudio',
            'Indica la dirección (positiva, negativa, existe relación)',
            'Es comprobable con datos',
            'Es específica y clara',
          ],
          ayuda:
            'No todas las investigaciones llevan hipótesis. Si es cualitativa o exploratoria, puedes indicar que no aplica y justificar.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variables_relacionadas',
              descripcion: 'La hipótesis relaciona las variables del estudio',
              peso: 30,
            },
            {
              nombre: 'direccion_clara',
              descripcion: 'Indica la dirección de la relación (positiva, negativa, existe)',
              peso: 25,
            },
            {
              nombre: 'comprobable',
              descripcion: 'Es comprobable mediante datos empíricos',
              peso: 25,
            },
            {
              nombre: 'justificacion_cualitativa',
              descripcion: 'Si es cualitativa, justifica por qué no lleva hipótesis',
              peso: 20,
            },
          ],
        },
        competencia: 'formulación de hipótesis',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 190,
        puntosInvestigacion: 40,
      },

      // ---------- MISIÓN 10: Detective de antecedentes ----------
      {
        nivelNumero: 10,
        titulo: 'MISIÓN 10: Detective de antecedentes',
        enunciado:
          'Los antecedentes son investigaciones previas que se relacionan con tu tema. ' +
          'Buscarlos te ayuda a no repetir lo ya hecho y a fundamentar tu estudio.\n\n' +
          'TU MISIÓN: Lee este párrafo de antecedentes y encuentra los ERRORES.\n\n' +
          '"Muchos estudios han investigado la inteligencia artificial en la educación. ' +
          'Por ejemplo, un estudio encontró que mejora el aprendizaje. Otro estudio dice que los estudiantes ' +
          'la usan mucho. En general, todos los investigadores coinciden en que es muy útil."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores del párrafo de antecedentes. Marca los fragmentos problemáticos.',
          texto:
            'Muchos estudios han investigado la inteligencia artificial en la educación. Por ejemplo, un estudio encontró que mejora el aprendizaje. Otro estudio dice que los estudiantes la usan mucho. En general, todos los investigadores coinciden en que es muy útil.',
          erroresEsperados: [
            {
              fragmento: 'Muchos estudios',
              razon: 'Vago — no cita fuentes específicas',
            },
            {
              fragmento: 'un estudio encontró',
              razon: 'Falta autor y año — debe citar en APA',
            },
            {
              fragmento: 'Otro estudio dice',
              razon: 'Falta autor y año — debe citar en APA',
            },
            {
              fragmento: 'todos los investigadores coinciden',
              razon: 'Generalización falsa — es imposible saber lo que opinan TODOS',
            },
          ],
          ayuda:
            'Los antecedentes deben citar autores específicos con año. Nunca generalices con "todos", "muchos" o "algunos" sin fuente.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_falta_citas',
              descripcion: 'Identifica que faltan autores y años específicos',
              peso: 35,
            },
            {
              nombre: 'detecta_generalizacion',
              descripcion: 'Identifica la generalización falsa ("todos los investigadores")',
              peso: 30,
            },
            {
              nombre: 'detecta_vagos',
              descripcion: 'Identifica las expresiones vagas ("muchos estudios", "otro estudio")',
              peso: 25,
            },
            {
              nombre: 'explica_razon',
              descripcion: 'Explica por qué cada fragmento es un error',
              peso: 10,
            },
          ],
        },
        competencia: 'búsqueda de antecedentes',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 200,
        puntosInvestigacion: 45,
      },

      // ---------- MISIÓN 11: Constructor de teorías ----------
      {
        nivelNumero: 11,
        titulo: 'MISIÓN 11: Constructor de teorías',
        enunciado:
          'El marco teórico es el conjunto de teorías y conceptos que sustentan tu investigación. ' +
          'Debe estar bien redactado, con citas correctas y sin errores lógicos.\n\n' +
          'TU MISIÓN: Lee este fragmento de marco teórico y encuentra los ERRORES.\n\n' +
          '"La inteligencia artificial es una tecnología muy importante. ' +
          'Según algunos autores, la IA ha revolucionado la educación. ' +
          'La teoría del aprendizaje significativo de Ausubel (1983) dice que el aprendizaje depende de ' +
          'conocimientos previos. Como dijo un experto: la IA es el futuro."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores del marco teórico. Marca los fragmentos problemáticos.',
          texto:
            'La inteligencia artificial es una tecnología muy importante. Según algunos autores, la IA ha revolucionado la educación. La teoría del aprendizaje significativo de Ausubel (1983) dice que el aprendizaje depende de conocimientos previos. Como dijo un experto: la IA es el futuro.',
          erroresEsperados: [
            {
              fragmento: 'es una tecnología muy importante',
              razon: 'Afirmación sin fuente ni evidencia',
            },
            {
              fragmento: 'Según algunos autores',
              razon: 'Vago — debe citar autores específicos con año',
            },
            {
              fragmento: 'Como dijo un experto',
              razon: 'Falta nombre del experto — cita incompleta',
            },
            {
              fragmento: 'la IA es el futuro',
              razon: 'Frase sensacionalista sin sustento científico',
            },
          ],
          ayuda:
            'Un marco teórico debe citar autores específicos, evitar generalizaciones y no incluir afirmaciones sin respaldo.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_afirmaciones_sin_fuente',
              descripcion: 'Identifica afirmaciones sin respaldo',
              peso: 30,
            },
            {
              nombre: 'detecta_citas_vagas',
              descripcion: 'Identifica citas vagas ("algunos autores")',
              peso: 30,
            },
            {
              nombre: 'detecta_citas_incompletas',
              descripcion: 'Identifica citas sin autor específico ("un experto")',
              peso: 20,
            },
            {
              nombre: 'detecta_sensacionalismo',
              descripcion: 'Identifica frases sensacionalistas sin sustento',
              peso: 20,
            },
          ],
        },
        competencia: 'marco teórico',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 210,
        puntosInvestigacion: 45,
      },

      // ---------- MISIÓN 12: El laboratorio APA ----------
      {
        nivelNumero: 12,
        titulo: 'MISIÓN 12: El laboratorio APA',
        enunciado:
          'Las normas APA 7 son el estándar para citar fuentes en trabajos académicos. ' +
          'Citar correctamente da credibilidad a tu investigación.\n\n' +
          'TU MISIÓN: Lee este párrafo y encuentra los ERRORES en las citas APA.\n\n' +
          '"La inteligencia artificial ha transformado la educación (Sampieri, 2014). ' +
          'Según García y López, la IA mejora el aprendizaje. ' +
          'Varios autores (2020) han estudiado este fenómeno. ' +
          'Como menciona el estudio, los resultados son positivos."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores en las citas APA del párrafo. Marca los fragmentos problemáticos.',
          texto:
            'La inteligencia artificial ha transformado la educación (Sampieri, 2014). Según García y López, la IA mejora el aprendizaje. Varios autores (2020) han estudiado este fenómeno. Como menciona el estudio, los resultados son positivos.',
          erroresEsperados: [
            {
              fragmento: 'Según García y López',
              razon: 'Falta el año — en APA siempre va (Autor, año)',
            },
            {
              fragmento: 'Varios autores (2020)',
              razon: 'Vago — debe citar autores específicos',
            },
            {
              fragmento: 'Como menciona el estudio',
              razon: 'Falta autor y año — cita incompleta',
            },
            {
              fragmento: '(Sampieri, 2014)',
              razon: 'En APA 7, si son 2+ autores se usa "et al." — y el apellido es "Hernández-Sampieri"',
            },
          ],
          ayuda:
            'Toda cita APA debe incluir autor y año. Si son 3+ autores, se usa "et al." desde la primera cita. Nunca uses "varios autores" o "el estudio" sin especificar.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_falta_ano',
              descripcion: 'Identifica citas sin año',
              peso: 30,
            },
            {
              nombre: 'detecta_citas_vagas',
              descripcion: 'Identifica "varios autores" o "el estudio" sin especificar',
              peso: 25,
            },
            {
              nombre: 'detecta_formato_incorrecto',
              descripcion: 'Identifica mal uso del formato APA (ej. et al.)',
              peso: 25,
            },
            {
              nombre: 'explica_correccion',
              descripcion: 'Explica cómo debería ser la cita correcta',
              peso: 20,
            },
          ],
        },
        competencia: 'normas APA',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 220,
        puntosInvestigacion: 50,
      },

      // ==========================================================

      // ⬇️ BLOQUE 4: Misiones 13-15

            // ---------- MISIÓN 13: Elige tu camino ----------
      {
        nivelNumero: 13,
        titulo: 'MISIÓN 13: Elige tu camino',
        enunciado:
          'La metodología define CÓMO vas a realizar tu investigación. Elegir bien es fundamental ' +
          'para que tus resultados sean válidos.\n\n' +
          'TU MISIÓN: Define la METODOLOGÍA de TU investigación. Debes indicar: ' +
          'enfoque (cuantitativo, cualitativo o mixto), tipo (exploratorio, descriptivo, correlacional o explicativo), ' +
          'y diseño (no experimental o experimental). Justifica tu elección.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Define el enfoque, tipo y diseño metodológico de tu investigación, justificando cada uno',
          ejemplo: {
            enfoque: 'Cuantitativo',
            tipo: 'Correlacional',
            diseño: 'No experimental',
            justificacion:
              'El enfoque es cuantitativo porque se medirán variables numéricas. El tipo es correlacional porque se busca la relación entre IA y rendimiento. El diseño es no experimental porque no se manipulan variables, solo se observan.',
          },
          requisitos: [
            'Indica el enfoque (cuantitativo, cualitativo o mixto)',
            'Indica el tipo (exploratorio, descriptivo, correlacional o explicativo)',
            'Indica el diseño (no experimental o experimental)',
            'Justifica brevemente cada elección',
          ],
          ayuda:
            'Enfoque = cómo mides. Tipo = qué buscas. Diseño = si manipulas o solo observas.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'enfoque_correcto',
              descripcion: 'Indica correctamente el enfoque (cuantitativo, cualitativo o mixto)',
              peso: 25,
            },
            {
              nombre: 'tipo_correcto',
              descripcion: 'Indica el tipo de investigación adecuado al objetivo',
              peso: 25,
            },
            {
              nombre: 'diseno_correcto',
              descripcion: 'Indica el diseño (no experimental o experimental)',
              peso: 25,
            },
            {
              nombre: 'justificacion',
              descripcion: 'Justifica coherentemente cada elección',
              peso: 25,
            },
          ],
        },
        competencia: 'metodología',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 230,
        puntosInvestigacion: 50,
      },

      // ---------- MISIÓN 14: El arsenal del investigador ----------
      {
        nivelNumero: 14,
        titulo: 'MISIÓN 14: El arsenal del investigador',
        enunciado:
          'Las técnicas e instrumentos son las herramientas que usarás para recolectar datos. ' +
          'Elegirlos mal arruina la investigación.\n\n' +
          'TU MISIÓN: Lee este fragmento del apartado de técnicas e instrumentos y encuentra los ERRORES.\n\n' +
          '"Para esta investigación se usará una encuesta. El instrumento será un cuestionario ' +
          'de 5 preguntas que se aplicará a algunos estudiantes. También se harán entrevistas ' +
          'a quien se pueda. Los datos se analizarán de forma general."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores en el apartado de técnicas e instrumentos',
          texto:
            'Para esta investigación se usará una encuesta. El instrumento será un cuestionario de 5 preguntas que se aplicará a algunos estudiantes. También se harán entrevistas a quien se pueda. Los datos se analizarán de forma general.',
          erroresEsperados: [
            {
              fragmento: 'un cuestionario de 5 preguntas',
              razon: 'Insuficiente para medir variables complejas — se necesita justificar el número',
            },
            {
              fragmento: 'algunos estudiantes',
              razon: 'No especifica la muestra ni el muestreo — debe delimitarse',
            },
            {
              fragmento: 'a quien se pueda',
              razon: 'Sin criterio de selección — las entrevistas deben tener criterios claros',
            },
            {
              fragmento: 'se analizarán de forma general',
              razon: 'Vago — debe indicar el método de análisis (estadístico, temático, etc.)',
            },
          ],
          ayuda:
            'Toda técnica e instrumento debe especificar: a quién se aplica, cómo se selecciona la muestra, cuántos ítems tiene y cómo se analizarán los datos.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_instrumento_insuficiente',
              descripcion: 'Identifica que el cuestionario es insuficiente o no justificado',
              peso: 25,
            },
            {
              nombre: 'detecta_muestra_vaga',
              descripcion: 'Identifica la falta de delimitación de la muestra',
              peso: 25,
            },
            {
              nombre: 'detecta_sin_criterio',
              descripcion: 'Identifica la falta de criterios de selección ("a quien se pueda")',
              peso: 25,
            },
            {
              nombre: 'detecta_analisis_vago',
              descripcion: 'Identifica la falta de método de análisis ("de forma general")',
              peso: 25,
            },
          ],
        },
        competencia: 'técnicas e instrumentos',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 240,
        puntosInvestigacion: 55,
      },

      // ---------- MISIÓN 15: Lectura entre líneas ----------
      {
        nivelNumero: 15,
        titulo: 'MISIÓN 15: Lectura entre líneas',
        enunciado:
          'Interpretar resultados es más que leer números: es entender qué significan y qué ' +
          'implicaciones tienen para tu investigación.\n\n' +
          'TU MISIÓN: Lee este fragmento de interpretación de resultados y encuentra los ERRORES.\n\n' +
          '"Los resultados muestran que el 70% de los estudiantes usa IA. ' +
          'Esto demuestra claramente que la IA mejora el rendimiento académico. ' +
          'Todos los estudiantes que usan IA tienen mejores notas. ' +
          'Por lo tanto, la IA es la solución a todos los problemas educativos."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores en la interpretación de resultados',
          texto:
            'Los resultados muestran que el 70% de los estudiantes usa IA. Esto demuestra claramente que la IA mejora el rendimiento académico. Todos los estudiantes que usan IA tienen mejores notas. Por lo tanto, la IA es la solución a todos los problemas educativos.',
          erroresEsperados: [
            {
              fragmento: 'demuestra claramente',
              razon: 'El 70% de uso NO demuestra relación con rendimiento — confunde frecuencia con causalidad',
            },
            {
              fragmento: 'Todos los estudiantes que usan IA',
              razon: 'Generalización — "todos" no es válido sin datos que lo sustenten',
            },
            {
              fragmento: 'la IA es la solución a todos los problemas educativos',
              razon: 'Conclusión exagerada — no se pueden extrapolar resultados a todos los contextos',
            },
            {
              fragmento: 'mejora el rendimiento académico',
              razon: 'Se afirma causalidad sin prueba estadística ni control de otras variables',
            },
          ],
          ayuda:
            'Interpretar resultados requiere rigor: no confundas correlación con causalidad, no generalices sin datos, no exageres conclusiones.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_causalidad_falsa',
              descripcion: 'Identifica que se confunde frecuencia con causalidad',
              peso: 30,
            },
            {
              nombre: 'detecta_generalizacion',
              descripcion: 'Identifica el uso indebido de "todos"',
              peso: 25,
            },
            {
              nombre: 'detecta_exageracion',
              descripcion: 'Identifica la conclusión exagerada sin sustento',
              peso: 25,
            },
            {
              nombre: 'detecta_falta_estadistica',
              descripcion: 'Identifica la falta de prueba estadística para afirmar causalidad',
              peso: 20,
            },
          ],
        },
        competencia: 'interpretación de resultados',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 250,
        puntosInvestigacion: 55,
      },

      // ==========================================================

      // ⬇️ BLOQUE 5: Misiones 16-18

            // ---------- MISIÓN 16: El cierre perfecto ----------
      {
        nivelNumero: 16,
        titulo: 'MISIÓN 16: El cierre perfecto',
        enunciado:
          'Las conclusiones son el cierre de tu investigación. Deben responder a tus objetivos ' +
          'y resumir los hallazgos más importantes.\n\n' +
          'TU MISIÓN: Redacta las CONCLUSIONES de TU investigación. Deben: ' +
          'responder al objetivo general, mencionar los hallazgos principales y no incluir información nueva.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Redacta las conclusiones de tu investigación respondiendo al objetivo general',
          ejemplo: {
            conclusionIncorrecta:
              'La IA es muy importante hoy en día. Los estudiantes deberían usarla más.',
            conclusionCorrecta:
              'Se determinó que el uso de inteligencia artificial tiene una influencia positiva en el rendimiento académico de los estudiantes de Ingeniería de Sistemas de la Universidad X durante 2025. El 70% de los estudiantes reportó usar herramientas de IA con regularidad, y se observó una correlación significativa entre su uso y las calificaciones.',
            explicacion:
              'Una conclusión responde al objetivo general, presenta hallazgos concretos y no introduce temas nuevos.',
          },
          requisitos: [
            'Responde al objetivo general de tu investigación',
            'Menciona hallazgos concretos (no generalidades)',
            'No incluye información nueva ni temas que no se trataron',
            'Usa lenguaje académico, no opiniones personales',
          ],
          ayuda:
            'Las conclusiones NO son un resumen del trabajo. Son las respuestas a lo que te preguntaste al inicio.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'responde_objetivo',
              descripcion: 'Las conclusiones responden al objetivo general',
              peso: 35,
            },
            {
              nombre: 'hallazgos_concretos',
              descripcion: 'Menciona hallazgos concretos, no generalidades',
              peso: 30,
            },
            {
              nombre: 'sin_info_nueva',
              descripcion: 'No incluye información nueva ni temas no tratados',
              peso: 20,
            },
            {
              nombre: 'lenguaje_academico',
              descripcion: 'Usa lenguaje académico sin opiniones personales',
              peso: 15,
            },
          ],
        },
        competencia: 'redacción de conclusiones',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 260,
        puntosInvestigacion: 60,
      },

      // ---------- MISIÓN 17: El rastro de las fuentes ----------
      {
        nivelNumero: 17,
        titulo: 'MISIÓN 17: El rastro de las fuentes',
        enunciado:
          'Las referencias son la lista de todas las fuentes que citaste en tu investigación. ' +
          'En APA 7 siguen un formato específico y estricto.\n\n' +
          'TU MISIÓN: Lee esta lista de referencias y encuentra los ERRORES.\n\n' +
          '"Referencias:\n' +
          '- Hernández Sampieri, R. (2014). Metodología de la investigación. McGraw-Hill.\n' +
          '- GARCÍA, J. y López, M. (2020). La IA en educación. Revista Educación, 15(2), 45-60.\n' +
          '- Smith, J. La inteligencia artificial. Editorial X, 2019.\n' +
          '- Pérez, A. (2021). Estudio sobre IA."',
        tipoInteraccion: 'marcar_errores',
        contenidoJson: {
          instruccion:
            'Identifica los errores en la lista de referencias APA 7',
          texto:
            'Referencias:\n- Hernández Sampieri, R. (2014). Metodología de la investigación. McGraw-Hill.\n- GARCÍA, J. y López, M. (2020). La IA en educación. Revista Educación, 15(2), 45-60.\n- Smith, J. La inteligencia artificial. Editorial X, 2019.\n- Pérez, A. (2021). Estudio sobre IA.',
          erroresEsperados: [
            {
              fragmento: 'GARCÍA, J. y López, M.',
              razon: 'Los apellidos no van en mayúsculas — en APA solo la primera letra',
            },
            {
              fragmento: 'y López, M.',
              razon: 'En APA se usa "&" en lugar de "y" para separar autores',
            },
            {
              fragmento: 'Smith, J. La inteligencia artificial. Editorial X, 2019.',
              razon: 'Falta el año entre paréntesis después del autor — debe ser (2019)',
            },
            {
              fragmento: 'Pérez, A. (2021). Estudio sobre IA.',
              razon: 'Falta la fuente editorial o revista donde se publicó',
            },
          ],
          ayuda:
            'Formato APA 7 básico: Apellido, N. (año). Título. Editorial. Para artículos: Apellido, N. (año). Título del artículo. Nombre de la Revista, volumen(número), páginas.',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'detecta_mayusculas',
              descripcion: 'Identifica apellidos en mayúsculas incorrectamente',
              peso: 20,
            },
            {
              nombre: 'detecta_separador',
              descripcion: 'Identifica el uso incorrecto de "y" en lugar de "&"',
              peso: 25,
            },
            {
              nombre: 'detecta_falta_ano',
              descripcion: 'Identifica referencias sin año entre paréntesis',
              peso: 30,
            },
            {
              nombre: 'detecta_falta_fuente',
              descripcion: 'Identifica referencias sin editorial o revista',
              peso: 25,
            },
          ],
        },
        competencia: 'referencias APA',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 270,
        puntosInvestigacion: 60,
      },

      // ---------- MISIÓN 18: El tribunal final (BOSS) ----------
      {
        nivelNumero: 18,
        titulo: 'MISIÓN 18: El tribunal final',
        enunciado:
          '🎯 BOSS FINAL: Estás frente al tribunal académico. Debes defender tu investigación. ' +
          'El tribunal te hace la pregunta más importante de todas:\n\n' +
          '"En 3 o 4 oraciones, explica QUÉ investigaste, CÓMO lo hiciste y QUÉ encontraste. ' +
          'Justifica por qué tu investigación es relevante y aporta algo nuevo."\n\n' +
          'TU MISIÓN: Responde al tribunal con una defensa clara y bien estructurada. ' +
          'Tienes 15 minutos.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion:
            'Escribe una defensa breve pero completa de tu investigación (3-4 oraciones)',
          ejemplo: {
            defensaEjemplo:
              'Mi investigación determinó el impacto del uso de inteligencia artificial en el rendimiento académico de estudiantes de Ingeniería de Sistemas de la Universidad X durante 2025. Utilicé un enfoque cuantitativo con diseño correlacional, aplicando encuestas a 150 estudiantes. Los resultados mostraron una correlación positiva significativa (r = 0.72) entre el uso regular de IA y las calificaciones. Esta investigación es relevante porque aporta evidencia empírica sobre un fenómeno poco estudiado en el contexto boliviano.',
            explicacion:
              'Una defensa completa responde: QUÉ (objetivo), CÓMO (metodología), QUÉ SE ENCONTRÓ (resultados) y POR QUÉ IMPORTA (relevancia).',
          },
          requisitos: [
            'Indica QUÉ investigaste (objetivo)',
            'Indica CÓMO lo hiciste (metodología básica)',
            'Menciona QUÉ encontraste (resultados principales)',
            'Justifica la RELEVANCIA de tu estudio',
            'Usa lenguaje académico y seguro',
          ],
          ayuda:
            'Imagina que estás frente al tribunal y tienes solo 30 segundos para convencerlos. ¿Qué dirías?',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'que_investigo',
              descripcion: 'Explica claramente qué investigó (objetivo)',
              peso: 25,
            },
            {
              nombre: 'como_lo_hizo',
              descripcion: 'Menciona la metodología utilizada',
              peso: 25,
            },
            {
              nombre: 'que_encontro',
              descripcion: 'Presenta los resultados principales',
              peso: 25,
            },
            {
              nombre: 'relevancia',
              descripcion: 'Justifica la relevancia y aporte del estudio',
              peso: 25,
            },
          ],
        },
        competencia: 'defensa de investigación',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 500,
        puntosInvestigacion: 100,
      },

      // ==========================================================
    ];

    // ============================================================
    // 4. Insertar misiones (si no existen)
    // ============================================================
    const misionesRepo = dataSource.getRepository(Mision);
    let creadas = 0;
    let existentes = 0;

    for (const data of misionesData) {
      const nivel = nivelesPorNumero.get(data.nivelNumero);

      if (!nivel) {
        console.log(
          `   ⚠️  Nivel ${data.nivelNumero} no encontrado. Saltando misión...`,
        );
        continue;
      }

      // Verificar si ya existe una misión con ese título en ese nivel
      const yaExiste = await misionesRepo.findOne({
        where: { nivelId: nivel.id, titulo: data.titulo },
      });

      if (yaExiste) {
        console.log(
          `   ℹ️  Nivel ${data.nivelNumero}: ya existe "${data.titulo}". Saltando...`,
        );
        existentes++;
        continue;
      }

      const mision = misionesRepo.create({
        nivelId: nivel.id,
        titulo: data.titulo,
        enunciado: data.enunciado,
        tipoInteraccion: data.tipoInteraccion,
        contenidoJson: data.contenidoJson,
        rubricJson: data.rubricJson,
        competencia: data.competencia,
        esPrincipal: data.esPrincipal,
        vidasIniciales: data.vidasIniciales,
        xpRecompensa: data.xpRecompensa,
        puntosInvestigacion: data.puntosInvestigacion,
      });

      await misionesRepo.save(mision);
      console.log(
        `   ✅ Nivel ${data.nivelNumero}: "${data.titulo}" creada (id: ${mision.id})`,
      );
      creadas++;
    }

    // ============================================================
    // 5. Resumen
    // ============================================================
    console.log('\n✅ Seed de MISIONES de TESIS completado\n');
    console.log('📊 Resumen:');
    console.log(`   - Modalidad: tesis (id: ${modalidadTesis.id})`);
    console.log(`   - Total de misiones definidas: ${misionesData.length}`);
    console.log(`   - Misiones creadas: ${creadas}`);
    console.log(`   - Misiones ya existentes: ${existentes}\n`);
  } catch (error) {
    console.error('❌ Error durante el seed de misiones:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();