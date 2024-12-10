import i18next from "i18next"
import { z } from "zod"
import { makeZodI18nMap, zodI18nMap } from "zod-i18n-map"
import zodEn from "zod-i18n-map/locales/en/zod.json"
import zodFr from "zod-i18n-map/locales/fr/zod.json"

// lng and resources key depend on your locale.
i18next.init({
  lng: "en",
  resources: {
    fr: { zod: zodFr },
    en: { zod: zodEn },
  },
})
z.setErrorMap(zodI18nMap)

export const setZodLanguage = (language: "fr" | "en") => {
  i18next.changeLanguage(language)
  z.setErrorMap(makeZodI18nMap({ t: i18next.t }))
}
