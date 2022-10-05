import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);

export const packageJson = require("../../package.json");

export function getDirname(base) {
  return dirname(fileURLToPath(base));
}
