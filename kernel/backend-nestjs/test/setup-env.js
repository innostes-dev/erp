// Deterministic, non-production environment for tests.
process.env.APP_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test-jwt-secret-key-0123456789-abcdefghij';
process.env.SETUP_TOKEN = process.env.SETUP_TOKEN || 'test-setup-token';
process.env.SETUP_ENABLED = 'true';
process.env.AUTO_MIGRATE = 'false';
