import { ResultadoIntento } from '../../../common/enums/resultado-intento.enum';

export interface CriterioEvaluado {
  nombre: string;
  cumplido: boolean;
  comentario: string;
  peso?: number;
}

export interface EvaluacionResultado {
  resultado: ResultadoIntento;
  puntuacion: number;
  criterios: CriterioEvaluado[];
  pista: string | null;
  explicacion: string;
}

export interface EvaluacionMeta {
  proveedor: string;
  modelo: string;
  intentosFormato: number;
  duracionMs: number;
}

export interface EvaluacionCompleta extends EvaluacionResultado {
  _meta: EvaluacionMeta;
}