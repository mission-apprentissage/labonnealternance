import { logger } from "../../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { ETAT_UTILISATEUR, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "../../../../services/constant.service"
import { runScript } from "../../../scriptWrapper"

function hasUpperCase(str) {
  return str !== str.toLowerCase()
}

runScript(async () => {
  const users = await UserRecruteur.find({})
  const userToUpdate = users.filter((x) => hasUpperCase(x.email))
  const stat = { hasSibblingLowerCase: 0, total: users.length }

  logger.info(`${userToUpdate.length} utilisateur à mettre à jour`)

  await asyncForEach(userToUpdate, async (user) => {
    const exist = await UserRecruteur.findOne({ email: user.email.toLowerCase() })

    if (exist) {
      stat.hasSibblingLowerCase++

      await UserRecruteur.findOneAndUpdate(
        { email: user.email },
        {
          $push: {
            status: {
              validation_type: VALIDATION_UTILISATEUR.AUTO,
              status: ETAT_UTILISATEUR.DESACTIVE,
              reason: `Utilisateur en doublon (traitement des majuscules ${new Date()}`,
              user: "SERVEUR",
            },
          },
        }
      )
      await Recruiter.findOneAndUpdate({ establishment_id: user.establishment_id }, { $set: { status: RECRUITER_STATUS.ARCHIVE } })
      return
    } else {
      user.email = user.email.toLowerCase()
      await user.save()
    }
  })
  return stat
})
