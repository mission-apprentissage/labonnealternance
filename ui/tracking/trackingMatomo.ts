import { init } from "@socialgouv/matomo-next"

import { publicConfig } from "@/config.public"

export const initMatomo = () => {
  try {
    init(publicConfig.matomo)
    // @ts-expect-error
    const paq = window._paq
    paq.push(["setConsentGiven"])
    paq.push(["rememberConsentGiven"])
    paq.push(["HeatmapSessionRecording::enable"])
  } catch (err) {
    console.warn("error loading matomo", err)
  }
}
