import { IUserRecruteur } from "shared/models"
import { zRoutes } from "shared/routes"

import config from "@/config"
import { generateAccessToken } from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: IUserRecruteur) {
  return generateAccessToken(user, [
    {
      schema: zRoutes.post["/login/verification"],
      params: undefined,
      querystring: undefined,
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
        schema: zRoutes.post["/etablissement/validation"],
        params: undefined,
        querystring: undefined,
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
        schema: zRoutes.get["/optout/validate"],
        params: undefined,
        querystring: undefined,
        resources: {},
      },
    ],
    {
      expiresIn: "45d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${token}`
}

export function createOptoutValidateMagicLink2(email: string, siret: string) {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      {
        schema: zRoutes.post["/etablissement/:establishment_siret/proposition/unsubscribe"],
        params: {
          establishment_siret: siret,
        },
        querystring: undefined,
        resources: {},
      },
    ],
    {
      expiresIn: "45d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${token}`
}
