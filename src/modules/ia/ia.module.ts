import { Module } from '@nestjs/common';
import { IAEvaluatorService } from './ia-evaluator.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { JsonValidatorService } from './validators/json-validator.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';

@Module({
  providers: [
    IAEvaluatorService,
    PromptBuilderService,
    JsonValidatorService,
    GeminiProvider,
    GroqProvider,
  ],
  exports: [IAEvaluatorService],
})
export class IAModule {}