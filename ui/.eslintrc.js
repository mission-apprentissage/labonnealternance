module.exports = {
  extends: ["next", "next/core-web-vitals"],
  rules: {
    "react/no-unescaped-entities": 0,
    "import/no-mutable-exports": 0,
    "import/no-anonymous-default-export": 0,
    "react-hooks/exhaustive-deps": 0,
    "react/no-unknown-property": 0,
    "react/jsx-filename-extension": [2, { allow: "as-needed", "extensions": [".tsx", ".jsx"] }],
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
        ],
        optionalDependencies: false,
      },
    ],
  },
}
