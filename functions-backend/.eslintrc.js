module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "semi": ["error", "always"],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": "off",
    "comma-dangle": ["error", "never"],
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", { "code": 120 }]
  },
};