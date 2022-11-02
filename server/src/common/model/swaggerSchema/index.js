const requireAll = require("require-all");

let models = {};

function filterFile(filename) {
  if (filename.endsWith(".js") && filename !== "index.js") {
    return filename;
  }

  return false;
}

const modelsList = requireAll({
  dirname: __dirname,
  filter: (filename) => filterFile(filename),
});

Object.keys(modelsList).forEach((filename) => {
  const model = modelsList[filename];
  models = { ...models, ...model };
});

module.exports = models;
