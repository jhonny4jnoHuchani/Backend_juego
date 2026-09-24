import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TESIS...\n');

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
        'No se encontró la modalidad "tesis". Ejecuta primero `npm run seed`.',
      );
    }

    console.log(
      `   ℹ️  Modalidad "tesis" encontrada (id: ${modalidadTesis.id})\n`,
    );

    // ============================================================
    // 2. Verificar si ya existen niveles de tesis
    // ============================================================
    const nivelesRepo = dataSource.getRepository(Nivel);
    const nivelesExistentes = await nivelesRepo.count({
      where: { modalidadId: modalidadTesis.id },
    });

    if (nivelesExistentes > 0) {
      console.log(
        `   ⚠️  Ya existen ${nivelesExistentes} niveles en "tesis". Saltando...\n`,
      );
      console.log('   💡 Si quieres recrear los niveles, bórralos primero:');
      console.log(`      DELETE FROM niveles WHERE modalidad_id = ${modalidadTesis.id};\n`);
      await app.close();
      process.exit(0);
    }

    // ============================================================
    // 3. Definir los 18 niveles de TESIS
    // ============================================================
    const nivelesData = [
      {
        numero: 1,
        titulo: 'Construye tu tema',
        descripcion:
          'Transforma una idea vaga en un tema de investigación concreto, delimitado y viable.',
        tipo: 'estandar' as const,
      },
      {
        numero: 2,
        titulo: 'Identifica el problema',
        descripcion:
          'Aprende a reconocer y formular el problema de investigación a partir de una situación real.',
        tipo: 'estandar' as const,
      },
      {
        numero: 3,
        titulo: 'Construye un título científico',
        descripcion:
          'Formula un título que incluya variable, población, lugar y tiempo.',
        tipo: 'estandar' as const,
      },
      {
        numero: 4,
        titulo: 'Formula la pregunta de investigación',
        descripcion:
          'Convierte el problema en una pregunta clara y respondible.',
        tipo: 'estandar' as const,
      },
      {
        numero: 5,
        titulo: 'Formula el objetivo general',
        descripcion:
          'Define qué vas a lograr con tu investigación en una sola oración.',
        tipo: 'estandar' as const,
      },
      {
        numero: 6,
        titulo: 'Construye objetivos específicos',
        descripcion:
          'Divide el objetivo general en pasos concretos y alcanzables.',
        tipo: 'estandar' as const,
      },
      {
        numero: 7,
        titulo: 'Identifica variables o categorías',
        descripcion:
          'Reconoce las variables de tu estudio y su rol en la investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 8,
        titulo: 'Construye dimensiones e indicadores',
        descripcion:
          'Operacionaliza tus variables en dimensiones e indicadores medibles.',
        tipo: 'estandar' as const,
      },
      {
        numero: 9,
        titulo: 'Formula hipótesis cuando corresponda',
        descripcion:
          'Aprende cuándo y cómo formular hipótesis de investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 10,
        titulo: 'Busca antecedentes',
        descripcion:
          'Identifica y evalúa investigaciones previas relacionadas con tu tema.',
        tipo: 'estandar' as const,
      },
      {
        numero: 11,
        titulo: 'Construye el marco teórico',
        descripcion:
          'Organiza las teorías y conceptos que sustentan tu investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 12,
        titulo: 'Aprende citas APA 7',
        descripcion:
          'Domina los formatos de cita narrativa, parentética y textual según APA 7.',
        tipo: 'estandar' as const,
      },
      {
        numero: 13,
        titulo: 'Selecciona metodología',
        descripcion:
          'Elige el enfoque, tipo y diseño de investigación adecuados.',
        tipo: 'estandar' as const,
      },
      {
        numero: 14,
        titulo: 'Diseña técnicas e instrumentos',
        descripcion:
          'Selecciona y diseña las técnicas e instrumentos de recolección de datos.',
        tipo: 'estandar' as const,
      },
      {
        numero: 15,
        titulo: 'Interpreta resultados',
        descripcion:
          'Aprende a leer, analizar e interpretar los resultados de tu investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 16,
        titulo: 'Redacta conclusiones',
        descripcion:
          'Redacta conclusiones que respondan a tus objetivos de investigación.',
        tipo: 'estandar' as const,
      },
      {
        numero: 17,
        titulo: 'Construye referencias',
        descripcion:
          'Aprende a construir la lista de referencias según las normas APA 7.',
        tipo: 'estandar' as const,
      },
      {
        numero: 18,
        titulo: 'Defiende tu investigación',
        descripcion:
          'Enfrenta al tribunal académico y defiende tu tesis ante observaciones reales.',
        tipo: 'boss' as const,
      },
    ];

    // ============================================================
    // 4. Insertar los niveles
    // ============================================================
    console.log('📚 Insertando los 18 niveles de TESIS...\n');

    for (const nivelData of nivelesData) {
      const nivel = nivelesRepo.create({
        modalidadId: modalidadTesis.id,
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

    console.log('\n✅ Seed de TESIS completado exitosamente\n');
    console.log('📊 Resumen:');
    console.log(`   - Modalidad: tesis (id: ${modalidadTesis.id})`);
    console.log(`   - Niveles creados: ${nivelesData.length}`);
    console.log(
      `   - Niveles Boss: ${nivelesData.filter((n) => n.tipo === 'boss').length}`,
    );
    console.log(
      `   - Niveles estándar: ${nivelesData.filter((n) => n.tipo === 'estandar').length}\n`,
    );

    console.log('💡 Siguiente paso:');
    console.log('   Ahora puedes añadir misiones a cada nivel con otro seed.\n');
  } catch (error) {
    console.error('❌ Error durante el seed de tesis:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();