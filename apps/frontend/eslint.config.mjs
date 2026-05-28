import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Data-fetch effects now use the shared useFetch hook; the remaining
      // legitimate cases (form-reset dialogs, prop/store->local-input sync,
      // socket setup) carry targeted eslint-disable comments, so enforce this
      // as an error to catch new violations.
      "react-hooks/set-state-in-effect": "error",
      // Allow intentionally-unused identifiers prefixed with _ and the
      // destructured-rest "omit" pattern (e.g. const { a: _a, ...rest } = obj).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
