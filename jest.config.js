module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@innostes/core/bridge$': '<rootDir>/libs/core/bridge/src/index.ts',
  },
  rootDir: '.',
  testMatch: ['<rootDir>/apps/api-gateway/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
