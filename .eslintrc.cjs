module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "import", "unused-imports"],
  rules: {
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "no-unused-vars": 0, // duplicated with @typescript-eslint/no-unused-vars
    "node/no-missing-import": 0, // duplicated with import/no-unresolved

    // imports
    "import/extensions": ["error"],
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object"],
        pathGroups: [
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
      },
    ],
    "import/newline-after-import": "error",
    "import/no-mutable-exports": "error",
    "import/default": "off",
    "import/no-named-as-default-member": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/test/**",
          "**/tests/**",
          "**/spec/**",
          "**/__tests__/**",
          "**/__mocks__/**",
          "**/test.{js,jsx,ts,tsx}",
          "**/test-*.{js,jsx,ts,tsx}",
          "**/*{.,_}{test,spec,stories,bench,fixture}.{js,jsx,ts,tsx}",
          "**/jest.config.js",
          "**/dev.ts",
          "**/tsup.config.ts",
        ],
        optionalDependencies: false,
      },
    ],
  },
  settings: {
    "import/extensions": [".js", ".ts"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },
};
