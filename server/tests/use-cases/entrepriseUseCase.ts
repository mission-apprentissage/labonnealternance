import type { z } from "shared/helpers/zodWithOpenApi"
import type { zRoutes } from "shared/routes/index"

import type { IJobCreate, IUserWithAccount } from "shared"
import { ENTREPRISE } from "shared/constants/index"
import { expect } from "vitest"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createValidationMagicLink } from "@/services/appLinks.service"
import { mockApiBal } from "@tests/mocks/mockApiBal"
import { mockApiEntreprise } from "@tests/mocks/mockApiEntreprise"
import type { TestHttpClient } from "@tests/utils/server.test.utils"
import { getConnectedInfos } from "@tests/fixture/connectedUser.fixture"

export type CreationBody = z.output<(typeof zRoutes.post)["/etablissement/creation"]["body"]>
export type CreationResponse = z.output<(typeof zRoutes.post)["/etablissement/creation"]["response"]["200"]>

export type OfferCreationResponse = z.output<(typeof zRoutes.post)["/formulaire/:establishment_id/offre"]["response"]["200"]>

export const entrepriseUseCase = {
  async create(httpClient: TestHttpClient, body: CreationBody) {
    const mockEntreprise = mockApiEntreprise.infosEntreprise()
    const mockBal = mockApiBal.validationEmail(true)

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body,
    })

    mockEntreprise.persist(false)
    mockBal.persist(false)
    return response
  },
  async validateEmail(httpClient: TestHttpClient, userWithAccount: IUserWithAccount) {
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
  async getConnectedUser(httpClient: TestHttpClient) {
    const creationResponse = await entrepriseUseCase.create(httpClient, {
      email: "email@email.com",
      first_name: "John",
      last_name: "Doe",
      phone: "0612345678",
      establishment_siret: "42476141900045",
      origin: "lba",
      opco: OPCOS_LABEL.CONSTRUCTYS,
      idcc: "3248",
      type: ENTREPRISE,
    })
    const { formulaire, user } = creationResponse.json() as CreationResponse
    const validationResponse = await entrepriseUseCase.validateEmail(httpClient, user)
    expect.soft(validationResponse.statusCode).toBe(200)

    const { cookies } = await getConnectedInfos(user.email)
    return { cookies, formulaire, user }
  },
  async createOffer(httpClient: TestHttpClient, { establishment_id, cookies, job }: { establishment_id: string; cookies: Record<string, string>; job: IJobCreate }) {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/formulaire/${establishment_id}/offre`,
      cookies,
      body: job,
    })
    return response
  },
}
