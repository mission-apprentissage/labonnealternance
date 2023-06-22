export default {
  shouldDisplayCallForHelp: false,
}

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
export const env = process.env.NEXT_PUBLIC_ENV

export const inserJeuneApiUrl = `https://exposition${env === "production" ? "" : "-recette"}.inserjeunes.beta.gouv.fr`
