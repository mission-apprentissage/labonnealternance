import { ObjectId } from "mongodb"
import { IUnsubscribedLbaCompany, zRoutes } from "shared"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "shared/constants"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IUnsubscribeQueryResponse } from "shared/models/unsubscribedRecruteurLba.model"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { obfuscateLbaCompanyApplications } from "@/services/application.service"

import config from "../../config"
import mailer from "../../services/mailer.service"
import { Server } from "../server"

const imagePath = `${config.publicUrl}/images/emails/`

const ARBITRARY_COMPANY_LIMIT = 50

export default function (server: Server) {
  server.post(
    "/unsubscribe",
    {
      schema: zRoutes.post["/unsubscribe"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      let result: IUnsubscribeQueryResponse = { result: "OK" }

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason
      const sirets = req.body.sirets

      const query: { apply_email: string; workplace_siret?: { $in: string[] }; partner_label: string } = { apply_email: email, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }
      if (sirets && sirets.length) {
        query.workplace_siret = { $in: sirets }
      } else {
        return res.status(400).send({ result: UNSUBSCRIBE_EMAIL_ERRORS.WRONG_PARAMETERS })
      }

      const lbaCompaniesToUnsubscribe = await getDbCollection("jobs_partners").find(query).limit(ARBITRARY_COMPANY_LIMIT).toArray()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.NON_RECONNU }
      } else if (lbaCompaniesToUnsubscribe.length > 1 && !sirets) {
        const companies = lbaCompaniesToUnsubscribe.map((company) => {
          return { enseigne: company.workplace_legal_name!, siret: company.workplace_siret!, address: company.workplace_address_label }
        })
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES, companies }
      } else {
        const now = new Date()
        await asyncForEach(lbaCompaniesToUnsubscribe, async (company) => {
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
            enseigne: workplace_brand!,
            naf_code: workplace_naf_code!,
            naf_label: workplace_naf_label!,
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

          await getDbCollection("unsubscribedrecruteurslba").insertOne(unsubscribedLbaCompany)

          const lbaCompanyToUnsubscribe = await getDbCollection("jobs_partners").findOne({ workplace_siret, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
          if (lbaCompanyToUnsubscribe) {
            await getDbCollection("jobs_partners").deleteOne({ _id: lbaCompanyToUnsubscribe._id })
          }

          if (reason === "OPPOSITION") {
            await obfuscateLbaCompanyApplications(workplace_siret!)
          }
        })

        await mailer.sendEmail({
          to: email,
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

      return res.status(200).send(result)
    }
  )
}
