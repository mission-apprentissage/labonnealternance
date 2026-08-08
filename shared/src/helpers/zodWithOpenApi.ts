import { z } from "zod"

z.config(z.locales.en())

const setZodLanguage = (language: "fr" | "en") => {
  z.config(language === "fr" ? z.locales.fr() : z.locales.en())
}

export { setZodLanguage, z }
