import { /*AccessEntityType, */ AccessStatus } from "shared/models"
import { UserEventType } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { ensureInitialization } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

// type IBrevoContact = {
//   user_origin: string
//   user_first_name: string
//   user_last_name: string
//   user_email: string
//   role_createdAt: Date
//   role_authorized_type: AccessEntityType.CFA | AccessEntityType.ENTREPRISE
//   entreprise_enseigne?: string | null | undefined
//   entreprise_raison_sociale?: string | null | undefined
//   cfa_enseigne?: string | null | undefined
//   cfa_raison_sociale?: string | null | undefined
//   job_count?: string | null | undefined
// }

export const sendContactsToBrevo = async () => {
  logger.info("Sending contacts to Brevo ...")

  try {
    const contacts = await ensureInitialization()
      .db()
      .collection("rolemanagement360")
      .find(
        { role_last_status: AccessStatus.GRANTED, user_last_status: UserEventType.ACTIF },
        {
          projection: {
            _id: 0,
            user_origin: 1,
            user_first_name: 1,
            user_last_name: 1,
            user_email: 1,
            role_createdAt: 1,
            role_authorized_type: 1,
            entreprise_enseigne: 1,
            entreprise_raison_sociale: 1,
            cfa_enseigne: 1,
            cfa_raison_sociale: 1,
          },
        }
      )
      .toArray()

    console.log("contacts : ", contacts.length, contacts.length ? contacts[0] : null)

    await notifyToSlack({
      subject: `Envoi des contacts vers Brevo`,
      message: `${contacts.length} envoyés vers Brevo.`,
      error: contacts.length <= 0,
    })
  } catch (err) {
    await notifyToSlack({ subject: "Envoi des contacts vers Brevo", message: `ECHEC envoi des contacts vers Brevo`, error: true })
    throw err
  }
  logger.info("roleManagement360 collection created")
}
