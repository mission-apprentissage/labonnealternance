import { ObjectId } from "mongodb"
import type { IUnsubscribedLbaCompany } from "shared"
import type { IJobsPartnersOfferPrivate} from "shared/models/jobsPartners.model";
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IUnsubscribePossibleCompany } from "shared/routes/unsubscribe.routes"

import { obfuscateLbaCompanyApplications } from "./application.service"
import mailer from "./mailer.service"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"

const imagePath = `${config.publicUrl}/images/emails/`

const ARBITRARY_COMPANY_LIMIT = 50

export async function unsubscribeNoSiret({
  email,
  reason,
}: {
  email: string
  reason: string
}): Promise<{ modifiedCount: number } | { possibleCompanies: IUnsubscribePossibleCompany[] }> {
  const lbaCompaniesToUnsubscribe = await getDbCollection("jobs_partners")
    .find({
      apply_email: email,
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    })
    .limit(ARBITRARY_COMPANY_LIMIT)
    .toArray()

  if (lbaCompaniesToUnsubscribe.length === 0) {
    return { modifiedCount: lbaCompaniesToUnsubscribe.length }
  } else if (lbaCompaniesToUnsubscribe.length === 1) {
    await unsubscribeCompanies(lbaCompaniesToUnsubscribe, reason)
    return { modifiedCount: lbaCompaniesToUnsubscribe.length }
  } else {
    const possibleCompanies = lbaCompaniesToUnsubscribe.map((company) => {
      return { enseigne: company.workplace_legal_name, siret: company.workplace_siret!, address: company.workplace_address_label }
    })
    return { possibleCompanies }
  }
}

export async function unsubscribeWithSirets({ email, reason, sirets }: { email: string; reason: string; sirets: string[] }) {
  const lbaCompaniesToUnsubscribe = await getDbCollection("jobs_partners")
    .find({
      apply_email: email,
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      workplace_siret: { $in: sirets },
    })
    .limit(ARBITRARY_COMPANY_LIMIT)
    .toArray()
  await unsubscribeCompanies(lbaCompaniesToUnsubscribe, reason)
  return { modifiedCount: lbaCompaniesToUnsubscribe.length }
}

async function unsubscribeCompanies(companies: IJobsPartnersOfferPrivate[], reason: string) {
  const now = new Date()

  const unsubscribeObjects = companies.map((company) => {
    const {
      workplace_siret,
      workplace_legal_name,
      workplace_brand,
      workplace_naf_code,
      workplace_naf_label,
      offer_rome_codes,
      workplace_address_zipcode,
      workplace_address_city,
      workplace_size,
      created_at,
      updated_at,
    } = company
    const unsubscribedLbaCompany: IUnsubscribedLbaCompany = {
      _id: new ObjectId(),
      siret: workplace_siret!,
      raison_sociale: workplace_legal_name,
      enseigne: workplace_brand || "",
      naf_code: workplace_naf_code || "",
      naf_label: workplace_naf_label || "",
      rome_codes: offer_rome_codes,
      insee_city_code: workplace_address_zipcode,
      zip_code: workplace_address_zipcode,
      city: workplace_address_city,
      company_size: workplace_size,
      created_at,
      last_update_at: updated_at,
      unsubscribe_reason: reason,
      unsubscribe_date: now,
    }
    return unsubscribedLbaCompany
  })
  const idsToDelete = companies.map((company) => company._id)

  await getDbCollection("unsubscribedrecruteurslba").insertMany(unsubscribeObjects)
  await getDbCollection("jobs_partners").deleteMany({ _id: { $in: idsToDelete } })

  if (reason === "OPPOSITION") {
    const siretsToObfuscate = companies.map((company) => company.workplace_siret!)
    await obfuscateLbaCompanyApplications(siretsToObfuscate)
  }

  await asyncForEach(companies, async (company) => {
    if (company.apply_email) {
      await mailer.sendEmail({
        to: company.apply_email,
        subject: `Confirmation de déréférencement du service La bonne alternance`,
        template: getStaticFilePath("./templates/mail-desinscription-algo.mjml.ejs"),
        data: {
          images: {
            logoLba: `${imagePath}logo_LBA.png`,
            logoRf: `${imagePath}logo_rf.png`,
          },
        },
      })
    }
  })
}
