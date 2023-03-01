import * as express from "express"
import { Body, Controller, Example, OperationId, Post, Request, Response, Route, SuccessResponse, Tags } from "tsoa"
import WidgetParameters from "../../../common/components/widgetParameters.js"
import { getReferrerByKeyName } from "../../../common/model/constants/referrers.js"
import { isValidEmail } from "../../../common/utils/isValidEmail.js"
import { getCleMinistereEducatifFromIdActionFormation } from "../../../common/utils/mappings/onisep.js"
import { sentryCaptureException } from "../../../common/utils/sentryUtils.js"
import config from "../../../config.js"
import { TCreateContextBody, TCreateContextResponse, TCreateContextResponseError } from "./types.js"
import { contextCreateSchema } from "./validators.js"

@Tags("RDV")
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

    const widgetParametersService = WidgetParameters()

    const { idRcoFormation, idParcoursup, idActionFormation, appointment_origin, idCleMinistereEducatif } = body

    const referrerObj = getReferrerByKeyName(appointment_origin)

    let widgetParameter
    if (idCleMinistereEducatif) {
      widgetParameter = await widgetParametersService.findOne({ cle_ministere_educatif: idCleMinistereEducatif })
    } else if (idRcoFormation) {
      widgetParameter = await widgetParametersService.findOne({
        rco_formation_id: idRcoFormation,
        cle_ministere_educatif: {
          $ne: null,
        },
      })
    } else if (idParcoursup) {
      widgetParameter = await widgetParametersService.findOne({
        id_parcoursup: idParcoursup,
        cle_ministere_educatif: {
          $ne: null,
        },
      })
    } else if (idActionFormation) {
      const cleMinistereEducatif = getCleMinistereEducatifFromIdActionFormation(idActionFormation)

      if (!cleMinistereEducatif) {
        this.setStatus(404)
        return "Formation introuvable."
      }

      widgetParameter = await widgetParametersService.findOne({ cle_ministere_educatif: cleMinistereEducatif })
    } else {
      this.setStatus(400)
      return "Critère de recherche non conforme."
    }

    if (!widgetParameter) {
      this.setStatus(404)
      return "Formation introuvable."
    }

    const isOpenForAppointments = await widgetParametersService.findOne({
      cle_ministere_educatif: widgetParameter.cle_ministere_educatif,
      referrers: { $in: [referrerObj.code] },
      email_rdv: { $nin: [null, ""] },
    })

    if (!isValidEmail(isOpenForAppointments?.email_rdv)) {
      sentryCaptureException(new Error(`Formation "${widgetParameter.cle_ministere_educatif}" sans email de contact.`))
    }

    if (!isOpenForAppointments || !isValidEmail(isOpenForAppointments?.email_rdv)) {
      return {
        error: "Prise de rendez-vous non disponible.",
      }
    }

    return {
      etablissement_formateur_entreprise_raison_sociale: widgetParameter.etablissement_raison_sociale,
      intitule_long: widgetParameter.formation_intitule,
      lieu_formation_adresse: widgetParameter.lieu_formation_adresse,
      code_postal: widgetParameter.code_postal,
      etablissement_formateur_siret: widgetParameter.etablissement_siret,
      cfd: widgetParameter.formation_cfd,
      localite: widgetParameter.localite,
      id_rco_formation: widgetParameter.rco_formation_id,
      cle_ministere_educatif: widgetParameter?.cle_ministere_educatif,
      form_url: `${config.publicUrlEspacePro}/form?referrer=${appointment_origin}&cleMinistereEducatif=${encodeURIComponent(widgetParameter.cle_ministere_educatif)}`,
    }
  }
}
