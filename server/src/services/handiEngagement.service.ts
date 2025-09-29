import { ObjectId } from "mongodb"
import { AccessEntityType, IEntreprise, IRoleManagement, IUserWithAccount } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import mailer from "@/services/mailer.service"
import { getEntrepriseHandiEngagement } from "@/services/referentielEngagementEntreprise.service"

export async function sendEngagementHandicapEmailIfNeeded(user: IUserWithAccount, role: IRoleManagement): Promise<void> {
  if (role.authorized_type !== AccessEntityType.ENTREPRISE) return
  const entreprise = await getDbCollection("entreprises").findOne({ _id: new ObjectId(role.authorized_id) })
  if (!entreprise) return
  const { siret } = entreprise
  const hasHandiEngagement = await getEntrepriseHandiEngagement(siret)
  const roleId = role._id
  if (hasHandiEngagement) {
    await getDbCollection("rolemanagements").updateOne(
      { _id: roleId },
      {
        $set: {
          engagementHandicapEmail: {
            date: new Date(),
            messageId: "déjà handi-engagement",
          },
        },
      }
    )
    return
  }
  const messageId = await sendEngagementHandicapEmail(user, entreprise)
  await getDbCollection("rolemanagements").updateOne(
    { _id: roleId },
    {
      $set: {
        engagementHandicapEmail: {
          date: new Date(),
          messageId,
        },
      },
    }
  )
}

async function sendEngagementHandicapEmail(user: IUserWithAccount, entreprise: IEntreprise): Promise<string> {
  const { siret } = entreprise
  const { first_name, last_name, email } = user
  const searchParams = new URLSearchParams()
  searchParams.append("user-id", user._id.toString())
  searchParams.append("siret", siret)

  const { messageId } = await mailer.sendEmail({
    to: email,
    subject: `Engagez-vous en faveur de l’emploi des personnes en situation de handicap !`,
    template: getStaticFilePath("./templates/mail-sensibilisation-handi-engagement.mjml.ejs"),
    data: {
      first_name,
      last_name,
      refusEngagementUrl: `https://tally.so/r/wQbyq7?${searchParams}`,
      accordEngagementUrl: `https://tally.so/r/3jjzD1?${searchParams}`,
      images: {
        informationIcon: `${config.publicUrl}/assets/icon-information-blue.webp?raw=true`,
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
        repFrancaise: `${config.publicUrl}/assets/logo-republique-francaise-short.svg?raw=true`,
        handiMatch: `${config.publicUrl}/images/emails/handimatch.png?raw=true`,
        franceTravail: `${config.publicUrl}/images/logosPartenaires/minimal/france-travail.svg?raw=true`,
      },
    },
  })
  return messageId
}
