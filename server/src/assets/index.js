import fs from "fs";
import path from "path";

/**
 * @description generate an object where the keys are the file name without extension and the value is the path of the file
 * @returns {object} filePaths
 */
const createPaths = () => {
  let paths = {};

  fs.readdirSync(path.join(__dirname, "./templates")).forEach((file) => {
    const [fileName] = file.split(".");
    paths[fileName] = path.resolve("src/assets/templates", file);
  });

  return paths;
};

export const mailTemplate = createPaths();
