import Boom from "boom"
import { IEligibleTrainingsForAppointment, zRoutes } from "shared/index"

import { getReferrerByKeyName } from "../../common/model/constants/referrers"
import config from "../../config"
import {
  findEligibleTrainingByActionFormation,
  findEligibleTrainingByMinisterialKey,
  findEligibleTrainingByParcoursupId,
  findEtablissement,
  findOpenAppointments,
} from "../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/appointment",
    {
      schema: zRoutes.post["/appointment"],
      onRequest: server.auth(zRoutes.post["/appointment"]),
    },
    async (req, res) => {
      const { referrer } = req.body
      const referrerObj = getReferrerByKeyName(referrer)
      let eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment | null

      if ("idCleMinistereEducatif" in req.body) {
        eligibleTrainingsForAppointment = await findEligibleTrainingByMinisterialKey(req.body.idCleMinistereEducatif)
      } else if ("idParcoursup" in req.body) {
        eligibleTrainingsForAppointment = await findEligibleTrainingByParcoursupId(req.body.idParcoursup)
      } else if ("idActionFormation" in req.body) {
        eligibleTrainingsForAppointment = await findEligibleTrainingByActionFormation(req.body.idActionFormation)
      } else {
        throw Boom.badRequest("Critère de recherche non conforme.")
      }

      if (!eligibleTrainingsForAppointment) {
        throw Boom.badRequest("Formation introuvable")
      }

      const isOpenForAppointments = await findOpenAppointments(eligibleTrainingsForAppointment, referrerObj.name)

      if (!isOpenForAppointments) {
        return res.status(200).send({
          error: "Prise de rendez-vous non disponible.",
        })
      }

      const etablissement = await findEtablissement(eligibleTrainingsForAppointment.etablissement_formateur_siret)

      if (!etablissement) {
        throw Boom.internal("Etablissement formateur non trouvé")
      }

      res.status(200).send({
        etablissement_formateur_entreprise_raison_sociale: etablissement.raison_sociale,
        intitule_long: eligibleTrainingsForAppointment.training_intitule_long,
        lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
        code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
        etablissement_formateur_siret: etablissement.formateur_siret,
        cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
        localite: eligibleTrainingsForAppointment.lieu_formation_city,
        id_rco_formation: eligibleTrainingsForAppointment.rco_formation_id,
        cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
        form_url: `${config.publicUrl}/espace-pro/form?referrer=${referrerObj.name.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
          eligibleTrainingsForAppointment.cle_ministere_educatif
        )}`,
      })
    }
  )
}
