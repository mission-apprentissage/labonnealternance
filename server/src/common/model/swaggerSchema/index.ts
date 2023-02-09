import requireAll from "require-all"
import __dirname from "../../dirname.js"

let models = {}

function filterFile(filename) {
  if (filename.endsWith(".js") && filename !== "index.js") {
    return filename
  }

  return false
}

const modelsList = requireAll({
  dirname: __dirname(import.meta.url),
  filter: (filename) => filterFile(filename),
})

Object.keys(modelsList).forEach((filename) => {
  const model = modelsList[filename]
  models = { ...models, ...model }
})

export default models
