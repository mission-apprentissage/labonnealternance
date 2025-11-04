import { isOriginLocal } from "./isOriginLocal"
import config from "@/config"


const allowedSources = config.allowedSources

const isAllowedSource = ({ referer, caller }) => {
  return isOriginLocal(referer) || isAllowedClearEmail({ caller })
}

const isAllowedClearEmail = ({ caller }) => {
  return allowedSources.split("|").indexOf(caller) >= 0
}

export { isAllowedSource, isAllowedClearEmail }
