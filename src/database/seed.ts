import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';
import { Insignia } from '../modules/juego/insignias/entities/insignia.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TESIS QUEST...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // ============================================================
    // 1. MODALIDADES (por si acaso no están)
    // ============================================================
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const totalModalidades = await modalidadesRepo.count();

    if (totalModalidades === 0) {
      console.log('📚 Insertando modalidades base...');
      await modalidadesRepo.save([
        {
          nombre: 'monografia',
          descripcion: 'Mundo 1: Monografía',
          ordenMundo: 1,
        },
        { nombre: 'tesina', descripcion: 'Mundo 2: Tesina', ordenMundo: 2 },
        { nombre: 'tesis', descripcion: 'Mundo 3: Tesis', ordenMundo: 3 },
        {
          nombre: 'articulo',
          descripcion: 'Mundo 4: Artículo científico',
          ordenMundo: 4,
        },
      ]);
      console.log('   ✅ 4 modalidades insertadas\n');
    } else {
      console.log(`   ℹ️  Ya existen ${totalModalidades} modalidades\n`);
    }

    // ============================================================
    // 2. NIVELES del mundo "monografia"
    // ============================================================
    const modalidadMonografia = await modalidadesRepo.findOne({
      where: { nombre: 'monografia' },
    });

    if (!modalidadMonografia) {
      throw new Error('No se encontró la modalidad "monografia"');
    }

    const nivelesRepo = dataSource.getRepository(Nivel);
    const nivelesExistentes = await nivelesRepo.count({
      where: { modalidadId: modalidadMonografia.id },
    });

    if (nivelesExistentes > 0) {
      console.log(
        `   ℹ️  Ya existen ${nivelesExistentes} niveles en monografia. Saltando...\n`,
      );
    } else {
      console.log('🎯 Insertando nivel 1: "Construye tu tema"...');

      const nivel1 = await nivelesRepo.save({
        modalidadId: modalidadMonografia.id,
        numero: 1,
        titulo: 'Construye tu tema',
        descripcion:
          'Aprende a transformar una idea vaga en un tema de investigación concreto, delimitado y viable.',
        orden: 1,
        tipo: 'estandar',
      });

      console.log(`   ✅ Nivel 1 creado (id: ${nivel1.id})\n`);

      // ============================================================
      // 3. MISIONES del nivel 1
      // ============================================================
      console.log('🎮 Insertando misiones...');

      const misionesRepo = dataSource.getRepository(Mision);

      // ---------- MISIÓN 1: Captura de objetivo ----------
      const mision1 = await misionesRepo.save({
        nivelId: nivel1.id,
        titulo: 'MISIÓN 1: El tema perdido',
        enunciado:
          'Estás en una biblioteca y necesitas elegir UN tema para tu monografía. Solo uno cumple con todos los criterios de un buen tema de investigación: claro, delimitado y viable.',
        tipoInteraccion: 'captura_objetivo',
        contenidoJson: {
          instruccion: 'Selecciona el ÚNICO tema correcto',
          opciones: [
            {
              id: 'a',
              texto: 'La tecnología',
              esCorrecta: false,
              razon: 'Demasiado amplio, no delimita qué aspecto de la tecnología',
            },
            {
              id: 'b',
              texto: 'El amor',
              esCorrecta: false,
              razon: 'No es un tema investigable de forma científica directa',
            },
            {
              id: 'c',
              texto:
                'Impacto del teletrabajo en la productividad de los empleados de la empresa X en La Paz, 2024',
              esCorrecta: true,
              razon:
                'Delimita variable, población, lugar y tiempo — es investigable',
            },
            {
              id: 'd',
              texto: 'Cómo mejorar el mundo',
              esCorrecta: false,
              razon: 'No es un tema académico, es un deseo vago',
            },
          ],
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_delimitada',
              descripcion: 'El tema identifica una variable clara a estudiar',
              peso: 30,
            },
            {
              nombre: 'poblacion_definida',
              descripcion: 'El tema especifica la población o sujeto de estudio',
              peso: 25,
            },
            {
              nombre: 'lugar_delimitado',
              descripcion: 'El tema indica el lugar donde se realizará',
              peso: 20,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'El tema incluye el período de tiempo',
              peso: 25,
            },
          ],
        },
        competencia: 'formulación de tema',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 100,
        puntosInvestigacion: 20,
      });

      console.log(`   ✅ Misión 1 creada (id: ${mision1.id})`);

      // ---------- MISIÓN 2: Texto libre ----------
      const mision2 = await misionesRepo.save({
        nivelId: nivel1.id,
        titulo: 'MISIÓN 2: El título científico',
        enunciado:
          'Convierte este tema vago en un título científico correcto: "Problemas de los estudiantes". Tu título debe incluir variable, población, lugar y tiempo.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          temaOriginal: 'Problemas de los estudiantes',
          instruccion:
            'Escribe un título científico completo. Ejemplo de estructura: [Variable] en [población] de [lugar], [tiempo]',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_clara',
              descripcion: 'El título menciona una variable específica a medir',
              peso: 30,
            },
            {
              nombre: 'poblacion_definida',
              descripcion:
                'El título identifica claramente quiénes son los sujetos de estudio',
              peso: 25,
            },
            {
              nombre: 'lugar_delimitado',
              descripcion: 'El título incluye el lugar donde se realiza la investigación',
              peso: 20,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'El título menciona el período de tiempo',
              peso: 25,
            },
          ],
        },
        competencia: 'formulación de título',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 150,
        puntosInvestigacion: 30,
      });

      console.log(`   ✅ Misión 2 creada (id: ${mision2.id})\n`);
    }
        // ============================================================
    // 4. INSIGNIAS
    // ============================================================
    const insigniasRepo = dataSource.getRepository(Insignia);
    const totalInsignias = await insigniasRepo.count();

    if (totalInsignias === 0) {
      console.log('🏆 Insertando insignias base...');
      await insigniasRepo.save([
        {
          nombre: 'Primera misión',
          descripcion: 'Completaste tu primer reto en TESIS QUEST',
          iconoUrl: null,
        },
        {
          nombre: 'Boss derrotado',
          descripcion: 'Superaste una prueba de fuego (nivel Boss)',
          iconoUrl: null,
        },
        {
          nombre: 'Racha de 3',
          descripcion: 'Completaste 3 misiones seguidas sin fallar',
          iconoUrl: null,
        },
        {
          nombre: 'Mundo completado',
          descripcion: 'Terminaste todos los niveles de un mundo',
          iconoUrl: null,
        },
      ]);
      console.log('   ✅ 4 insignias insertadas\n');
    } else {
      console.log(`   ℹ️  Ya existen ${totalInsignias} insignias\n`);
    }
        // ============================================================
    // 5. NIVEL BOSS (para probar el módulo Boss)
    // ============================================================
    const nivelesExistentesBoss = await nivelesRepo.count({
      where: { modalidadId: modalidadMonografia.id, tipo: 'boss' },
    });

    if (nivelesExistentesBoss === 0) {
      console.log('👹 Insertando nivel Boss de prueba...');

      const nivelBoss = await nivelesRepo.save({
        modalidadId: modalidadMonografia.id,
        numero: 99,
        titulo: 'BOSS FINAL: Defiende tu propuesta',
        descripcion:
          'Prueba de fuego. Demuestra todo lo aprendido en 15 minutos.',
        orden: 99,
        tipo: 'boss',
      });

      console.log(`   ✅ Nivel Boss creado (id: ${nivelBoss.id})\n`);

      // ---------- MISIÓN BOSS 1 ----------
      const misionesRepo2 = dataSource.getRepository(Mision);

      await misionesRepo2.save({
        nivelId: nivelBoss.id,
        titulo: 'BOSS MISIÓN 1: El título perfecto',
        enunciado:
          'Escribe un título científico completo que incluya variable, población, lugar y tiempo. Tienes 15 minutos para todo el Boss.',
        tipoInteraccion: 'texto_libre',
        contenidoJson: {
          instruccion: 'Escribe tu título científico final',
        },
        rubricJson: {
          criterios: [
            {
              nombre: 'variable_clara',
              descripcion: 'El título menciona una variable específica',
              peso: 30,
            },
            {
              nombre: 'poblacion_definida',
              descripcion: 'Identifica los sujetos de estudio',
              peso: 25,
            },
            {
              nombre: 'lugar_delimitado',
              descripcion: 'Incluye el lugar de la investigación',
              peso: 20,
            },
            {
              nombre: 'temporalidad',
              descripcion: 'Menciona el período de tiempo',
              peso: 25,
            },
          ],
        },
        competencia: 'formulación de título',
        esPrincipal: true,
        vidasIniciales: 3,
        xpRecompensa: 500,
        puntosInvestigacion: 100,
      });

      console.log(`   ✅ Misión Boss creada\n`);
    } else {
      console.log(`   ℹ️  Ya existe nivel Boss. Saltando...\n`);
    }

    console.log('✅ Seed completado exitosamente');
    console.log('\n📊 Resumen:');
    console.log(`   - Modalidades: ${await modalidadesRepo.count()}`);
    console.log(`   - Niveles: ${await nivelesRepo.count()}`);
    console.log(`   - Misiones: ${await dataSource.getRepository(Mision).count()}`);
        console.log(`   - Insignias: ${await insigniasRepo.count()}`);
        console.log(`   - Niveles Boss: ${await nivelesRepo.count({ where: { tipo: 'boss' } })}`);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();