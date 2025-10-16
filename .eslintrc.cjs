module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:import/recommended", "plugin:@eslint-community/eslint-comments/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["simple-import-sort", "import"],
  rules: {
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        args: "after-used",
        caughtErrorsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "": "never",
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "import/no-useless-path-segments": "error",
    "import/no-unresolved": ["error", { caseSensitive: true }],
    "import/first": "error",
    "import/no-named-as-default": "off",
    "import/no-anonymous-default-export": "off",
    "import/no-named-as-default-member": "off",
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
          "**/cypress.config.ts",
          "*.ts",
        ],
        optionalDependencies: false,
      },
    ],
  },
  overrides: [
    {
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      files: ["**/*.ts", "**/*.tsx"],
      extends: ["plugin:import/typescript", "plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/ban-ts-comment": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            args: "after-used",
            caughtErrorsIgnorePattern: "^_",
            ignoreRestSiblings: true,
          },
        ],
        "import/default": "off",
      },
    },
  ],
  settings: {
    "import/extensions": [".js", ".ts", ".jsx", ".tsx"],
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    node: {
      allowModules: ["shared"],
    },
  },
}
