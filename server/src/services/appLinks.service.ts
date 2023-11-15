import { IUserRecruteur } from "shared/models"
import { zRoutes } from "shared/routes"

import config from "@/config"
import { IScope, generateAccessToken } from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: IUserRecruteur) {
  const endpoint: IScope<(typeof zRoutes.post)["/login/verification"]> = {
    schema: zRoutes.post["/login/verification"],
    options: {
      params: undefined,
      querystring: undefined,
    },
    resources: {},
  }
  return generateAccessToken(user, [endpoint])
}

export function createAuthMagicLink(user: IUserRecruteur) {
  const token = createAuthMagicLinkToken(user)

  return `${config.publicUrl}/espace-pro/authentification/verification?token=${encodeURIComponent(token)}`
}

export function createValidationMagicLink(user: IUserRecruteur) {
  const endpoint: IScope<(typeof zRoutes.post)["/etablissement/validation"]> = {
    schema: zRoutes.post["/etablissement/validation"],
    options: {
      params: undefined,
      querystring: undefined,
    },
    resources: {
      user: [user._id.toString()],
    },
  }
  const token = generateAccessToken(user, [endpoint], {
    expiresIn: "30d",
  })
  return `${config.publicUrl}/espace-pro/authentification/validation/${user._id}?token=${encodeURIComponent(token)}`
}

export function createOptoutValidateMagicLink(email: string, siret: string) {
  const endpoint: IScope<(typeof zRoutes.get)["/optout/validate"]> = {
    schema: zRoutes.get["/optout/validate"],
    options: {
      params: undefined,
      querystring: undefined,
    },
    resources: {},
  }
  const token = generateAccessToken({ type: "cfa", email, siret }, [endpoint], {
    expiresIn: "45d",
  })
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${encodeURIComponent(token)}`
}

export function createCfaUnsubscribeToken(email: string, siret: string) {
  const endpoint: IScope<(typeof zRoutes.post)["/etablissement/:establishment_siret/proposition/unsubscribe"]> = {
    schema: zRoutes.post["/etablissement/:establishment_siret/proposition/unsubscribe"],
    options: {
      params: {
        establishment_siret: siret,
      },
      querystring: undefined,
    },
    resources: {},
  }
  return generateAccessToken({ type: "cfa", email, siret }, [endpoint], {
    expiresIn: "30d",
  })
}
