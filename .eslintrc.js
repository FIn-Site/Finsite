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
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    'max-len': 'off',
    'no-await-in-loop': 'off', //Enable when implementing file parsing
    'indent': ['error', 4, { SwitchCase: 1 }],
    'no-use-before-define': ['error', {
        functions: false,
        classes: true,
        variables: true,
    }],
    'no-param-reassign': ['error', {
        props: false,
    }],
    'no-restricted-syntax': ['error', {
      selector: 'ForInStatement',
      message: 'for..in is discouraged. Use Object.keys/entries + array methods instead.',
    },
    {
      selector: 'LabeledStatement',
      message: 'Labels are discouraged.',
    },
    {
      selector: 'WithStatement',
      message: '`with` is forbidden in strict mode.',
    }],
    'prefer-destructuring': ['error', {
      array: false,   // don’t enforce for arrays
      object: true,   // still enforce for objects
    }, {
      enforceForRenamedProperties: false,
    }],
  },
    
  globals: {
    Chart: 'readonly',
 },
};