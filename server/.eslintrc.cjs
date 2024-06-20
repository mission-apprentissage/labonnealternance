// eslint-disable-next-line no-undef
module.exports = {
  extends: ["plugin:n/recommended-module"],
  rules: {
    "n/no-missing-import": 0,
    "import/no-extraneous-dependencies": 0,
    "n/no-extraneous-import": 0,
    "import/no-unresolved": 0,
  },
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    project: "server/tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "server/tsconfig.json",
      },
    },
  },
}
