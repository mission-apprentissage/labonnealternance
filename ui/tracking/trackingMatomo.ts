import { init } from "@socialgouv/matomo-next"

import { publicConfig } from "@/config.public"
import { isWidget } from "@/utils/isWidget"

export const initMatomo = () => {
  if (!isWidget()) {
    init(publicConfig.matomo)
    // @ts-expect-error
    const paq = window._paq
    paq.push(["setConsentGiven"])
    paq.push(["rememberConsentGiven"])
    paq.push(["HeatmapSessionRecording::enable"])
  }
}
