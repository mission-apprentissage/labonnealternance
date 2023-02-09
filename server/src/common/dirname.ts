import path from "path"
import { fileURLToPath } from "url"

const __dirname = (filePath: string): string => {
  const __filename = fileURLToPath(filePath)
  return path.dirname(__filename)
}

export default __dirname
