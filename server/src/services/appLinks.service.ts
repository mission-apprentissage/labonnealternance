import { IUserRecruteur } from "shared/models"
import { zRoutes } from "shared/routes"

import config from "@/config"
import { generateAccessToken, generateScope } from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: IUserRecruteur) {
  return generateAccessToken(user, [
    generateScope({
      schema: zRoutes.post["/login/verification"],
      options: {
        params: undefined,
        querystring: undefined,
      },
      resources: {},
    }),
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
      generateScope({
        schema: zRoutes.post["/etablissement/validation"],
        options: {
          params: undefined,
          querystring: undefined,
        },
        resources: {
          user: [user._id.toString()],
        },
      }),
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
      generateScope({
        schema: zRoutes.get["/optout/validate"],
        options: {
          params: undefined,
          querystring: undefined,
        },
        resources: {},
      }),
    ],
    {
      expiresIn: "45d",
    }
  )
  return `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${encodeURIComponent(token)}`
}

export function createCfaUnsubscribeToken(email: string, siret: string) {
  return generateAccessToken(
    { type: "cfa", email, siret },
    [
      generateScope({
        schema: zRoutes.post["/etablissement/:establishment_siret/proposition/unsubscribe"],
        options: {
          params: {
            establishment_siret: siret,
          },
          querystring: undefined,
        },
        resources: {},
      }),
    ],
    {
      expiresIn: "30d",
    }
  )
}

/**
 * Forge a link for Affelnet premium activation.
 */
export function createRdvaPremiumAffelnetPageLink(email: string, siret: string, etablissementId: string): string {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      generateScope({
        schema: zRoutes.get["/etablissements/:id"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/affelnet/accept"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/affelnet/refuse"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/form/premium/affelnet/${etablissementId}?token=${encodeURIComponent(token)}`
}

/**
 * Forge a link for Parcoursup premium activation.
 */
export function createRdvaPremiumParcoursupPageLink(email: string, siret: string, etablissementId: string): string {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      generateScope({
        schema: zRoutes.get["/etablissements/:id"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/accept"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/refuse"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/form/premium/${etablissementId}?token=${encodeURIComponent(token)}`
}

/**
 * Forge a link for allwoing unsubscription.
 */
export function createRdvaOptOutUnsubscribePageLink(email: string, siret: string, etablissementId: string): string {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      generateScope({
        schema: zRoutes.get["/etablissements/:id/opt-out/unsubscribe"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )
  return `${config.publicUrl}/espace-pro/form/opt-out/unsubscribe/${etablissementId}?token=${encodeURIComponent(token)}`
}

/**
 * Forge a link for reading appointment
 */
export function createRdvaAppointmentIdPageLink(email: string, siret: string, etablissementId: string, appointmentId: string): string {
  const token = generateAccessToken(
    { type: "cfa", email, siret },
    [
      generateScope({
        schema: zRoutes.patch["/etablissements/:id/appointments/:appointmentId"],
        options: {
          params: { id: etablissementId, appointmentId },
          querystring: undefined,
        },
        resources: {
          etablissement: [etablissementId],
          appointment: [appointmentId],
        },
      }),
      generateScope({
        schema: zRoutes.get["/appointment-request/context/recap"],
        options: {
          params: undefined,
          querystring: {
            appointmentId,
          },
        },
        resources: {
          appointment: [appointmentId],
        },
      }),
      generateScope({
        schema: zRoutes.post["/appointment-request/reply"],
        options: {
          params: undefined,
          querystring: undefined,
        },
        resources: {
          appointment: [appointmentId],
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/establishment/${etablissementId}/appointments/${appointmentId}?token=${encodeURIComponent(token)}`
}
