import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TEORÍAS de TESIS...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // 1. Verificar modalidad tesis
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadTesis = await modalidadesRepo.findOne({
      where: { nombre: 'tesis' },
    });

    if (!modalidadTesis) {
      throw new Error(
        'No se encontró la modalidad "tesis". Ejecuta primero `npm run seed` y `npm run seed:tesis`.',
      );
    }

    console.log(`   ℹ️  Modalidad "tesis" encontrada (id: ${modalidadTesis.id})\n`);

    // 2. Cargar niveles y misiones
    const nivelesRepo = dataSource.getRepository(Nivel);
    const misionesRepo = dataSource.getRepository(Mision);

    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadTesis.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error('No hay niveles de tesis.');
    }

    // Mapa de número de nivel → ID de nivel
    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) {
      nivelesPorNumero.set(nivel.numero, nivel);
    }

    // 3. Definir las teorías por nivel
    const teoriasPorNivel: Record<number, string> = {
      1: 'Un tema de investigación debe ser específico, delimitado y viable. Incluye siempre 4 elementos: variable (qué), población (quiénes), lugar (dónde) y tiempo (cuándo). Sin ellos, el tema es demasiado amplio.',

      2: 'El problema de investigación es una PREGUNTA que relaciona dos o más variables. No es una afirmación, sino una pregunta clara y respondible. Estructura: "¿Qué relación existe entre X y Y en Z durante T?"',

      3: 'El título científico es la versión compacta de tu tema. Debe incluir las variables, la relación entre ellas (impacto, influencia, relación), la población, el lugar y el tiempo.',

      4: 'La pregunta de investigación es una versión más directa del problema. Debe ser específica, delimitada y respondible mediante datos. No sirven preguntas vagas o demasiado amplias.',

      5: 'El objetivo general describe QUÉ vas a lograr con tu investigación. Empieza siempre con un verbo en infinitivo (determinar, analizar, evaluar, identificar) e incluye qué, población, lugar y tiempo.',

      6: 'Los objetivos específicos son los pasos concretos para lograr el objetivo general. Cada uno empieza con verbo en infinitivo y describe una acción medible. En conjunto, cubren todo el objetivo general.',

      7: 'Las variables son los elementos que vas a medir o analizar. La variable independiente causa o influye; la variable dependiente es afectada. En estudios cualitativos se llaman categorías.',

      8: 'Las variables son conceptos abstractos. Para medirlas, se dividen en DIMENSIONES (aspectos específicos) y cada dimensión se mide con INDICADORES concretos y observables.',

      9: 'Una hipótesis es una respuesta tentativa al problema, una "apuesta" que se comprobará con datos. Debe relacionar las variables, indicar dirección (positiva/negativa) y ser comprobable. No todas las investigaciones llevan hipótesis.',

      10: 'Los antecedentes son investigaciones previas relacionadas con tu tema. Deben citarse con autor y año (APA). NUNCA uses expresiones vagas como "muchos estudios" o "todos los investigadores coinciden" sin fuentes específicas.',

      11: 'El marco teórico es el conjunto de teorías y conceptos que sustentan tu investigación. Cada afirmación debe tener fuente. Evita generalizaciones, frases sensacionalistas y afirmaciones sin respaldo.',

      12: 'Las normas APA 7 son el estándar para citar fuentes. Toda cita debe incluir autor y año. Con 3+ autores se usa "et al." desde la primera cita. Las referencias van al final, ordenadas alfabéticamente.',

      13: 'La metodología define CÓMO harás tu investigación. Incluye: enfoque (cuantitativo, cualitativo o mixto), tipo (exploratorio, descriptivo, correlacional o explicativo) y diseño (experimental o no experimental). Cada elección debe justificarse.',

      14: 'Las técnicas son los procedimientos (encuesta, entrevista, observación) y los instrumentos son las herramientas (cuestionario, guía de entrevista). Deben especificar: a quién se aplica, cómo se selecciona la muestra y cómo se analizarán los datos.',

      15: 'Interpretar resultados requiere rigor. No confundas correlación con causalidad. No generalices sin datos. No exageres conclusiones. Toda afirmación debe estar respaldada por evidencia estadística o cualitativa.',

      16: 'Las conclusiones responden al objetivo general. Mencionan hallazgos concretos (no generalidades). NO introducen temas nuevos. Usan lenguaje académico, no opiniones personales.',

      17: 'Las referencias son la lista de todas las fuentes citadas. Formato APA 7: Apellido, N. (año). Título. Editorial. Para artículos: Apellido, N. (año). Título. Revista, vol(núm), páginas. Orden alfabético.',

      18: 'La defensa es la presentación oral de tu investigación ante el tribunal. Debes explicar: QUÉ investigaste (objetivo), CÓMO (metodología), QUÉ encontraste (resultados) y POR QUÉ es relevante.',
    };

    // 4. Recorrer los niveles y actualizar la teoría de su misión principal
    console.log('📝 Actualizando teorías de las misiones...\n');

    let actualizadas = 0;

    for (const [numeroNivel, teoria] of Object.entries(teoriasPorNivel)) {
      const numero = Number(numeroNivel);
      const nivel = nivelesPorNumero.get(numero);

      if (!nivel) {
        console.log(`   ⚠️  Nivel ${numero} no encontrado. Saltando...`);
        continue;
      }

      // Buscar la misión principal de ese nivel
      const mision = await misionesRepo.findOne({
        where: { nivelId: nivel.id, esPrincipal: true },
      });

      if (!mision) {
        console.log(`   ⚠️  Nivel ${numero}: no tiene misión principal. Saltando...`);
        continue;
      }

      // Actualizar la teoría
      await misionesRepo.update({ id: mision.id }, { teoria });

      console.log(`   ✅ Nivel ${numero}: teoría actualizada en "${mision.titulo}"`);
      actualizadas++;
    }

    console.log('\n✅ Seed de TEORÍAS completado\n');
    console.log('📊 Resumen:');
    console.log(`   - Teorías actualizadas: ${actualizadas}`);
    console.log(`   - Total de niveles: ${niveles.length}\n`);
  } catch (error) {
    console.error('❌ Error durante el seed de teorías:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();