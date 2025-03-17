import { ApplicationIntention } from "shared/constants/application"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { IJob } from "shared/models/index"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { zRoutes } from "shared/routes/index"

import config from "@/config"
import {
  IApplicationTForUserToken,
  IUserWithAccountForAccessToken,
  UserForAccessToken,
  applicationToUserForToken,
  generateAccessToken,
  generateScope,
  userWithAccountToUserForToken,
} from "@/security/accessTokenService"

export function createAuthMagicLinkToken(user: UserForAccessToken) {
  return generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.post["/login/verification"],
        options: {
          params: undefined,
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "15m",
    }
  )
}

export function createAuthMagicLink(user: UserForAccessToken) {
  const token = createAuthMagicLinkToken(user)
  return `${config.publicUrl}/espace-pro/authentification?token=${encodeURIComponent(token)}`
}

export function createValidationMagicLink(user: IUserWithAccountForAccessToken) {
  const token = generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.post["/etablissement/validation"],
        options: {
          params: undefined,
          querystring: undefined,
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
      }),
    ],
    {
      expiresIn: "30d",
    }
  )
}

export function createCancelJobLink(user: UserForAccessToken, jobId: string, jobOrigin: LBA_ITEM_TYPE, utmData: string | undefined = undefined) {
  const token = generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.put["/formulaire/offre/:jobId/cancel"],
        options: {
          params: {
            jobId: jobId,
          },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/v2/_private/jobs/canceled/:id"],
        options: {
          params: {
            id: jobId,
          },
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/offre/${jobOrigin}/${jobId}/cancel?${utmData ? utmData : ""}&token=${token}`
}

export function createProvidedJobLink(user: UserForAccessToken, jobId: string, jobOrigin: LBA_ITEM_TYPE, utmData: string | undefined = undefined) {
  const token = generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.put["/formulaire/offre/:jobId/provided"],
        options: {
          params: { jobId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/v2/_private/jobs/provided/:id"],
        options: {
          params: { id: jobId },
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/offre/${jobOrigin}/${jobId}/provided?${utmData ? utmData : ""}&token=${token}`
}

export function createViewDelegationLink(email: string, establishment_id: string, job_id: string, siret_formateur: string) {
  const token = generateAccessToken(
    { type: "cfa", email, siret: siret_formateur },
    [
      generateScope({
        schema: zRoutes.get["/formulaire/delegation/:establishment_id"],
        options: {
          params: {
            establishment_id: establishment_id,
          },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.patch["/formulaire/offre/:jobId/delegation/view"],
        options: {
          params: {
            jobId: job_id,
          },
          querystring: {
            siret_formateur,
          },
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )

  return `${config.publicUrl}/espace-pro/proposition/formulaire/${establishment_id}/offre/${job_id}/siret/${siret_formateur}?token=${token}`
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
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/affelnet/accept"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/affelnet/refuse"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
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
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/accept"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/premium/refuse"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
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
        schema: zRoutes.get["/etablissements/:id"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/etablissements/:id/opt-out/unsubscribe"],
        options: {
          params: { id: etablissementId },
          querystring: undefined,
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
        schema: zRoutes.get["/appointment-request/context/recap"],
        options: {
          params: undefined,
          querystring: {
            appointmentId,
          },
        },
      }),
      generateScope({
        schema: zRoutes.post["/appointment-request/reply"],
        options: {
          params: undefined,
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "60d",
    }
  )

  return `${config.publicUrl}/espace-pro/establishment/${etablissementId}/appointments/${appointmentId}?token=${encodeURIComponent(token)}`
}

export function createRdvaShortRecapToken(email: string, appointmentId: string) {
  const token = generateAccessToken({ email, type: "candidat" }, [
    generateScope({
      schema: zRoutes.get["/appointment-request/context/short-recap"],
      options: {
        params: undefined,
        querystring: {
          appointmentId,
        },
      },
    }),
  ])

  return token
}

export function generateApplicationReplyToken(tokenUser: UserForAccessToken, applicationId: string, intention: ApplicationIntention) {
  return generateAccessToken(
    tokenUser,
    [
      generateScope({
        schema: zRoutes.post["/application/intentionComment/:id"],
        options: {
          params: { id: applicationId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/application/intention/cancel/:id"],
        options: {
          params: { id: applicationId },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.get["/application/intention/schedule/:id"],
        options: {
          params: { id: applicationId },
          querystring: { intention },
        },
      }),
    ],
    {
      expiresIn: "30d",
    }
  )
}

export function generateDepotSimplifieToken(user: IUserWithAccountForAccessToken, establishment_id: string) {
  return generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.get["/formulaire/:establishment_id/by-token"],
        options: {
          params: { establishment_id },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/formulaire/:establishment_id/offre/by-token"],
        options: {
          params: { establishment_id },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.get["/user/status/:userId/by-token"],
        options: {
          params: { userId: user._id.toString() },
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "2h",
    }
  )
}

export function generateCfaCreationToken(user: IUserWithAccountForAccessToken) {
  return generateAccessToken(
    user,
    [
      generateScope({
        schema: zRoutes.get["/user/status/:userId/by-token"],
        options: {
          params: { userId: user._id.toString() },
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "2h",
    }
  )
}

export function generateOffreToken(user: IUserWithAccount, offre: IJob) {
  return generateAccessToken(
    userWithAccountToUserForToken(user),
    [
      generateScope({
        schema: zRoutes.post["/formulaire/offre/:jobId/delegation/by-token"],
        options: {
          params: { jobId: offre._id.toString() },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.get["/user/status/:userId/by-token"],
        options: {
          params: { userId: user._id.toString() },
          querystring: undefined,
        },
      }),
      generateScope({
        schema: zRoutes.post["/login/:userId/resend-confirmation-email"],
        options: {
          params: { userId: user._id.toString() },
          querystring: undefined,
        },
      }),
    ],
    {
      expiresIn: "2h",
    }
  )
}

export function generateApplicationToken({ company_siret, jobId }: IApplicationTForUserToken) {
  return generateAccessToken(applicationToUserForToken({ company_siret, jobId }), [
    generateScope({
      schema: zRoutes.post["/v2/_private/application"],
      options: {
        params: undefined,
        querystring: undefined,
      },
    }),
  ])
}
