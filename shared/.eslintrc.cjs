// eslint-disable-next-line no-undef
module.exports = {
  env: {
    es2022: true,
    node: true,
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
