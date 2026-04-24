import type { TestHttpClient } from "@tests/utils/server.test.utils"
import { ObjectId } from "bson"
import type { IJobOfferApiWriteV3Input } from "shared/routes/v3/jobs/jobs.routes.v3.model"
import { processJobPartnersWithFilter } from "@/jobs/offrePartenaire/processJobPartnersForApi"

export const jobsV3Sdk = (httpClient: TestHttpClient) => ({
  async createOffer({ token, data }: { token: string; data: IJobOfferApiWriteV3Input }) {
    const response = await httpClient().inject({
      method: "POST",
      path: `/api/v3/jobs`,
      body: data,
      headers: { authorization: `Bearer ${token}` },
    })
    return response
  },
  async getOffer(id: string, token: string) {
    const response = await httpClient().inject({
      method: "GET",
      path: `/api/v3/jobs/${id}`,
      headers: { authorization: `Bearer ${token}` },
    })
    return response
  },
})

export async function processComputedToJobsPartners(jobIds: string[]) {
  await processJobPartnersWithFilter({ _id: { $in: jobIds.map((id) => new ObjectId(id)) } })
}
