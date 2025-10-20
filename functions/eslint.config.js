// @ts-check

import globals from "globals";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";

export default tseslint.config(
  {
    ignores: ["lib/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "quotes": ["error", "double"],
      "require-jsdoc": "off",
    },
  },
);
