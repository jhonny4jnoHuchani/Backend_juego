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
      1: 'El problema de investigación de la tesina debe ser específico, pertinente y viable. Delimite el objeto de estudio, la población, el contexto y el periodo; posteriormente, formule una pregunta que pueda responderse mediante evidencia.',
      2: 'La pregunta de investigación orienta el desarrollo del trabajo. El objetivo general expresa el propósito central, mientras que los objetivos específicos lo desglosan en acciones secuenciales, observables y alcanzables.',
      3: 'El marco teórico debe constituir una argumentación fundamentada, no una recopilación de definiciones. Seleccione antecedentes pertinentes, compare sus aportes y articule los conceptos, las variables o las categorías que explican el objeto de estudio.',
      4: 'La operacionalización traduce conceptos abstractos en dimensiones e indicadores observables. La metodología debe mantener coherencia con la pregunta de investigación, el enfoque, el diseño, la población y la muestra.',
      5: 'Un instrumento adecuado recopila información relacionada con los indicadores y se aplica mediante un procedimiento definido. La tesina debe contemplar el consentimiento informado, la confidencialidad y el trato respetuoso de las personas participantes.',
      6: 'El análisis organiza la evidencia para responder a cada objetivo. Presente los resultados de manera diferenciada de su interpretación, utilice tablas o categorías cuando contribuyan a la comprensión y limite las conclusiones a lo que los datos permiten sostener.',
      7: 'Las conclusiones sintetizan las respuestas a los objetivos, reconocen las limitaciones y pueden incluir recomendaciones debidamente fundamentadas. Toda fuente citada debe figurar en la lista de referencias, conforme a las normas de APA 7.',
      8: 'Una defensa académica eficaz expone de manera coherente el problema, los objetivos, el método, los resultados, las conclusiones y la contribución del estudio. Responda al tribunal con precisión, reconozca las limitaciones y fundamente las decisiones metodológicas.',
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