import { IUserRecruteur } from "shared/models"
import { zRoutes } from "shared/routes"

import config from "@/config"
import { generateAccessToken } from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: IUserRecruteur) {
  return generateAccessToken(user, [
    {
      route: zRoutes.post["/login/verification"],
      resources: {},
    },
  ])
}

export function createAuthMagicLink(user: IUserRecruteur) {
  const token = createAuthMagicLinkToken(user)

  return `${config.publicUrl}/espace-pro/authentification/verification?token=${token}`
}

export function createValidationMagicLink(user: IUserRecruteur) {
  const token = generateAccessToken(
    user,
    [
      {
        route: zRoutes.post["/etablissement/validation"],
        resources: {
          user: [user._id.toString()],
        },
      },
    ],
    {
      expiresIn: "30d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/validation/${user._id}?token=${token}`
}

export function createOptoutValidateMagicLink(email: string, siret: string) {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      {
        route: zRoutes.get["/optout/validate"],
        resources: {},
      },
    ],
    {
      expiresIn: "45d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${token}`
}

export function createUpdateJobLink(user: IUserRecruteur, jobId: string, suffix: "provided" | "cancel") {
  const token = generateAccessToken(user, [
    {
      route: zRoutes.put["/formulaire/offre/:jobId/cancel"],
      resources: {
        job: [jobId],
      },
    },
    {
      route: zRoutes.put["/formulaire/offre/:jobId/provided"],
      resources: {
        job: [jobId],
      },
    },
  ])

  return `${config.publicUrl}/espace-pro/offre/${suffix}?token=${token}`
}
