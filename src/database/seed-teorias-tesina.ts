import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Modalidad } from '../modules/modalidades/entities/modalidad.entity';
import { Nivel } from '../modules/niveles/entities/nivel.entity';
import { Mision } from '../modules/misiones/entities/mision.entity';

async function bootstrap() {
  console.log('🌱 Iniciando seed de TEORÍAS de TESINA...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const modalidadesRepo = dataSource.getRepository(Modalidad);
    const modalidadTesina = await modalidadesRepo.findOne({
      where: { nombre: 'tesina' },
    });

    if (!modalidadTesina) {
      throw new Error('No se encontró la modalidad "tesina".');
    }

    const nivelesRepo = dataSource.getRepository(Nivel);
    const misionesRepo = dataSource.getRepository(Mision);
    const niveles = await nivelesRepo.find({
      where: { modalidadId: modalidadTesina.id },
      order: { orden: 'ASC' },
    });

    if (niveles.length === 0) {
      throw new Error('No hay niveles de tesina.');
    }

    const nivelesPorNumero = new Map<number, Nivel>();
    for (const nivel of niveles) nivelesPorNumero.set(nivel.numero, nivel);

    const teoriasPorNivel: Record<number, string> = {
      1: 'El problema de la tesina debe ser específico, relevante y viable. Delimita qué estudiarás, a quiénes, dónde y cuándo; luego formula una pregunta que pueda responderse con datos.',
      2: 'La pregunta guía todo el trabajo. El objetivo general expresa el resultado esperado y los objetivos específicos lo dividen en acciones ordenadas, observables y alcanzables.',
      3: 'El marco teórico no es una colección de definiciones. Selecciona antecedentes pertinentes, compara sus aportes y construye un argumento que explique los conceptos, variables o categorías del estudio.',
      4: 'Operacionalizar significa pasar de conceptos abstractos a dimensiones e indicadores observables. La metodología debe ser coherente con la pregunta, el enfoque, el diseño, la población y la muestra.',
      5: 'Un instrumento válido recoge información relacionada con los indicadores y se aplica mediante un procedimiento definido. La tesina también debe proteger consentimiento, confidencialidad y trato digno de los participantes.',
      6: 'El análisis organiza la evidencia para responder cada objetivo. Presenta resultados separados de la interpretación, usa tablas o categorías cuando ayuden y no afirma más de lo que permiten los datos.',
      7: 'Las conclusiones sintetizan respuestas a los objetivos, reconocen límites y pueden proponer recomendaciones justificadas. Toda fuente citada debe aparecer en referencias y seguir APA 7.',
      8: 'Una defensa eficaz cuenta una historia académica coherente: problema, objetivos, método, resultados, conclusiones y aporte. Responde al tribunal con precisión, reconoce límites y sustenta sus decisiones.',
    };

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

      await misionesRepo.update({ id: mision.id }, { teoria } as any);
      console.log(`   ✅ Nivel ${numeroNivel}: teoría actualizada`);
      actualizadas++;
    }

    console.log(`\n✅ Teorías de TESINA actualizadas: ${actualizadas}\n`);
  } catch (error) {
    console.error('❌ Error durante el seed de teorías:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();