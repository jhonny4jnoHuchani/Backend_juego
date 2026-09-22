import { EvaluacionResultado } from './evaluacion-resultado.interface';

export interface AIProvider {
  readonly nombre: string;

  evaluar(prompt: string): Promise<EvaluacionResultado>;
}