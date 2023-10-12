import Sentry from "@sentry/node"
import Boom from "boom"
import { zRoutes } from "shared/index"

import { getReferrerByKeyName } from "../../../common/model/constants/referrers"
import { Etablissement, ReferentielOnisep } from "../../../common/model/index"
import { isValidEmail } from "../../../common/utils/isValidEmail"
import config from "../../../config"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

export default (server: Server) => {
  server.post(
    "/appointment-request/context/create",
    {
      schema: zRoutes.post["/appointment-request/context/create"],
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { referrer } = req.body

      const referrerObj = getReferrerByKeyName(referrer)

      let eligibleTrainingsForAppointment
      if ("idCleMinistereEducatif" in req.body) {
        eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({ cle_ministere_educatif: req.body.idCleMinistereEducatif })
      } else if ("idRcoFormation" in req.body) {
        eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
          rco_formation_id: req.body.idRcoFormation,
          cle_ministere_educatif: {
            $ne: null,
          },
        })
      } else if ("idParcoursup" in req.body) {
        eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
          parcoursup_id: req.body.idParcoursup,
          cle_ministere_educatif: {
            $ne: null,
          },
        })
      } else if ("idActionFormation" in req.body) {
        const referentielOnisepIdActionFormation = await ReferentielOnisep.findOne({
          id_action_ideo2: req.body.idActionFormation,
        })

        if (!referentielOnisepIdActionFormation) {
          throw Boom.notFound("Formation introuvable")
        }

        eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
          cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
        })
      } else {
        return res.status(400).send("Critère de recherche non conforme.")
      }

      if (!eligibleTrainingsForAppointment) {
        throw Boom.notFound("Formation introuvable")
      }

      const isOpenForAppointments = await eligibleTrainingsForAppointmentService.findOne({
        cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
        referrers: { $in: [referrerObj.name] },
        lieu_formation_email: { $nin: [null, ""] },
      })

      if (!isValidEmail(isOpenForAppointments?.lieu_formation_email)) {
        Sentry.captureException(new Error(`Formation "${eligibleTrainingsForAppointment.cle_ministere_educatif}" sans email de contact.`))
      }

      if (!isOpenForAppointments || !isValidEmail(isOpenForAppointments?.lieu_formation_email)) {
        // TODO: status code
        return res.status(200).send({
          error: "Prise de rendez-vous non disponible.",
        })
      }

      const etablissement = await Etablissement.findOne({ formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret })

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
