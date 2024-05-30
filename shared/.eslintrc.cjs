// eslint-disable-next-line no-undef
module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  plugins: ["zod"],
  rules: {
    "zod/prefer-enum": "error",
    "import/no-extraneous-dependencies": 0,
  },
  parserOptions: {
    project: "shared/tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "shared/tsconfig.json",
      },
    },
  },
}
