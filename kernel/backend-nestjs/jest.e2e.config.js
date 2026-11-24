/** End-to-end tests (supertest, needs PostgreSQL via TEST_DATABASE_URL). */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: true }] },
  testTimeout: 60000,
  setupFiles: ['<rootDir>/test/setup-env.js'],
};
