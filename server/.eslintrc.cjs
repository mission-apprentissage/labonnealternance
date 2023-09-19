// eslint-disable-next-line no-undef
module.exports = {
  extends: ["plugin:n/recommended-module"],
  ignorePatterns: ["**/tests/"],
  rules: {
    "n/no-missing-import": 0,
  },
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    project: "server/tsconfig.json",
  },
  overrides: [
    // {
    //   files: ["./tsup.config.ts", "src/dev.ts"],
    //   rules: {
    //     // autorise l'import des devDependencies
    //     // "node/no-unpublished-import": "off",
    //     // "node/no-extraneous-import": "error",
    //   },
    // },
    // {
    //   files: ["**/*test.{js, ts}", "**/*Tests.{js, ts}", "tests/**/*.{js, ts}"],
    //   rules: {
    //     // "node/no-unpublished-require": "off",
    //     // "no-nonoctal-decimal-escape": "off",
    //     "no-unsafe-optional-chaining": "off",
    //     "node/no-unpublished-import": "off",
    //     "node/no-extraneous-import": "error",
    //   },
    // },
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: "server/tsconfig.json",
      },
    },
  },
}
