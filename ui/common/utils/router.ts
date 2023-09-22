import { publicConfig } from "../../config.public"

export function redirect(path, replace = false) {
  let uri = ""

  if (!path.startsWith("/espace-pro")) {
    uri += publicConfig.baseUrlUi
  }

  uri += path

  if (replace) {
    window.location.replace(uri)
  } else {
    window.location.assign(uri)
  }
}
