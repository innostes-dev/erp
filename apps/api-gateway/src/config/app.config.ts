export interface AppConfig {
  port: number;
  shellUrl: string;
  nodeEnv: string;
  databaseUrl: string;
}

export function getAppConfig(): AppConfig {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('DATABASE_URL environment variable is not set');

  return {
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    shellUrl: process.env['SHELL_URL'] ?? 'http://localhost:3000',
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    databaseUrl,
  };
}
