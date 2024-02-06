module.exports = {
  root: true,
  extends: ['@nuxtjs/eslint-config-typescript', 'plugin:prettier/recommended'],
  rules: {
    'vue/block-lang': [2, { script: { lang: ['ts', 'tsx'] } }],
    'vue/no-multiple-template-root': 0,
    'vue/multi-word-component-names': 0,
    'vue/component-name-in-template-casing': [1, 'PascalCase', { registeredComponentsOnly: false }],
    'vue/v-on-event-hyphenation': [1, 'always', { autofix: true }],
    'vue/attribute-hyphenation': [1, 'always'],
    'vue/no-unused-vars': [1, { ignorePattern: '^_' }],
    '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: '^_' }],
  },
}
