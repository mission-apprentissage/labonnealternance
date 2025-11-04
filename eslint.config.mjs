import { fileURLToPath } from "node:url"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig, globalIgnores } from "eslint/config"
import { includeIgnoreFile } from "@eslint/compat"
import globals from "globals"
import js from "@eslint/js"
import importAlias from "@dword-design/eslint-plugin-import-alias"
import * as tseslint from "typescript-eslint"
import * as importX from "eslint-plugin-import-x"
import next from "@next/eslint-plugin-next"
import nodePlugin from "eslint-plugin-n"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url))

const ALL_FILES = "**/*.{js,mjs,cjs,ts,tsx,jsx}"
const TS_FILES = "**/*.{ts,tsx}"

export default defineConfig([
  includeIgnoreFile(gitignorePath),

  globalIgnores([".yarn"]),

  {
    ...nodePlugin.configs["flat/recommended"],
    settings: {
      node: {
        version: ">=24.0.0",
      },
    },
  },
  js.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  tseslint.configs.recommended,

  {
    name: "all-files",
    files: [ALL_FILES],
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // redundant with import-x
      "n/no-missing-import": "off",
      "n/no-extraneous-import": "off",

      "import-x/no-named-as-default-member": "off",
      "import-x/default": "off",
      "import-x/order": "error",
      "import-x/no-cycle": ["error", { ignoreExternal: true }],
      "import-x/no-relative-packages": "error",
      "import-x/no-useless-path-segments": ["error"],
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/tests/**/*.ts",
            "**/tests/*.ts",
            "**/fixtures/**/*.ts",
            "**/tsup.config.ts",
            "**/vitest.config.ts",
            "**/eslint.config.mjs",
          ],
        },
      ],
    },
    settings: {
      "import-x/resolver": {
        typescript: {
          project: ["tsconfig.json", "server/tsconfig.json", "shared/tsconfig.json", "ui/tsconfig.json"],
        },
      },
    },
  },

  {
    name: "typescript-files",
    files: [TS_FILES],
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json", "server/tsconfig.json", "shared/tsconfig.json", "ui/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],

      "@typescript-eslint/ban-ts-comment": ["off"],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    name: "server-only-files",
    plugins: importAlias.configs.recommended.plugins,
    files: ["server/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    rules: {
      "n/no-unpublished-import": "off",
      "@dword-design/import-alias/prefer-alias": [
        "error",
        {
          alias: {
            "@": "./server/src",
            "@tests": "./server/tests",
          },
        },
      ],
    },
  },
  {
    name: "next-recommended",
    files: ["ui/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    ...next.configs.recommended,
  },
  {
    name: "next-core-web-vitals",
    files: ["ui/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    ...next.configs["core-web-vitals"],
  },
  {
    name: "react-hooks",
    files: ["ui/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    name: "ui-files",
    plugins: importAlias.configs.recommended.plugins,
    files: ["ui/**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    rules: {
      "n/no-unpublished-import": "off",
      "react/no-unescaped-entities": "off",
      "@dword-design/import-alias/prefer-alias": [
        "error",
        {
          alias: {
            "@": "./ui",
            shared: "./shared",
          },
        },
      ],
    },
    settings: {
      "import-x/resolver": {
        typescript: {
          project: ["tsconfig.json", "server/tsconfig.json", "shared/tsconfig.json", "ui/tsconfig.json"],
        },
      },
      react: {
        version: "19",
      },
      next: {
        rootDir: "ui",
      },
    },
  },
])
