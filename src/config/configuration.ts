export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'tesis_quest',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'cambiar_en_produccion',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'cambiar_en_produccion_refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  ia: {
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModelPrimary: process.env.GEMINI_MODEL_PRIMARY ?? 'gemini-3.6-flash',
    geminiModelFallback: process.env.GEMINI_MODEL_FALLBACK ?? 'gemini-3.7-flash',
    groqApiKey: process.env.GROQ_API_KEY ?? '',
    groqModel: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
  },
});