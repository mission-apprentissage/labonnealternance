import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { MAX_DIAGORIENTE_PAYLOAD_SIZE } from "@/common/apis/diagoriente/diagoriente.client"
import { getRomesInfosFromDiagoriente } from "@/services/cache-diagoriente.service"
import type { FillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { defaultFillComputedJobsPartnersContext } from "./fill-computed-jobs-partners"
import { fillFieldsForComputedPartnersFactory } from "./fill-fields-for-partners-factory"

export const fillRomeForPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext = defaultFillComputedJobsPartnersContext) => {
  const filledFields = ["offer_rome_codes"] as const satisfies (keyof IComputedJobsPartners)[]

  const finalFilter: Filter<IComputedJobsPartners> = {
    $and: [
      {
        business_error: null,
        $or: [{ offer_rome_codes: { $exists: false } }, { offer_rome_codes: null }, { offer_rome_codes: { $size: 0 } }],
      },
      ...(addedMatchFilter ? [addedMatchFilter] : []),
    ],
  }

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.API_DIAGORIENTE,
    sourceFields: ["offer_title", "workplace_naf_label", "offer_description"],
    filledFields,
    groupSize: MAX_DIAGORIENTE_PAYLOAD_SIZE,
    replaceMatchFilter: finalFilter,
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
