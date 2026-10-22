import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { ignores: ["test/tmp*/**", "test/fixtures*/**", "test-fixtures-*/**"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
];
