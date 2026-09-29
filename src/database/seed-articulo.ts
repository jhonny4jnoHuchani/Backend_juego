import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de ARTÍCULO...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadArticulo = await modalidadesRepo.findOne({
      where: { nombre: 'articulo' },
    });

    if (!modalidadArticulo) {
      throw new Error(
        'No se encontró la modalidad "articulo". Ejecuta primero `npm run seed`.',
      );
    }

    console.log(
      `   ℹ️  Modalidad "articulo" encontrada (id: ${modalidadArticulo.id})\n`,
    );

    const nivelesRepo = dataSource.getRepository(Nivel);
    const nivelesExistentes = await nivelesRepo.count({
      where: { modalidadId: modalidadArticulo.id },
    });

    if (nivelesExistentes > 0) {
      console.log(
        `   ⚠️  Ya existen ${nivelesExistentes} niveles en "articulo". Saltando...\n`,
      );
      console.log('   💡 Si quieres recrear los niveles, bórralos primero:');
      console.log(
        `      DELETE FROM niveles WHERE modalidad_id = ${modalidadArticulo.id};\n`,
      );
      await app.close();
      process.exit(0);
    }

    const nivelesData = [
      {
        numero: 1,
        titulo: 'Delimita el tema y la contribución',
        descripcion:
          'Convierte una idea amplia en un tema de artículo concreto, viable y con una contribución clara.',
        tipo: 'estandar' as const,
      },
      {
        numero: 2,
        titulo: 'Construye la introducción',
        descripcion:
          'Presenta el problema, la pregunta, el objetivo y el vacío de conocimiento que justifica el artículo.',
        tipo: 'estandar' as const,
      },
      {
        numero: 3,
        titulo: 'Sustenta el argumento científico',
        descripcion:
          'Organiza antecedentes, conceptos, variables o categorías e hipótesis cuando correspondan.',
        tipo: 'estandar' as const,
      },
      {
        numero: 4,
        titulo: 'Diseña la metodología',
        descripcion:
          'Explica el enfoque, diseño, población, muestra, técnicas, instrumentos y procedimiento del estudio.',
        tipo: 'estandar' as const,
      },
      {
        numero: 5,
        titulo: 'Presenta resultados verificables',
        descripcion:
          'Ordena los hallazgos y presenta evidencia directamente relacionada con los objetivos.',
        tipo: 'estandar' as const,
      },
      {
        numero: 6,
        titulo: 'Discute y concluye',
        descripcion:
          'Interpreta los hallazgos, los contrasta con la literatura y redacta conclusiones sin exagerar.',
        tipo: 'estandar' as const,
      },
      {
        numero: 7,
        titulo: 'Prepara el manuscrito para publicación',
        descripcion:
          'Completa resumen, palabras clave, citas, referencias, ética, originalidad y formato editorial.',
        tipo: 'estandar' as const,
      },
      {
        numero: 8,
        titulo: 'Responde a la revisión editorial',
        descripcion:
          'Revisa el manuscrito y responde con argumentos técnicos a las observaciones de los revisores.',
        tipo: 'boss' as const,
      },
    ];

    console.log('📚 Insertando los 8 niveles de ARTÍCULO...\n');

    for (const nivelData of nivelesData) {
      const nivel = nivelesRepo.create({
        modalidadId: modalidadArticulo.id,
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

    console.log('\n✅ Seed de ARTÍCULO completado exitosamente\n');
    console.log(`   - Modalidad: articulo (id: ${modalidadArticulo.id})`);
    console.log(`   - Niveles creados: ${nivelesData.length}`);
  } catch (error) {
    console.error('❌ Error durante el seed de articulo:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();