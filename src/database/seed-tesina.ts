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
        titulo: 'Delimita el tema y el problema',
        descripcion:
          'Convierte una idea amplia en un problema de investigación concreto, viable y contextualizado.',
        tipo: 'estandar' as const,
      },
      {
        numero: 2,
        titulo: 'Formula preguntas y objetivos',
        descripcion:
          'Alinea la pregunta central, el objetivo general y los objetivos específicos de la tesina.',
        tipo: 'estandar' as const,
      },
      {
        numero: 3,
        titulo: 'Construye el sustento teórico',
        descripcion:
          'Selecciona antecedentes, conceptos, teorías y citas que fundamenten el estudio.',
        tipo: 'estandar' as const,
      },
      {
        numero: 4,
        titulo: 'Operacionaliza y diseña la metodología',
        descripcion:
          'Define variables o categorías, dimensiones, indicadores, enfoque, diseño y muestra.',
        tipo: 'estandar' as const,
      },
      {
        numero: 5,
        titulo: 'Prepara la recolección de datos',
        descripcion:
          'Diseña instrumentos, procedimiento, validación y resguardos éticos.',
        tipo: 'estandar' as const,
      },
      {
        numero: 6,
        titulo: 'Analiza y presenta resultados',
        descripcion:
          'Organiza la evidencia y responde a los objetivos con un análisis claro y verificable.',
        tipo: 'estandar' as const,
      },
      {
        numero: 7,
        titulo: 'Redacta conclusiones y referencias',
        descripcion:
          'Cierra la tesina con conclusiones, recomendaciones, limitaciones y referencias en APA 7.',
        tipo: 'estandar' as const,
      },
      {
        numero: 8,
        titulo: 'Defiende tu tesina',
        descripcion:
          'Presenta el proceso completo y responde preguntas del tribunal con argumentos académicos.',
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