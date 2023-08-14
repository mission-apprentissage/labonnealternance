import Sentry from "@sentry/node"
import * as express from "express"
import { Body, Controller, Example, OperationId, Post, Request, Response, Route, SuccessResponse, Tags } from "tsoa"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service.js"
import Etablissement from "../../../common/components/etablissement.js"
import { getReferrerByKeyName } from "../../../common/model/constants/referrers.js"
import { isValidEmail } from "../../../common/utils/isValidEmail.js"
import config from "../../../config.js"
import { TCreateContextBody, TCreateContextResponse, TCreateContextResponseError } from "./types.js"
import { contextCreateSchema } from "./validators.js"
import { ReferentielOnisep } from "../../../common/model/index.js"

@Tags("Appointment Request")
@Route("/api/appointment-request")
export class AppointmentsController extends Controller {
  /**
   * Appointment request
   */
  @SuccessResponse(200, "OK")
  @Request()
  req: express.Request
  @Response<"Formation introuvable.">(404)
  @Post("/context/create")
  @OperationId("appointmentCreateContext")
  @Example<TCreateContextResponse>({
    etablissement_formateur_entreprise_raison_sociale: "CAMPUS FONDERIE DE L'IMAGE",
    intitule_long: "METIERS D'ART ET DU DESIGN (DN)",
    lieu_formation_adresse: "80 Rue Jules Ferry",
    code_postal: "93170",
    etablissement_formateur_siret: "35386977900036",
    cfd: "24113401",
    localite: "Bagnolet",
    id_rco_formation: "14_AF_0000095539|14_SE_0000501120##14_SE_0000598458##14_SE_0000642556##14_SE_0000642557##14_SE_0000825379##14_SE_0000825382|101249",
    cle_ministere_educatif: "101249P01313538697790003635386977900036-93006#L01",
    form_url: "https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/form?referrer=affelnet&cleMinistereEducatif=101249P01313538697790003635386977900036-93006%23L01",
  })
  public async createContext(@Body() body: TCreateContextBody): Promise<TCreateContextResponse | TCreateContextResponseError | string> {
    await contextCreateSchema.validateAsync(body, { abortEarly: false })

    const { idRcoFormation, idParcoursup, idActionFormation, referrer, idCleMinistereEducatif } = body

    const referrerObj = getReferrerByKeyName(referrer)

    let eligibleTrainingsForAppointment
    if (idCleMinistereEducatif) {
      eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({ cle_ministere_educatif: idCleMinistereEducatif })
    } else if (idRcoFormation) {
      eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
        rco_formation_id: idRcoFormation,
        cle_ministere_educatif: {
          $ne: null,
        },
      })
    } else if (idParcoursup) {
      eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({
        parcoursup_id: idParcoursup,
        cle_ministere_educatif: {
          $ne: null,
        },
      })
    } else if (idActionFormation) {
      const referentielOnisepIdActionFormation = await ReferentielOnisep.findOne({
        id_action_ideo2: idActionFormation,
      })

      if (!referentielOnisepIdActionFormation) {
        this.setStatus(404)
        return "Formation introuvable."
      }

      eligibleTrainingsForAppointment = await eligibleTrainingsForAppointmentService.findOne({ cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif })
    } else {
      this.setStatus(400)
      return "Critère de recherche non conforme."
    }

    if (!eligibleTrainingsForAppointment) {
      this.setStatus(404)
      return "Formation introuvable."
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
      return {
        error: "Prise de rendez-vous non disponible.",
      }
    }

    const etablissement = await Etablissement().findOne({ formateur_siret: eligibleTrainingsForAppointment.etablissement_formateur_siret })

    return {
      etablissement_formateur_entreprise_raison_sociale: etablissement.raison_sociale,
      intitule_long: eligibleTrainingsForAppointment.training_intitule_long,
      lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
      code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
      etablissement_formateur_siret: etablissement.formateur_siret,
      cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
      localite: eligibleTrainingsForAppointment.lieu_formation_city,
      id_rco_formation: eligibleTrainingsForAppointment.rco_formation_id,
      cle_ministere_educatif: eligibleTrainingsForAppointment?.cle_ministere_educatif,
      form_url: `${config.publicUrlEspacePro}/form?referrer=${referrerObj.name.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
        eligibleTrainingsForAppointment.cle_ministere_educatif
      )}`,
    }
  }
}
