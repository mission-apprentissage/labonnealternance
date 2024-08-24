import { ObjectId } from "bson"

import { JOB_STATUS } from "../models"
import { IJobsPartners, JOBPARTNERS_LABEL } from "../models/jobsPartners.model"

export function generateJobsPartnersOfferPrivate(data: Partial<IJobsPartners>): IJobsPartners {
  return {
    _id: new ObjectId(),
    workplace_siret: null,
    workplace_website: null,
    workplace_name: null,
    workplace_raison_sociale: null,
    workplace_enseigne: null,
    workplace_description: null,
    workplace_size: null,
    workplace_address: "126 RUE DE L'UNIVERSITE 75007 PARIS",
    workplace_geopoint: {
      coordinates: [0, 0],
      type: "Point",
    },
    workplace_idcc: null,
    workplace_opco: null,
    workplace_naf_code: null,
    workplace_naf_label: null,

    apply_url: null,
    apply_phone: null,
    partner_label: JOBPARTNERS_LABEL.HELLOWORK,
    partner_id: null,

    contract_start: null,
    contract_duration: null,
    contract_type: null,
    contract_remote: null,

    offer_title: "Une super offre d'alternance",
    offer_rome_code: [],
    offer_description: "Attention il te faut une super motivation pour ce job",
    offer_diploma_level_label: null,
    offer_desired_skills: null,
    offer_acquired_skills: null,
    offer_access_condition: null,
    offer_creation_date: null,
    offer_expiration_date: null,
    offer_count: 1,
    offer_status: JOB_STATUS.ACTIVE,

    apply_email: null,
    offer_multicast: true,
    offer_origin: null,

    created_at: new Date("2021-01-28T15:00:00.000Z"),

    ...data,
  }
}
