import path from "path"

import { __dirname } from "./dirname"

function getStaticDirPath(): string {
  // tsup build project into a single file to dist/index.js
  // Hence import.meta.url references dist/index.js
  if (process.env.IS_BUILT === "true") {
    return path.join(__dirname(import.meta.url), "../static")
  }

  // When ran directly from source code with tsx or jest
  // Then files are not compiled into a single file
  return path.join(__dirname(import.meta.url), "../../../static")
}

export function getStaticFilePath(relativeFilename: string): string {
  return path.join(getStaticDirPath(), relativeFilename)
}
