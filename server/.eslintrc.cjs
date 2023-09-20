// eslint-disable-next-line no-undef
module.exports = {
  extends: ["plugin:n/recommended-module"],
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
    {
      files: ["src/generated/**/*.ts"],
      rules: {
        "@eslint-community/eslint-comments/disable-enable-pair": "off",
        "@eslint-community/eslint-comments/no-unlimited-disable": "off",
      },
    },
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: "server/tsconfig.json",
      },
    },
  },
}
