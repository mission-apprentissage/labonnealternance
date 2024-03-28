import { zRoutes } from "shared"
import { IUnsubscribeCompanyData } from "shared/models/unsubscribeLbaCompany.model"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { obfuscateLbaCompanyApplications } from "@/services/application.service"
import { buildLbaCompanyAddress } from "@/services/lbacompany.service"

import { LbaCompany, UnsubscribedLbaCompany } from "../../common/model"
import config from "../../config"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constant.service"
import mailer from "../../services/mailer.service"
import { Server } from "../server"

const imagePath = `${config.publicUrl}/images/emails/`

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
      let result: { result: "OK" | UNSUBSCRIBE_EMAIL_ERRORS; companies?: IUnsubscribeCompanyData[] } = { result: "OK" }

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason
      const sirets = req.body.sirets

      const criteria: { email: string; siret?: { $in: string[] } } = { email }
      if (sirets && sirets.length) {
        criteria.siret = { $in: sirets }
      }

      const lbaCompaniesToUnsubscribe = await LbaCompany.find(criteria).limit(10).lean()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.NON_RECONNU }
      } else if (lbaCompaniesToUnsubscribe.length > 1 && !sirets) {
        const companies = lbaCompaniesToUnsubscribe.map((company) => {
          return { enseigne: company.enseigne, siret: company.siret, address: buildLbaCompanyAddress(company) }
        })
        result = { result: UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES, companies }
      } else {
        await asyncForEach(lbaCompaniesToUnsubscribe, async (company) => {
          const { siret, raison_sociale, enseigne, naf_code, naf_label, rome_codes, insee_city_code, zip_code, city, company_size, created_at, last_update_at } = company

          const unsubscribedLbaCompany = new UnsubscribedLbaCompany({
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
          })

          await unsubscribedLbaCompany.save()

          const lbaCompanyToUnsubscribe = await LbaCompany.findOne({ siret })
          if (lbaCompanyToUnsubscribe) {
            await lbaCompanyToUnsubscribe.remove()
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
