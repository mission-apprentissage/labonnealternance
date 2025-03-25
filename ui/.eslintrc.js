module.exports = {
  extends: ["next", "next/core-web-vitals"],
  rules: {
    "react/no-unescaped-entities": 0,
    "react-hooks/exhaustive-deps": 0,
    "import/no-extraneous-dependencies": 0,
  },
  overrides: [
    {
      files: ["app/**/*.ts", "app/**/*.tsx"],
      rules: {
        "react-hooks/exhaustive-deps": "error",
      },
    },
  ],
  settings: {
    next: {
      rootDir: "ui",
    },
    "import/resolver": {
      typescript: {
        project: "ui/tsconfig.json",
      },
    },
  },
}
