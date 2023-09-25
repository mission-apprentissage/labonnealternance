import { zRoutes } from "shared/index.js"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { LbaCompany, UnsubscribedLbaCompany } from "../../common/model/index.js"
import config from "../../config"
import { UNSUBSCRIBE_EMAIL_ERRORS } from "../../services/constant.service"
import mailer from "../../services/mailer.service"
import { Server } from "../server.js"

const imagePath = `${config.publicUrl}/images/emails/`

export default function (server: Server) {
  server.post(
    "/api/unsubscribe",
    {
      schema: zRoutes.post["/api/unsubscribe"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      let result = "OK"

      const email = req.body.email.toLowerCase()
      const reason = req.body.reason

      const lbaCompaniesToUnsubscribe = await LbaCompany.find({ email }).lean()

      if (!lbaCompaniesToUnsubscribe.length) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["NON_RECONNU"]
      } else if (lbaCompaniesToUnsubscribe.length > 1) {
        result = UNSUBSCRIBE_EMAIL_ERRORS["ETABLISSEMENTS_MULTIPLES"]
      } else {
        const unsubscribedLbaCompany = new UnsubscribedLbaCompany({
          ...lbaCompaniesToUnsubscribe[0],
          unsubscribe_reason: reason,
        })

        unsubscribedLbaCompany.save()

        const lbaCompanyToUnsubscribe = await LbaCompany.findOne({ siret: lbaCompaniesToUnsubscribe[0].siret })
        lbaCompanyToUnsubscribe?.remove()

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
