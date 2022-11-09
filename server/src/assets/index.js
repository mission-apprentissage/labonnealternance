import fs from "fs";
import path from "path";

import __dirname from "../common/dirname.js";

/**
 * @description generate an object where the keys are the file name without extension and the value is the path of the file
 * @returns {object} filePaths
 */
const createPaths = () => {
  let paths = {};
  const dirname = __dirname(import.meta.url);

  fs.readdirSync(path.join(dirname, "./templates")).forEach((file) => {
    const [fileName] = file.split(".");
    paths[fileName] = path.resolve(dirname, "./templates", file);
  });

  return paths;
};

export const mailTemplate = createPaths();
