/** Unit tests (no database required). */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: true }] },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/migrate.ts', '!src/scripts/**'],
  coverageDirectory: 'coverage',
  setupFiles: ['<rootDir>/test/setup-env.js'],
};
