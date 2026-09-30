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
      1: 'Un artículo científico requiere un tema delimitado y una contribución claramente identificable. Precise el fenómeno, la población, el contexto y el periodo de estudio; luego, establezca el conocimiento que aportará el manuscrito.',
      2: 'La introducción debe avanzar de lo general a lo específico: contextualice el problema mediante fuentes pertinentes, identifique la brecha de conocimiento, formule la pregunta de investigación y presente el objetivo del artículo.',
      3: 'La fundamentación científica articula antecedentes, conceptos y variables o categorías. Sustente cada afirmación relevante con fuentes confiables y formule hipótesis únicamente cuando el enfoque y el diseño permitan someterlas a comprobación.',
      4: 'La metodología debe ofrecer información suficiente para que otras personas comprendan y, cuando corresponda, repliquen el estudio. Justifique el enfoque, el diseño, los participantes, la muestra, los instrumentos, el procedimiento y el método de análisis.',
      5: 'La sección de resultados debe presentar evidencia empírica de manera objetiva. Organice tablas, figuras o categorías de acuerdo con los objetivos, comunique los datos con precisión y reserve la explicación de causas y la comparación con la literatura para la discusión.',
      6: 'La discusión interpreta los resultados a la luz de los antecedentes y expone los alcances y las limitaciones del estudio. Las conclusiones deben responder a los objetivos y evitar afirmaciones que no estén respaldadas por los datos.',
      7: 'El manuscrito debe cumplir criterios de localización, verificabilidad e integridad ética. El resumen sintetiza el objetivo, el método, los resultados y la conclusión; las palabras clave favorecen la indexación; las citas y referencias deben ajustarse a APA 7, y la originalidad debe declararse conforme a las normas editoriales.',
      8: 'La respuesta a los evaluadores forma parte del proceso de publicación científica. Atienda cada observación con respeto, precise los cambios realizados e indique la página o sección correspondiente. Si decide no incorporar una sugerencia, fundamente la decisión con evidencia y argumentos académicos.',
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