import { getConnectedInfos } from "@tests/fixture/connectedUser.fixture"
import { mockApiBal } from "@tests/mocks/mockApiBal"
import { mockApiEntreprise } from "@tests/mocks/mockApiEntreprise"
import { mockGeolocalisation } from "@tests/mocks/mockGeolocalisation"
import type { TestHttpClient } from "@tests/utils/server.test.utils"
import type { IJobCreate, IUserWithAccount } from "shared"
import { ENTREPRISE } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { z } from "shared/helpers/zodWithOpenApi"
import type { zRoutes } from "shared/routes/index"
import { expect } from "vitest"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createCancelJobLink, createProvidedJobLink, createValidationMagicLink, generateDepotSimplifieToken } from "@/services/appLinks.service"

export type CreationBody = z.output<(typeof zRoutes.post)["/etablissement/creation"]["body"]>
export type CreationResponse = z.output<(typeof zRoutes.post)["/etablissement/creation"]["response"]["200"]>

export type OfferCreationResponse = z.output<(typeof zRoutes.post)["/formulaire/:establishment_id/offre"]["response"]["200"]>
export type OfferCreationByTokenResponse = z.output<(typeof zRoutes.post)["/formulaire/:establishment_id/offre/by-token"]["response"]["200"]>
export type GetOfferResponse = z.output<(typeof zRoutes.get)["/formulaire/offre/f/:jobId"]["response"]["200"]>

export type OfferUpdateBody = z.output<(typeof zRoutes.put)["/formulaire/offre/:jobId"]["body"]>

export const entrepriseSdk = (httpClient: TestHttpClient) => ({
  async create(body: CreationBody) {
    const mockEntreprise = mockApiEntreprise.infosEntreprise()
    const mockBal = mockApiBal.validationEmail(true)
    const mockGeo = mockGeolocalisation()

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body,
    })

    mockEntreprise.persist(false)
    mockBal.persist(false)
    mockGeo.persist(false)
    return response
  },
  async validateEmail(userWithAccount: IUserWithAccount) {
    const url = createValidationMagicLink(userWithAccountToUserForToken(userWithAccount))
    const token = new URL(url).searchParams.get("token")
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/validation",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response
  },
  async createAndGetConnectedUser({ validated = true }: { validated?: boolean } = {}) {
    const opco = OPCOS_LABEL.CONSTRUCTYS
    const creationResponse = await this.create({
      email: "email@email.com",
      first_name: "John",
      last_name: "Doe",
      phone: "0612345678",
      establishment_siret: "42476141900045",
      origin: "lba",
      opco,
      idcc: "3248",
      type: ENTREPRISE,
    })
    const { formulaire, user } = creationResponse.json() as CreationResponse
    if (validated) {
      const validationResponse = await this.validateEmail(user)
      expect.soft(validationResponse.statusCode).toBe(200)
    }

    const { cookies } = await getConnectedInfos(user.email)
    return { cookies, formulaire, user, opco }
  },
  async createOffer({ establishment_id, cookies, job }: { establishment_id: string; cookies: Record<string, string>; job: IJobCreate }) {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/formulaire/${establishment_id}/offre`,
      cookies,
      body: job,
    })
    return response
  },
  async createOfferByToken({ establishment_id, job, user }: { establishment_id: string; user: IUserWithAccount; job: IJobCreate }) {
    const token = generateDepotSimplifieToken(userWithAccountToUserForToken(user), establishment_id)

    const response = await httpClient().inject({
      method: "POST",
      path: `/api/formulaire/${establishment_id}/offre/by-token`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: job,
    })
    return response
  },
  async updateOffer({ jobId, body, cookies }: { jobId: string; body: OfferUpdateBody; cookies: Record<string, string> }) {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}`,
      cookies,
      body,
    })
    return response
  },
  async cancelOffer({ jobId, user }: { jobId: string; user: IUserWithAccount }) {
    const url = createCancelJobLink(userWithAccountToUserForToken(user), jobId, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)
    const token = new URL(url).searchParams.get("token")

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}/cancel`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response
  },
  async providedOffer({ jobId, user }: { jobId: string; user: IUserWithAccount }) {
    const url = createProvidedJobLink(userWithAccountToUserForToken(user), jobId, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)
    const token = new URL(url).searchParams.get("token")

    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}/provided`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response
  },
  async extendOffer({ jobId, cookies }: { jobId: string; cookies: Record<string, string> }) {
    const response = await httpClient().inject({
      method: "PUT",
      path: `/api/formulaire/offre/${jobId}/extend`,
      cookies,
    })
    return response
  },
  async getOffer({ jobId, cookies }: { jobId: string; cookies: Record<string, string> }) {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/formulaire/offre/f/${jobId}`,
      cookies,
    })
    return response
  },
})
