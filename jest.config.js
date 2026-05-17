module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@innostes/core/bridge$': '<rootDir>/libs/core/bridge/src/index.ts',
    '^@innostes/core/database$': '<rootDir>/libs/core/database/src/index.ts',
    '^@innostes/core/auth$': '<rootDir>/libs/core/auth/src/index.ts',
    '^@innostes/core/design-system$': '<rootDir>/libs/core/design-system/src/index.ts',
    '^@paralleldrive/cuid2$': '<rootDir>/node_modules/@paralleldrive/cuid2/index.js',
  },
  rootDir: '.',
  testMatch: ['<rootDir>/apps/api-gateway/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        module: 'commonjs',
      },
    }],
    '^node_modules/@paralleldrive/cuid2/.*\\.js$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        module: 'commonjs',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!@paralleldrive/cuid2)',
  ],
};
