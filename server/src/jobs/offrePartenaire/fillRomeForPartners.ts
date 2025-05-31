import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { MAX_ROMEO_PAYLOAD_SIZE } from "@/common/apis/franceTravail/franceTravail.client"
import { getRomesInfosFromDiagoriente } from "@/services/cacheDiagoriente.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const fillRomeForPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const filledFields = ["offer_rome_codes"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_DIAGORIENTE,
    sourceFields: ["offer_title", "workplace_naf_label", "offer_description"],
    filledFields,
    groupSize: MAX_ROMEO_PAYLOAD_SIZE,
    addedMatchFilter,
    getData: async (documents) => {
      const validDocuments = documents.flatMap((document) => (document.offer_title ? [document] : []))
      const queries = validDocuments.map(({ offer_title, workplace_naf_label, offer_description, _id }) => ({
        title: offer_title!,
        sector: workplace_naf_label ?? "",
        description: offer_description ?? "",
        id: _id.toString(),
      }))
      const allRomeInfos = await getRomesInfosFromDiagoriente(queries)

      return validDocuments.flatMap((document, index) => {
        const romeInfos = allRomeInfos[index]
        if (!romeInfos) {
          return []
        }

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id: document._id,
          offer_rome_codes: [romeInfos],
        }
        return [result]
      })
    },
  })
}
