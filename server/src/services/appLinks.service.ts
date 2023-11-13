import { IUserRecruteur } from "shared/models"
import { zRoutes } from "shared/routes"

import config from "@/config"
import { generateAccessToken } from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: IUserRecruteur) {
  return generateAccessToken(user, [
    {
      schema: zRoutes.post["/login/verification"],
      options: {
        params: undefined,
        querystring: undefined,
      },
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
        options: {
          params: undefined,
          querystring: undefined,
        },
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
        options: {
          params: undefined,
          querystring: undefined,
        },
        resources: {},
      },
    ],
    {
      expiresIn: "45d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${token}`
}

export function createCancelJobLink({ user, jobId }: { user: IUserRecruteur; jobId: string }) {
  const token = generateAccessToken(user, [
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/cancel"],
      options: {
        params: {
          jobId: jobId,
        },
        querystring: undefined,
      },
      resources: {
        job: [jobId],
      },
    },
  ])

  return `${config.publicUrl}/espace-pro/offre/${jobId}/cancel?token=${token}`
}

export function createProvidedJobLink({ user, jobId }: { user: IUserRecruteur; jobId: string }) {
  const token = generateAccessToken(user, [
    {
      schema: zRoutes.put["/formulaire/offre/:jobId/provided"],
      options: {
        params: {
          jobId: jobId,
        },
        querystring: undefined,
      },
      resources: {
        job: [jobId],
      },
    },
  ])

  return `${config.publicUrl}/espace-pro/offre/${jobId}/provided?token=${token}`
}
