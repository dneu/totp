import globals from "globals";
import pluginJs from "@eslint/js";
import pluginPromise from "eslint-plugin-promise";

export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  {
    plugins: {
      promise: pluginPromise, // Register the promise plugin
    },
    rules: {
      "promise/no-floating-promise": "error", // Add the rule here
    },
  },
];
