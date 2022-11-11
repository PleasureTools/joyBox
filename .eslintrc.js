module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "semi": ["error", "always"],
    "space-before-function-paren": ["error", {"anonymous": "always", "named": "never", "asyncArrow": "always"}],
    "operator-linebreak": ["error", "after"],
    "indent": "off",
    '@typescript-eslint/indent': [
      'error',
      2
  ],
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "no-empty-function": "off",
  "@typescript-eslint/no-empty-function": "off",
  "no-useless-constructor": "off",
  "no-unused-expressions": "off",
  "promise/param-names": "off",
  "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
  "prefer-promise-reject-errors": ["error", {"allowEmptyReject": true}],
  "@typescript-eslint/no-non-null-assertion": "off",
  "no-async-promise-executor": "off"
  }
}
