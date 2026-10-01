import { Module } from '@nestjs/common';
import { IAEvaluatorService } from './ia-evaluator.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { JsonValidatorService } from './validators/json-validator.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { LoggerCostosService } from './providers/logger-costos.service';

@Module({
  providers: [
    IAEvaluatorService,
    PromptBuilderService,
    JsonValidatorService,
    GeminiProvider,
    GroqProvider,
    OpenAIProvider,
    LoggerCostosService,
  ],
  exports: [IAEvaluatorService],
})
export class IAModule {}