import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const layers = {
  contracts: ['contracts'],
  core: ['core', 'mocks', 'contracts'],
  ui: ['ui'],
  layouts: ['core', 'ui', 'pattern', 'layouts'],
  pattern: ['core', 'ui', 'pattern'],
  features: ['core', 'ui', 'pattern', 'features', 'contracts'],
  routes: ['core', 'ui', 'pattern', 'layouts', 'features'],
  mocks: ['core', 'mocks', 'contracts'],
}

const srcTypes = Object.keys(layers)

const allTypes = [...srcTypes, 'app']

export default defineConfig(
  globalIgnores(['dist', 'playwright-report', 'test-results', 'lighthouse/reports', 'public', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true, project: ['./tsconfig.json'] } },
      'boundaries/include': ['src/**/*'],
      'boundaries/ignore': ['src/routeTree.gen.ts'],
      'boundaries/elements': [
        ...srcTypes.map((type) => ({ type, pattern: `src/${type}`, partialMatch: false })),
        { type: 'app', pattern: 'src/*', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...Object.entries(layers).map(([from, to]) => ({
              from: { element: { type: from } },
              allow: { to: { element: { types: { anyOf: to } } } },
            })),
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: { anyOf: allTypes } } } },
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'socket.io-client',
              allowTypeImports: true,
              message: 'Carregue o socket.io-client por import dinâmico depois do mocksReady (ver core/realtime.ts).',
            },
          ],
          patterns: [{ group: ['../*'], message: 'Use um path alias (@core, @ui, ...) em vez de import relativo entre módulos.' }],
        },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportAllDeclaration', message: 'Sem barrel exports.' },
        { selector: 'ExportNamedDeclaration[source]', message: 'Sem re-exports (barrel).' },
        { selector: 'ClassDeclaration, ClassExpression', message: 'Prefira funções puras a classes.' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            { from: 'package', package: '@tanstack/router-core', name: 'Redirect' },
            { from: 'package', package: '@tanstack/router-core', name: 'NotFoundError' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/mocks/**', 'e2e/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['e2e/**', '*.config.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-imports': 'off' },
  },
)
