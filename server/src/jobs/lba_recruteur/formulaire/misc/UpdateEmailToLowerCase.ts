import { logger } from "../../../../common/logger.js"
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

function hasUpperCase(str) {
  return str !== str.toLowerCase()
}

const getStat = async () => {
  const users = await UserRecruteur.find({})
  const stat = { CFA: 0, ETP: 0, offreActive: 0, dateExpiration: [], user: [] }
  const userToUpdate = users.filter((x) => hasUpperCase(x.email))

  console.log(userToUpdate.length)

  await asyncForEach(userToUpdate, async (user) => {
    const exist = await UserRecruteur.findOne({ email: user.email.toLowerCase() })

    if (exist) {
      switch (user.type) {
        case "ENTREPRISE":
          stat.ETP++
          const formulaire = await Recruiter.findOne({ establishment_id: user.establishment_id, "jobs.job_status": "Active" })

          if (formulaire) {
            const nbrOffre = formulaire.jobs.filter((job) => job.job_status === "Active")
            stat.offreActive += nbrOffre.length
            nbrOffre.map((x) => stat.dateExpiration.push(x.job_expiration_date))
            stat.user.push({ email: user.email, establishment_id: user.establishment_id })
          }

          break

        case "CFA":
          stat.CFA++
          const formulaireCFA = await Recruiter.find({ cfa_delegated_siret: user.establishment_siret, "jobs.jobs_status": "Active" })

          console.log("CFA", formulaireCFA.length)

        default:
          break
      }
    }
  })

  return stat
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
              validation_type: "AUTOMATIQUE",
              status: "DESACTIVÉ",
              reason: `Utilisateur en doublon (traitement des majuscules ${new Date()}`,
              user: "SERVEUR",
            },
          },
        }
      )
      await Recruiter.findOneAndUpdate({ establishment_id: user.establishment_id }, { $set: { status: "Archivé" } })

      return
    } else {
      user.email = user.email.toLowerCase()
      await user.save()
    }
  })
  return stat
})
