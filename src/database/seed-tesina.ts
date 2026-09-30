import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TESINA...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadTesina = await modalidadesRepo.findOne({
      where: { nombre: 'tesina' },
    });

    if (!modalidadTesina) {
      throw new Error(
        'No se encontró la modalidad "tesina". Ejecuta primero `npm run seed`.',
      );
    }

    console.log(
      `   ℹ️  Modalidad "tesina" encontrada (id: ${modalidadTesina.id})\n`,
    );

    const nivelesRepo = dataSource.getRepository(Nivel);
    const nivelesExistentes = await nivelesRepo.count({
      where: { modalidadId: modalidadTesina.id },
    });

    if (nivelesExistentes > 0) {
      console.log(
        `   ⚠️  Ya existen ${nivelesExistentes} niveles en "tesina". Omitiendo creación de niveles...\n`,
      );
      await app.close();
      process.exit(0);
    }

    const nivelesData = [
      {
        numero: 1,
        titulo: 'Delimitación del tema y del problema de investigación',
        descripcion:
          'Transforme una idea general en un problema de investigación específico, viable y debidamente contextualizado.',
        tipo: 'estandar' as const,
      },
      {
        numero: 2,
        titulo: 'Formulación de preguntas y objetivos',
        descripcion:
          'Establezca la coherencia entre la pregunta central, el objetivo general y los objetivos específicos de la tesina.',
        tipo: 'estandar' as const,
      },
      {
        numero: 3,
        titulo: 'Construcción de la fundamentación teórica',
        descripcion:
          'Seleccione antecedentes, conceptos, teorías y fuentes bibliográficas que sustenten el estudio.',
        tipo: 'estandar' as const,
      },
      {
        numero: 4,
        titulo: 'Operacionalización y diseño metodológico',
        descripcion:
          'Defina las variables o categorías, sus dimensiones e indicadores, así como el enfoque, el diseño y la muestra.',
        tipo: 'estandar' as const,
      },
      {
        numero: 5,
        titulo: 'Planificación de la recolección de datos',
        descripcion:
          'Diseñe los instrumentos y el procedimiento de recolección, e incluya su validación y las medidas de protección ética.',
        tipo: 'estandar' as const,
      },
      {
        numero: 6,
        titulo: 'Análisis y presentación de resultados',
        descripcion:
          'Organice la evidencia y responda a los objetivos mediante un análisis claro, pertinente y verificable.',
        tipo: 'estandar' as const,
      },
      {
        numero: 7,
        titulo: 'Elaboración de conclusiones y referencias',
        descripcion:
          'Concluya la tesina con conclusiones y recomendaciones fundamentadas, reconozca sus limitaciones y presente las referencias conforme a APA 7.',
        tipo: 'estandar' as const,
      },
      {
        numero: 8,
        titulo: 'Presentación y defensa de la tesina',
        descripcion:
          'Exponga el proceso de investigación y responda las preguntas del tribunal con argumentos académicos y evidencia pertinente.',
        tipo: 'boss' as const,
      },
    ];

    console.log('📚 Insertando los 8 niveles de TESINA...\n');

    for (const nivelData of nivelesData) {
      const nivel = nivelesRepo.create({
        modalidadId: modalidadTesina.id,
        numero: nivelData.numero,
        titulo: nivelData.titulo,
        descripcion: nivelData.descripcion,
        orden: nivelData.numero,
        tipo: nivelData.tipo,
      });

      await nivelesRepo.save(nivel);
      const icono = nivelData.tipo === 'boss' ? '👹' : '📘';
      console.log(
        `   ${icono} Nivel ${String(nivelData.numero).padStart(2, '0')}: ${nivelData.titulo}`,
      );
    }

    console.log('\n✅ Seed de TESINA completado exitosamente');
    console.log(`   - Niveles creados: ${nivelesData.length}`);
  } catch (error) {
    console.error('❌ Error durante el seed de tesina:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();