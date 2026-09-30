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
        titulo: 'Delimitación del tema y de la contribución',
        descripcion:
          'Delimite una idea general hasta definir un tema de artículo específico, viable y con una contribución claramente identificable.',
        tipo: 'estandar' as const,
      },
      {
        numero: 2,
        titulo: 'Estructuración de la introducción',
        descripcion:
          'Exponga el problema, la pregunta de investigación, el objetivo y la brecha de conocimiento que fundamentan el artículo.',
        tipo: 'estandar' as const,
      },
      {
        numero: 3,
        titulo: 'Fundamentación del argumento científico',
        descripcion:
          'Integre los antecedentes, conceptos, variables o categorías y, cuando corresponda, las hipótesis que sustentan el estudio.',
        tipo: 'estandar' as const,
      },
      {
        numero: 4,
        titulo: 'Diseño de la metodología',
        descripcion:
          'Describa el enfoque, el diseño, la población, la muestra, las técnicas, los instrumentos y el procedimiento de investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 5,
        titulo: 'Presentación de resultados verificables',
        descripcion:
          'Organice los hallazgos y presente evidencia pertinente, verificable y vinculada con los objetivos del estudio.',
        tipo: 'estandar' as const,
      },
      {
        numero: 6,
        titulo: 'Discusión de resultados y conclusiones',
        descripcion:
          'Interprete los hallazgos, contrástelos con la literatura pertinente y formule conclusiones proporcionales a la evidencia.',
        tipo: 'estandar' as const,
      },
      {
        numero: 7,
        titulo: 'Preparación del manuscrito para publicación',
        descripcion:
          'Verifique el resumen, las palabras clave, las citas, las referencias, los aspectos éticos, la originalidad y los requisitos editoriales.',
        tipo: 'estandar' as const,
      },
      {
        numero: 8,
        titulo: 'Respuesta a la evaluación editorial',
        descripcion:
          'Revise el manuscrito y responda a las observaciones de los evaluadores con argumentos técnicos, precisos y fundamentados.',
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