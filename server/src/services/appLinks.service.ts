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

  return `${config.publicUrl}/espace-pro/authentification/verification?token=${encodeURIComponent(token)}`
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
  return `${config.publicUrl}/espace-pro/authentification/validation/${user._id}?token=${encodeURIComponent(token)}`
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
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${encodeURIComponent(token)}`
}
