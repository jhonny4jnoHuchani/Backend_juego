import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TEORÍAS de ARTÍCULO...\n');

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
    const misionesRepo = dataSource.getRepository(Mision);
    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadArticulo.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error('No hay niveles de articulo.');
    }

    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) {
      nivelesPorNumero.set(nivel.numero, nivel);
    }

    const teoriasPorNivel: Record<number, string> = {
      1: 'Un artículo necesita un tema acotado y una contribución identificable. Delimita fenómeno, población, contexto y periodo; después expresa qué conocimiento nuevo aportará el manuscrito.',
      2: 'La introducción avanza de lo general a lo específico: presenta el problema con fuentes, explica el vacío de conocimiento, formula la pregunta y cierra con el objetivo del artículo.',
      3: 'El sustento científico conecta antecedentes, conceptos y variables o categorías. Cada afirmación relevante debe tener una fuente confiable y la hipótesis solo se formula cuando el enfoque y el diseño permiten comprobarla.',
      4: 'La metodología debe permitir que otra persona comprenda y replique el estudio. Justifica enfoque, diseño, participantes, muestra, instrumentos, procedimiento y forma de análisis.',
      5: 'Los resultados muestran evidencia, no opiniones. Organiza tablas, figuras o categorías según los objetivos, informa los datos con precisión y evita explicar causas o comparar literatura dentro de esta sección.',
      6: 'La discusión interpreta los resultados, los compara con antecedentes y reconoce alcances y limitaciones. Las conclusiones responden a los objetivos y no presentan afirmaciones que los datos no sostienen.',
      7: 'El manuscrito debe ser localizable, verificable y ético. El resumen sintetiza objetivo, método, resultados y conclusión; las palabras clave facilitan la indexación; las citas y referencias siguen APA 7 y se declara la originalidad.',
      8: 'Responder a revisores es parte del proceso científico. Contesta cada observación con respeto, indica el cambio realizado y señala la página o sección modificada; si discrepas, argumenta con evidencia y no de forma personal.',
    };

    console.log('📝 Actualizando teorías de las misiones...\n');
    let actualizadas = 0;

    for (const [numeroNivel, teoria] of Object.entries(teoriasPorNivel)) {
      const nivel = nivelesPorNumero.get(Number(numeroNivel));
      if (!nivel) continue;

      const mision = await misionesRepo.findOne({
        where: { nivelId: nivel.id, esPrincipal: true },
      });

      if (!mision) {
        console.log(`   ⚠️  Nivel ${numeroNivel}: no tiene misión principal.`);
        continue;
      }

      await misionesRepo.update({ id: mision.id }, { teoria });
      console.log(`   ✅ Nivel ${numeroNivel}: teoría actualizada`);
      actualizadas++;
    }

    console.log(`\n✅ Teorías de ARTÍCULO actualizadas: ${actualizadas}\n`);
  } catch (error) {
    console.error('❌ Error durante el seed de teorías:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();