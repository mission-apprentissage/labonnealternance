import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import i18next from "i18next"
import { z } from "zod"
import { makeZodI18nMap, zodI18nMap } from "zod-i18n-map"

import LOCALE_FR from "./locale/locale.fr.js"

i18next.init({
  lng: "en",
  resources: {
    fr: { zod: LOCALE_FR },
  },
})

z.setErrorMap(zodI18nMap)
extendZodWithOpenApi(z)

const setZodLanguage = (language: "fr" | "en") => {
  i18next.changeLanguage(language)
  z.setErrorMap(makeZodI18nMap({ t: i18next.t }))
}

export { setZodLanguage, z }
