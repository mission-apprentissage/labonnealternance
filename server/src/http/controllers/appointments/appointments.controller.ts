import Sentry from "@sentry/node"
import Boom from "boom"
import { zRoutes } from "shared/index"

import { getReferrerByKeyName } from "../../../common/model/constants/referrers"
import { Etablissement, ReferentielOnisep } from "../../../common/model/index"
import { isValidEmail } from "../../../common/utils/isValidEmail"
import config from "../../../config"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

import { contextCreateSchema } from "./validators"

// @Tags("Appointment Request")
// @OperationId("appointmentCreateContext")
// @Example<TCreateContextResponse>({
//   etablissement_formateur_entreprise_raison_sociale: "CAMPUS FONDERIE DE L'IMAGE",
//   intitule_long: "METIERS D'ART ET DU DESIGN (DN)",
//   lieu_formation_adresse: "80 Rue Jules Ferry",
//   code_postal: "93170",
//   etablissement_formateur_siret: "35386977900036",
//   cfd: "24113401",
//   localite: "Bagnolet",
//   id_rco_formation: "14_AF_0000095539|14_SE_0000501120##14_SE_0000598458##14_SE_0000642556##14_SE_0000642557##14_SE_0000825379##14_SE_0000825382|101249",
//   cle_ministere_educatif: "101249P01313538697790003635386977900036-93006#L01",
//   form_url: "https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/form?referrer=affelnet&cleMinistereEducatif=101249P01313538697790003635386977900036-93006%23L01",
// })
export default (server: Server) => {
  server.post(
    "/api/appointment-request/context/create",
    {
      schema: zRoutes.post["/api/appointment-request/context/create"],
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      // TODO: remove this validate ?
      await contextCreateSchema.validateAsync(req.body, { abortEarly: false })

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
          return res.status(404).send("Formation introuvable")
        }

        eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
          cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
        })
      } else {
        return res.status(400).send("Critère de recherche non conforme.")
      }

      if (!eligibleTrainingsForAppointment) {
        return res.status(404).send("Formation introuvable")
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
        form_url: `${config.publicUrlEspacePro}/form?referrer=${referrerObj.name.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
          eligibleTrainingsForAppointment.cle_ministere_educatif
        )}`,
      })
    }
  )
}
