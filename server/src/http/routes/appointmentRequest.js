import Sentry from "@sentry/node"
import Boom from "boom"
import express from "express"
import Joi from "joi"
import { mailTemplate } from "../../assets/index.js"
import { candidatFollowUpType, mailType } from "../../common/model/constants/appointments.js"
import { getReferrerById, getReferrerByKeyName, referrers } from "../../common/model/constants/referrers.js"
import { roles } from "../../common/roles.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import { getCleMinistereEducatifFromIdActionFormation } from "../../common/utils/mappings/onisep.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

const contextCreateSchema = Joi.alternatives().try(
  // Find through "idParcoursup"
  Joi.object().keys({
    idParcoursup: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idActionFormation: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idRcoFormation"
  Joi.object().keys({
    idRcoFormation: Joi.string().required(),
    idActionFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idActionFormation"
  Joi.object().keys({
    idActionFormation: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    idCleMinistereEducatif: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  }),
  // Find through "idCleMinistereEducatif"
  Joi.object().keys({
    idCleMinistereEducatif: Joi.string().required(),
    idRcoFormation: Joi.string().allow(""),
    idActionFormation: Joi.string().allow(""),
    idParcoursup: Joi.string().allow(""),
    trainingHasJob: Joi.boolean().allow(""),
    referrer: Joi.string()
      .valid(
        referrers.PARCOURSUP.name.toLowerCase(),
        referrers.LBA.name.toLowerCase(),
        referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
        referrers.ONISEP.name.toLowerCase(),
        referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
        referrers.AFFELNET.name.toLowerCase()
      )
      .required(),
  })
)

const userRequestSchema = Joi.object({
  firstname: Joi.string().required(),
  lastname: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().required(),
  motivations: Joi.string().allow(null, ""),
  cleMinistereEducatif: Joi.string().required(),
  referrer: Joi.string().required(),
})

const appointmentItemSchema = Joi.object({
  appointmentId: Joi.string().required(),
  cfaAPrisContact: Joi.boolean().optional(),
  champsLibreStatut: Joi.string().optional().allow(""),
  champsLibreCommentaires: Joi.string().optional().allow(""),
})

const appointmentIdFollowUpSchema = Joi.object({
  action: Joi.string().valid(candidatFollowUpType.CONFIRM, candidatFollowUpType.RESEND).required(),
})

export default ({ users, appointments, mailer, widgetParameters, etablissements }) => {
  const router = express.Router()
  const notAllowedResponse = { error: "Prise de rendez-vous non disponible." }

  /**
   * @swagger
   * "/appointment-request/context/create":
   *  post:
   *    summary: Génère un lien permettant d'accéder au formulaire de prise de rendez-vous avec un CFA.
   *    description: A partir des informations fournies, on génère un lien d'accès à un formulaire de mise en relation entre un candidat à l'alternance et un contact en charge de la formation dans un CFA.
   *    tags:
   *        - Rendez-vous
   *    requestBody:
   *      description: L'objet "rendez-vous" doit être composé d'une clé ministère éducatif (identifiant de l'action de formation) et mentionner la provenance de la demande de mise en relation (referrer).
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              idCleMinistereEducatif:
   *                type: string
   *                description: Clé Ministère Educatif
   *              referrer:
   *                type: string
   *                description: Plateforme à l'initiative de la demande de génération du lien
   *                enum:
   *                  - affelnet
   *                  - parcoursup
   *                  - lba
   *                  - pfr_pays_de_la_loire
   *                  - onisep
   *                  - jeune_1_solution
   *            required:
   *              - idCleMinistereEducatif
   *              - referrer
   *    responses:
   *      200:
   *        description: Lien créé avec succès.
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                etablissement_formateur_entreprise_raison_sociale:
   *                  type: string
   *                  description: Raison sociale de l'établissement formateur.
   *                  example: CAMPUS FONDERIE DE L'IMAGE
   *                intitule_long:
   *                  type: string
   *                  description: Intitule long de la formation.
   *                  example: METIERS D'ART ET DU DESIGN (DN)
   *                lieu_formation_adresse:
   *                  type: string
   *                  description: Adresse de la formation.
   *                  example: 10 rue Victor Hugo
   *                code_postal:
   *                  type: string
   *                  description: Code postal du lieu de la formation.
   *                  example: 93170
   *                etablissement_formateur_siret:
   *                  type: string
   *                  description: Siret de l'établissement formateur
   *                  example: 35386977900036
   *                cfd:
   *                  type: string
   *                  description: Code de formation.
   *                  example: 24113401
   *                localite:
   *                  type: string
   *                  description: Localité de la formation.
   *                  example: Bagnolet
   *                id_rco_formation:
   *                  type: string
   *                  description: Identifiant RCO
   *                  example: 14_AF_0000095539|14_SE_0000501120##14_SE_0000598458##14_SE_0000642556##14_SE_0000642557##14_SE_0000825379##14_SE_0000825382|101249
   *                cle_ministere_educatif:
   *                  type: string
   *                  description: Clé Ministère Educatif
   *                  example: 101249P01313538697790003635386977900036-93006#L01
   *                form_url:
   *                  type: string
   *                  description: Lien généré permettant d'accéder au formulaire de mise en relation.
   *                  example: http://https://labonnealternance.apprentissage.beta.gouv.fr/espace-pro/form?referrer=parcoursup&cleMinistereEducatif=101249P01313538697790003635386977900036-93006%23L01
   */
  router.post(
    "/context/create",
    tryCatch(async (req, res) => {
      await contextCreateSchema.validateAsync(req.body, { abortEarly: false })

      const { idRcoFormation, idParcoursup, idActionFormation, referrer, idCleMinistereEducatif } = req.body

      const referrerObj = getReferrerByKeyName(referrer)

      let widgetParameter
      if (idCleMinistereEducatif) {
        widgetParameter = await widgetParameters.findOne({ cle_ministere_educatif: idCleMinistereEducatif })
      } else if (idRcoFormation) {
        widgetParameter = await widgetParameters.findOne({
          id_rco_formation: idRcoFormation,
          cle_ministere_educatif: {
            $ne: null,
          },
        })
      } else if (idParcoursup) {
        widgetParameter = await widgetParameters.findOne({
          id_parcoursup: idParcoursup,
          cle_ministere_educatif: {
            $ne: null,
          },
        })
      } else if (idActionFormation) {
        const cleMinistereEducatif = getCleMinistereEducatifFromIdActionFormation(idActionFormation)

        if (!cleMinistereEducatif) {
          throw Boom.notFound("Formation introuvable.")
        }

        widgetParameter = await widgetParameters.findOne({ cle_ministere_educatif: cleMinistereEducatif })
      } else {
        throw new Error("Critère de recherche non conforme.")
      }

      if (!widgetParameter) {
        throw Boom.notFound("Formation introuvable.")
      }

      const isOpenForAppointments = await widgetParameters.findOne({
        cle_ministere_educatif: widgetParameter.cle_ministere_educatif,
        referrers: { $in: [referrerObj.code] },
        email_rdv: { $nin: [null, ""] },
      })

      if (!isOpenForAppointments) {
        return res.status(404).send(notAllowedResponse)
      }

      if (!isValidEmail(isOpenForAppointments?.email_rdv)) {
        Sentry.captureException(new Error(`Formation "${widgetParameter.cle_ministere_educatif}" sans email de contact.`))
      }

      res.send({
        etablissement_formateur_entreprise_raison_sociale: widgetParameter.etablissement_raison_sociale,
        intitule_long: widgetParameter.formation_intitule,
        lieu_formation_adresse: widgetParameter.lieu_formation_adresse,
        code_postal: widgetParameter.code_postal,
        etablissement_formateur_siret: widgetParameter.etablissement_siret,
        cfd: widgetParameter.formation_cfd,
        localite: widgetParameter.localite,
        id_rco_formation: widgetParameter.id_rco_formation,
        cle_ministere_educatif: widgetParameter?.cle_ministere_educatif,
        form_url: `${config.publicUrlEspacePro}/form?referrer=${referrer}&cleMinistereEducatif=${encodeURIComponent(widgetParameter.cle_ministere_educatif)}`,
      })
    })
  )

  router.post(
    "/validate",
    tryCatch(async (req, res) => {
      await userRequestSchema.validateAsync(req.body, { abortEarly: false })

      let { firstname, lastname, phone, email, motivations, referrer, cleMinistereEducatif } = req.body

      email = email.toLowerCase()

      const referrerObj = getReferrerByKeyName(referrer)

      const widgetParameter = await widgetParameters.findOne({
        cle_ministere_educatif: cleMinistereEducatif,
        referrers: { $in: [referrerObj.code] },
      })

      if (!widgetParameter) {
        throw Boom.badRequest("Formation introuvable.")
      }

      let user = await users.getUser(email)

      // Updates firstname and last name if the user already exists
      if (user) {
        user = await users.update(user._id, { firstname, lastname, phone })
        const appointment = await appointments.findOne({
          candidat_id: user._id,
          cle_ministere_educatif: widgetParameter.cle_ministere_educatif,
          created_at: {
            $gte: dayjs().subtract(4, "days").toDate(),
          },
        })

        if (appointment) {
          return res.send({
            error: {
              message: `Une demande de prise de RDV en date du ${dayjs(appointment.createdAt).format("DD/MM/YYYY")} est actuellement est cours de traitement.`,
            },
          })
        }
      } else {
        user = await users.createUser(email, "NA", {
          firstname,
          lastname,
          phone,
          email,
          role: roles.candidat,
        })
      }

      const [createdAppointement, etablissement] = await Promise.all([
        appointments.createAppointment({
          candidat_id: user._id,
          etablissement_id: widgetParameter.etablissement_formateur_siret,
          formation_id: widgetParameter.formation_cfd,
          motivations,
          referrer: referrerObj.code,
          id_rco_formation: widgetParameter.id_rco_formation,
          cle_ministere_educatif: widgetParameter.cle_ministere_educatif,
        }),
        etablissements.findOne({
          siret_formateur: widgetParameter.etablissement_formateur_siret,
        }),
      ])

      const mailData = {
        appointmentId: createdAppointement._id,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          phone: user.phone.match(/.{1,2}/g).join("."),
          email: user.email,
          motivations: createdAppointement.motivations,
        },
        etablissement: {
          name: widgetParameter.etablissement_raison_sociale,
          address: widgetParameter.lieu_formation_adresse,
          postalCode: widgetParameter.code_postal,
          ville: widgetParameter.localite,
          email: widgetParameter.email_rdv,
        },
        formation: {
          intitule: widgetParameter.formation_intitule,
        },
        appointment: {
          referrerLink: referrerObj.url,
          referrer: referrerObj.full_name,
          link: `${config.publicUrlEspacePro}/establishment/${etablissement._id}/appointments/${createdAppointement._id}?utm_source=mail`,
        },
        images: {
          logoCandidat: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-candidat.png?raw=true`,
          logoCfa: `${config.publicUrlEspacePro}/assets/logo-lba-recruteur-cfa.png?raw=true`,
          logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
          peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
        },
      }

      // Sends email to "candidate" and "formation"
      const [emailCandidat, emailCfa] = await Promise.all([
        mailer.sendEmail({
          to: user.email,
          subject: `Le centre de formation a bien reçu votre demande de contact !`,
          template: mailTemplate["mail-candidat-confirmation-rdv"],
          data: mailData,
        }),
        mailer.sendEmail({
          to: widgetParameter.email_rdv,
          subject: `[RDV via ${referrerObj.full_name}] Un candidat souhaite être contacté`,
          template: mailTemplate["mail-cfa-demande-de-contact"],
          data: mailData,
        }),
      ])

      await appointments.updateAppointment(createdAppointement._id, {
        email_premiere_demande_candidat_message_id: emailCandidat.messageId,
        email_premiere_demande_cfa_message_id: emailCfa.messageId,
        email_cfa: widgetParameter.email_rdv,
        email_premiere_demande_cfa_date: dayjs().format(),
        email_premiere_demande_candidat_date: dayjs().format(),
      })

      res.json({
        userId: user._id,
        appointment: createdAppointement,
      })
    })
  )

  router.post(
    "/edit",
    tryCatch(async (req, res) => {
      await appointmentItemSchema.validateAsync(req.body, { abortEarly: false })
      const paramsAppointementItem = req.body

      await appointments.updateAppointment(paramsAppointementItem.appointmentId, paramsAppointementItem)
      res.json({})
    })
  )

  router.get(
    "/context/recap",
    tryCatch(async (req, res) => {
      const { appointmentId } = req.query

      const appointment = await appointments.getAppointmentById(appointmentId)

      let [widgetParameter, user] = await Promise.all([
        widgetParameters.getParameterByCleMinistereEducatif({
          cleMinistereEducatif: appointment.cle_ministere_educatif,
        }),
        users.getUserById(appointment.candidat_id),
      ])

      // Note: id_rco_formation will be removed soon
      if (!widgetParameter) {
        widgetParameter = await widgetParameters.getParameterByIdRcoFormation({
          idRcoFormation: appointment.id_rco_formation,
        })
      }

      res.json({
        appointment: {
          ...appointment,
          referrer: getReferrerById(appointment.referrer),
        },
        user: user._doc,
        etablissement: {
          email: widgetParameter.email_rdv || "",
          intitule_long: widgetParameter.formation_intitule,
          etablissement_formateur_entreprise_raison_sociale: widgetParameter.etablissement_raison_sociale,
        },
      })
    })
  )

  router.get(
    "/:id/candidat/follow-up",
    tryCatch(async (req, res) => {
      const appointment = await appointments.findOne({ _id: req.params.id })

      if (!appointment) {
        return res.sendStatus(400)
      }

      const etablissement = await etablissements.findOne({ siret_formateur: appointment.etablissement_id })

      // Check if the RESEND action has already been triggered
      const cfaMailResendExists = appointment.cfa_mailing.find((mail) => mail.campaign === mailType.CFA_REMINDER_RESEND_APPOINTMENT)

      res.send({
        formAlreadySubmit: !!(appointment.candidat_contacted_at || cfaMailResendExists),
        appointment: {
          candidat_contacted_at: appointment.candidat_contacted_at,
        },
        etablissement: {
          raison_sociale: etablissement.raison_sociale,
          adresse: etablissement.adresse,
          code_postal: etablissement.code_postal,
          localite: etablissement.localite,
        },
      })
    })
  )

  router.post(
    "/:id/candidat/follow-up",
    tryCatch(async (req, res) => {
      const { action } = await appointmentIdFollowUpSchema.validateAsync(req.body, { abortEarly: false })

      const appointment = await appointments.findOne({ _id: req.params.id })

      if (!appointment) {
        return res.sendStatus(400)
      }

      // Check if the RESEND action has already been triggered
      const cfaMailResendExists = appointment.cfa_mailing.find((mail) => mail.campaign === mailType.CFA_REMINDER_RESEND_APPOINTMENT)

      if (appointment.candidat_contacted_at || cfaMailResendExists) {
        return res.sendStatus(400)
      }

      const [user, widgetParameter] = await Promise.all([
        users.findOne({ _id: appointment.candidat_id }),
        widgetParameters.findOne({ id_rco_formation: appointment.id_rco_formation }),
      ])

      if (action === candidatFollowUpType.CONFIRM) {
        await appointment.update({ candidat_contacted_at: dayjs().toDate() })
      }

      if (action === candidatFollowUpType.RESEND) {
        const referrerObj = getReferrerById(appointment.referrer)

        const { messageId } = await mailer.sendEmail({
          to: widgetParameter.email_rdv,
          subject: `[RDV via ${referrerObj.full_name}] Relance - Un candidat souhaite être contacté`,
          template: mailTemplate["mail-cfa-demande-de-contact"],
          data: {
            user: {
              firstname: user.firstname,
              lastname: user.lastname,
              phone: user.phone.match(/.{1,2}/g).join("."),
              email: user.email,
              motivations: appointment.motivations,
            },
            etablissement: {
              name: widgetParameter.etablissement_raison_sociale,
              address: widgetParameter.lieu_formation_adresse,
              postalCode: widgetParameter.code_postal,
              ville: widgetParameter.localite,
            },
            formation: {
              intitule: widgetParameter.formation_intitule,
            },
            appointment: {
              referrerLink: referrerObj.url,
              referrer: referrerObj.full_name,
            },
            images: {
              peopleLaptop: `${config.publicUrlEspacePro}/assets/girl_laptop.png?raw=true`,
            },
          },
        })

        await appointments.findOneAndUpdate(
          { _id: appointment._id },
          {
            $push: {
              cfa_mailing: {
                campaign: mailType.CFA_REMINDER_RESEND_APPOINTMENT,
                status: null,
                message_id: messageId,
                email_sent_at: dayjs().toDate(),
              },
            },
          }
        )
      }

      res.sendStatus(200)
    })
  )

  router.get(
    "/:id/candidat",
    tryCatch(async (req, res) => {
      const itemId = req.params.id
      await appointments.updateStatusMailOpenedByCandidat(itemId)
      res.json("OK")
    })
  )

  router.get(
    "/:id/centre",
    tryCatch(async (req, res) => {
      const itemId = req.params.id
      await appointments.updateStatusMailOpenedByCentre(itemId)
      res.json("OK")
    })
  )

  return router
}
