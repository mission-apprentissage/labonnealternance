import { ObjectId } from "bson"
import { joinNonNullStrings } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { IRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import { blankComputedJobPartner } from "../offrePartenaire/fillComputedJobsPartners"

export const recruteursLbaToJobPartners = (recruteursLba: IRecruteursLbaRaw): IComputedJobsPartners => {
  const { siret, enseigne, raison_sociale, naf_code, naf_label, street_name, street_number, zip_code, email, phone, company_size, rome_codes, _id } = recruteursLba
  return {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    partner_job_id: _id.toString(),
    workplace_siret: siret,
    workplace_brand: enseigne,
    workplace_legal_name: raison_sociale,
    workplace_naf_code: naf_code,
    workplace_naf_label: naf_label,
    workplace_address_street_label: street_name,
    workplace_address_zipcode: zip_code,
    workplace_address_label: joinNonNullStrings([street_number, street_name, zip_code]),
    workplace_size: company_size,
    apply_email: email,
    apply_phone: phone,
    offer_rome_codes: rome_codes.map(({ rome_code }) => rome_code),
    // laisse recruteurs_lba pour les entreprises issue de l'algorithme de lba (passer la validation & l'import dans jobs_partners)
    offer_title: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    offer_description: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  }
}
