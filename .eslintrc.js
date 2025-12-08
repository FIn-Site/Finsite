module.exports = {
  extends: "airbnb-base",
  "env": {
    "browser": true,
    "es2021": true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    // Turn off rules you don’t like
    "no-console": "off",
    "no-plusplus": "off",
    "no-underscore-dangle": "off",
    'import/extensions': 'off',
    'indent': ['error', 4, { SwitchCase: 1 }],
  }
};