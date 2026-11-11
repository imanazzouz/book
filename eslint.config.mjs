import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Command-line entry points and the seed legitimately report progress on stdout.
    files: ['scripts/**/*.ts', 'src/server/db/seed/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // The shared database type erases the driver-specific result HKT on purpose.
    files: ['src/server/db/types.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];

export default config;
