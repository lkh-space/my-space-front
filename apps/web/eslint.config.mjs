import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/react'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['src/shared/**/*.ts', 'src/shared/**/*.tsx'],
    ignores: ['src/shared/api/pdf.ts', 'src/shared/api/pdf.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/entities/**', '**/features/**', '**/widgets/**', '**/pages/**', '**/app/**'],
              message: 'shared 레이어는 상위 레이어(entities, features, widgets, pages, app)를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/**/*.ts', 'src/entities/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/widgets/**', '**/pages/**', '**/app/**'],
              message: 'entities 레이어는 상위 레이어(features, widgets, pages, app)를 참조할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
];
