import antfu from '@antfu/eslint-config'

export default antfu(
  {
    lessOpinionated: true,
    ignores: [
      'types/auto-imports.d.ts',
      'types/components.d.ts',
      'src/utils/uploader.ts',
      'src/utils/simple-uploader/**',
      'src/components/verify/**',
    ],
    formatters: {
      css: true,
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': 'off',
      'vue/html-self-closing': 'off',
      'vue/quote-props': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'no-useless-constructor': 'error',
      'constructor-super': 'error',
    },
  },
  {
    files: ['**/*.vue', '**/*.ts'],
    rules: {
      'curly': 'off',
      'default-case': 'error',
      'max-depth': ['error', 4],
      'camelcase': [
        'error',
        {
          properties: 'never',
        },
      ],
      // 'id-match': ['error', '^[a-z]+([A-Z][a-z]*)*$', {
      //   properties: false,
      //   onlyDeclarations: true,
      // }], // 强制小驼峰，camelcase不会检查小驼峰了  还有点问题类型检测不对

      'style/semi': 'off',
      'style/member-delimiter-style': 'off',
      'style/quote-props': 'off',
      'style/brace-style': 'off',

      'unicorn/prefer-number-properties': 'off',

      'no-console': 'off',
      'no-new-object': 'error',
      'no-inner-declarations': 'error',
      'no-param-reassign': 'error',
      'no-void': 'error',
      'no-useless-escape': 'error',
      'no-underscore-dangle': 'error',

    },
  },
)
