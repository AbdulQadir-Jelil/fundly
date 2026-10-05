/** Registers the TypeScript-aware resolver used by `npm run verify`. */
import { register } from "node:module";

register("./verify-hooks.mjs", import.meta.url);
