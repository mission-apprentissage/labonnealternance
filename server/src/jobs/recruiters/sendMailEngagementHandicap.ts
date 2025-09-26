import dayjs from "dayjs"
import { AggregationCursor } from "mongodb"
import { AccessEntityType, AccessStatus, getLastStatusEvent, IRoleManagement, IUserWithAccount } from "shared"
import entrepriseModel, { IEntreprise } from "shared/models/entreprise.model"
import userWithAccountModel from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import mailer from "@/services/mailer.service"
import { getEntrepriseEngagementFranceTravail } from "@/services/referentielEngagementEntreprise.service"

const SEND_AFTER_N_DAYS = 3

export async function sendMailEngagementHandicap(delayInDays = SEND_AFTER_N_DAYS) {
  logger.info("début de sendMailEngagementHandicap")

  const limitDate = dayjs().subtract(delayInDays, "days").toDate()
  const documentStream = (await getDbCollection("rolemanagements").aggregate([
    {
      $match: {
        engagementHandicapEmail: null,
        authorized_type: AccessEntityType.ENTREPRISE,
        "status.status": AccessStatus.GRANTED,
        "status.date": {
          $lt: limitDate,
        },
      },
    },
    {
      $addFields: {
        authorized_object_id: { $convert: { input: "$authorized_id", to: "objectId" } },
      },
    },
    {
      $lookup: {
        from: userWithAccountModel.collectionName,
        foreignField: "_id",
        localField: "user_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: entrepriseModel.collectionName,
        foreignField: "_id",
        localField: "authorized_object_id",
        as: "entreprise",
      },
    },
    { $unwind: "$entreprise" },
  ])) as AggregationCursor<IRoleManagement & { user: IUserWithAccount; entreprise: IEntreprise }>

  const now = new Date()
  let counter = 0
  for await (const role of documentStream) {
    if (!isValidRole(role, limitDate)) {
      continue
    }
    const hasHandiEngagementFT = await getEntrepriseEngagementFranceTravail(role.entreprise.siret)
    if (hasHandiEngagementFT) {
      await getDbCollection("rolemanagements").updateOne(
        { _id: role._id },
        {
          $set: {
            engagementHandicapEmail: {
              date: now,
              messageId: "déjà handi-engagement FT",
            },
          },
        }
      )
      continue
    }
    const { user, entreprise } = role
    const messageId = await sendEngagementHandicapEmail(user, entreprise)
    await getDbCollection("rolemanagements").updateOne(
      { _id: role._id },
      {
        $set: {
          engagementHandicapEmail: {
            date: now,
            messageId,
          },
        },
      }
    )
    counter++
  }
  const message = `Sensibilisation au handi-engagement: ${counter} emails envoyés`
  logger.info(message)
  await notifyToSlack({
    subject: "Sensibilisation au handi-engagement",
    message,
  })

  logger.info("fin de sendMailEngagementHandicap")
}

function isValidRole(role: IRoleManagement, limitDate: Date): boolean {
  const lastEvent = getLastStatusEvent(role.status)
  if (!lastEvent) {
    return false
  }
  return lastEvent.status === AccessStatus.GRANTED && lastEvent.date.getTime() <= limitDate.getTime()
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
