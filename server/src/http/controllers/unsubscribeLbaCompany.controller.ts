import { zRoutes } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

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
      let result: "OK" | UNSUBSCRIBE_EMAIL_ERRORS = "OK"

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason

      const lbaCompaniesToUnsubscribe = await LbaCompany.find({ email }).lean()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = UNSUBSCRIBE_EMAIL_ERRORS.NON_RECONNU
      } else if (lbaCompaniesToUnsubscribe.length > 1) {
        result = UNSUBSCRIBE_EMAIL_ERRORS.ETABLISSEMENTS_MULTIPLES
      } else {
        const { siret, raison_sociale, enseigne, naf_code, naf_label, rome_codes, insee_city_code, zip_code, city, company_size, created_at, last_update_at } =
          lbaCompaniesToUnsubscribe[0]

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

        const lbaCompanyToUnsubscribe = await LbaCompany.findOne({ siret: lbaCompaniesToUnsubscribe[0].siret })
        if (lbaCompanyToUnsubscribe) {
          await lbaCompanyToUnsubscribe.remove()
        }

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
          disableSanitize: {
            images: {
              logoLba: true,
              logoRF: true,
            },
          },
        })
      }

      return res.status(200).send(result)
    }
  )
}
