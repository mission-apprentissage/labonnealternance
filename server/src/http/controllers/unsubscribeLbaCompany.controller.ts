import { ObjectId } from "mongodb"
import { IUnsubscribedLbaCompany, zRoutes } from "shared"
import { IUnsubscribeQueryResponse } from "shared/models/unsubscribeLbaCompany.model"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { obfuscateLbaCompanyApplications } from "@/services/application.service"
import { buildLbaCompanyAddress } from "@/services/lbacompany.service"

import config from "../../config"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constant.service"
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

      const criteria: { email: string; siret?: { $in: string[] } } = { email }
      if (sirets) {
        if (sirets.length) {
          criteria.siret = { $in: sirets }
        } else {
          return res.status(400).send({ result: UNSUBSCRIBE_EMAIL_ERRORS.WRONG_PARAMETERS })
        }
      }

      const lbaCompaniesToUnsubscribe = await getDbCollection("recruteurslba").find(criteria).limit(ARBITRARY_COMPANY_LIMIT).toArray()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.NON_RECONNU }
      } else if (lbaCompaniesToUnsubscribe.length > 1 && !sirets) {
        const companies = lbaCompaniesToUnsubscribe.map((company) => {
          return { enseigne: company.enseigne, siret: company.siret, address: buildLbaCompanyAddress(company) }
        })
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES, companies }
      } else {
        const now = new Date()
        await asyncForEach(lbaCompaniesToUnsubscribe, async (company) => {
          const { siret, raison_sociale, enseigne, naf_code, naf_label, rome_codes, insee_city_code, zip_code, city, company_size, created_at, last_update_at } = company
          const unsubscribedLbaCompany: IUnsubscribedLbaCompany = {
            _id: new ObjectId(),
            siret,
            raison_sociale,
            enseigne,
            naf_code,
            naf_label,
            rome_codes,
            insee_city_code,
            zip_code,
            city,
            company_size,
            created_at,
            last_update_at,
            unsubscribe_reason: reason,
            unsubscribe_date: now,
          }

          await getDbCollection("unsubscribedbonnesboites").insertOne(unsubscribedLbaCompany)

          const lbaCompanyToUnsubscribe = await getDbCollection("recruteurslba").findOne({ siret })
          if (lbaCompanyToUnsubscribe) {
            await getDbCollection("recruteurslba").deleteOne({ _id: lbaCompanyToUnsubscribe._id })
          }

          if (reason === "OPPOSITION") {
            await obfuscateLbaCompanyApplications(siret)
          }
        })

        await mailer.sendEmail({
          to: email,
          subject: `Confirmation de déréférencement du service La bonne alternance`,
          template: getStaticFilePath("./templates/mail-desinscription-algo.mjml.ejs"),
          data: {
            images: {
              logoLba: `${imagePath}logo_LBA.png`,
              logoRF: `${imagePath}logo_rf.png`,
            },
          },
        })
      }

      return res.status(200).send(result)
    }
  )
}
