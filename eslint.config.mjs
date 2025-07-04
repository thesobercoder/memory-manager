import effectPlugin from "@effect/eslint-plugin";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", ".claude/**"]
  },
  {
    plugins: {
      "@effect": effectPlugin
    },
    rules: {
      "@effect/dprint": [
        "warn",
        {
          config: {
            indentWidth: 2,
            lineWidth: 120,
            semiColons: "always",
            quoteStyle: "alwaysDouble",
            trailingCommas: "never",
            operatorPosition: "maintain",
            "arrowFunction.useParentheses": "force"
          }
        }
      ],
      "@effect/no-import-from-barrel-package": "error"
    }
  }
);
