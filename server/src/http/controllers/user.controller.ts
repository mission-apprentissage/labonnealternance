import Boom from "boom"
import { CFA, ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IJob, getUserStatus, zRoutes } from "shared/index"

import { stopSession } from "@/common/utils/session.service"
import { getUserFromRequest } from "@/security/authenticationService"

import { Recruiter, UserRecruteur } from "../../common/model/index"
import { getStaticFilePath } from "../../common/utils/getStaticFilePath"
import config from "../../config"
import { ENTREPRISE, RECRUITER_STATUS } from "../../services/constant.service"
import { activateEntrepriseRecruiterForTheFirstTime, deleteFormulaire, getFormulaire, reactivateRecruiter } from "../../services/formulaire.service"
import mailer from "../../services/mailer.service"
import { getUserAndRecruitersDataForOpcoUser, getValidatorIdentityFromStatus } from "../../services/user.service"
import {
  createUser,
  getActiveUsers,
  getAdminUsers,
  getAwaitingUsers,
  getDisabledUsers,
  getErrorUsers,
  removeUser,
  sendWelcomeEmailToUserRecruteur,
  updateUser,
  updateUserValidationHistory,
} from "../../services/userRecruteur.service"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/user/opco",
    {
      schema: zRoutes.get["/user/opco"],
      onRequest: [server.auth(zRoutes.get["/user/opco"])],
    },
    async (req, res) => {
      const { opco } = req.query
      return res.status(200).send(await getUserAndRecruitersDataForOpcoUser(opco))
    }
  )

  server.get(
    "/user",
    {
      schema: zRoutes.get["/user"],
      onRequest: [server.auth(zRoutes.get["/user"])],
    },
    async (req, res) => {
      // TODO KEVIN: ADD PAGINATION
      const [awaiting, active, disabled, error] = await Promise.all([getAwaitingUsers(), getActiveUsers(), getDisabledUsers(), getErrorUsers()])
      return res.status(200).send({ awaiting, active, disabled, error })
    }
  )
  server.get(
    "/admin/users",
    {
      schema: zRoutes.get["/admin/users"],
      onRequest: [server.auth(zRoutes.get["/admin/users"])],
    },
    async (req, res) => {
      const users = await getAdminUsers()
      return res.status(200).send({ users })
    }
  )

  server.get(
    "/admin/users/:userId",
    {
      schema: zRoutes.get["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.get["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { userId } = req.params
      const userRecruteur = await UserRecruteur.findOne({ _id: userId }).lean()
      let jobs: IJob[] = []

      if (!userRecruteur) throw Boom.notFound(`user with id=${userId} not found`)

      const { establishment_id } = userRecruteur
      if (userRecruteur.type === ENTREPRISE) {
        if (!establishment_id) {
          throw Boom.internal("Unexpected: no establishment_id in userRecruteur of type ENTREPRISE", { userId: userRecruteur._id })
        }
        const recruiterOpt = await Recruiter.findOne({ establishment_id }).select({ jobs: 1, _id: 0 }).lean()
        if (!recruiterOpt) {
          throw Boom.internal("Get establishement from user failed to fetch", { userId: userRecruteur._id })
        }
        jobs = recruiterOpt.jobs
      }

      return res.status(200).send({ ...userRecruteur, jobs })
    }
  )

  server.post(
    "/admin/users",
    {
      schema: zRoutes.post["/admin/users"],
      onRequest: [server.auth(zRoutes.post["/admin/users"])],
    },
    async (req, res) => {
      const user = await createUser({
        ...req.body,
        is_email_checked: true,
        status: [
          {
            status: ETAT_UTILISATEUR.ATTENTE,
            validation_type: VALIDATION_UTILISATEUR.MANUAL,
            user: getUserFromRequest(req, zRoutes.post["/admin/users"]).value._id.toString(),
          },
        ],
      })
      return res.status(200).send(user)
    }
  )

  server.put(
    "/admin/users/:userId",
    {
      schema: zRoutes.put["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.put["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { email, ...userPayload } = req.body
      const { userId } = req.params
      const formattedEmail = email?.toLocaleLowerCase()

      const exist = await UserRecruteur.findOne({ email: formattedEmail, _id: { $ne: userId } }).lean()

      if (exist) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }

      const update = { email: formattedEmail, ...userPayload }

      await updateUser({ _id: userId }, update)
      return res.status(200).send({ ok: true })
    }
  )

  server.delete(
    "/admin/users/:userId",
    {
      schema: zRoutes.delete["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.delete["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { recruiterId } = req.query

      await removeUser(req.params.userId)

      if (recruiterId) {
        // Seulement dans le cas d'une entreprise (non utilisé en front pour l'instant)
        await deleteFormulaire(recruiterId)
      }

      return res.status(200).send({ ok: true })
    }
  )

  server.get(
    "/user/:userId",
    {
      schema: zRoutes.get["/user/:userId"],
      onRequest: [server.auth(zRoutes.get["/user/:userId"])],
    },
    async (req, res) => {
      const user = await UserRecruteur.findOne({ _id: req.params.userId }).lean()
      const loggedUser = getUserFromRequest(req, zRoutes.get["/user/:userId"]).value

      let jobs: IJob[] = []

      if (!user) throw Boom.badRequest()

      if (user.type === ENTREPRISE) {
        const response = await Recruiter.findOne({ establishment_id: user.establishment_id as string })
          .select({ jobs: 1, _id: 0 })
          .lean()
        if (!response) {
          throw Boom.internal("Get establishement from user failed to fetch", { userId: user._id })
        }
        jobs = response.jobs
      }

      // remove status data if not authorized to see it, else get identity
      if ([ENTREPRISE, CFA].includes(loggedUser.type)) {
        user.status = []
      } else {
        user.status = await getValidatorIdentityFromStatus(user.status)
      }

      return res.status(200).send({ ...user, jobs })
    }
  )

  server.get(
    "/user/status/:userId",
    {
      schema: zRoutes.get["/user/status/:userId"],
      onRequest: [server.auth(zRoutes.get["/user/status/:userId"])],
    },
    async (req, res) => {
      const user = await UserRecruteur.findOne({ _id: req.params.userId }).lean()

      if (!user) throw Boom.notFound("User not found")
      const status_current = getUserStatus(user.status)
      if (!status_current) throw Boom.internal("User doesn't have status")

      return res.status(200).send({ status_current })
    }
  )

  server.put(
    "/user/:userId",
    {
      schema: zRoutes.put["/user/:userId"],
      onRequest: [server.auth(zRoutes.put["/user/:userId"])],
    },
    async (req, res) => {
      const { email, ...userPayload } = req.body
      const { userId } = req.params

      const formattedEmail = email?.toLocaleLowerCase()

      const exist = await UserRecruteur.findOne({ email: formattedEmail, _id: { $ne: userId } }).lean()

      if (exist) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }

      const update = { email: formattedEmail, ...userPayload }

      const user = await updateUser({ _id: userId }, update)
      return res.status(200).send(user)
    }
  )

  server.put(
    "/user/:userId/history",
    {
      schema: zRoutes.put["/user/:userId/history"],
      onRequest: [server.auth(zRoutes.put["/user/:userId/history"])],
    },
    async (req, res) => {
      const history = req.body
      const validator = getUserFromRequest(req, zRoutes.put["/user/:userId/history"]).value
      const user = await updateUserValidationHistory(req.params.userId, { ...history, user: validator._id.toString() })

      if (!user) throw Boom.badRequest()

      const { email, last_name, first_name } = user

      // if user is disabled, return the user data directly
      if (history.status === ETAT_UTILISATEUR.DESACTIVE) {
        // send email to user to notify him his account has been disabled
        await mailer.sendEmail({
          to: email,
          subject: "Votre compte a été désactivé sur La bonne alternance",
          template: getStaticFilePath("./templates/mail-compte-desactive.mjml.ejs"),
          data: {
            images: {
              accountDisabled: `${config.publicUrl}/images/image-compte-desactive.png?raw=true`,
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            },
            last_name,
            first_name,
            reason: history.reason,
            emailSupport: "mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Compte%20pro%20non%20validé",
          },
          disableSanitize: {
            images: {
              accountDisabled: true,
              logoLba: true,
            },
            emailSupport: true,
          },
        })
        return res.status(200).send(user)
      }

      /**
       * 20230831 kevin todo: share reason between front and back with shared folder
       */
      // if user isn't part of the OPCO, just send the user straigth back
      if (history.reason === "Ne relève pas des champs de compétences de mon OPCO") {
        return res.status(200).send(user)
      }

      if (user.type === ENTREPRISE) {
        const { establishment_id } = user
        if (!establishment_id) {
          throw Boom.internal("unexpected: no establishment_id on userRecruteur of type ENTREPRISE", { userId: user._id })
        }
        /**
         * if entreprise type of user is validated :
         * - activate offer
         * - update expiration date to one month later
         * - send email to delegation if available
         */
        const userFormulaire = await getFormulaire({ establishment_id })

        if (userFormulaire.status === RECRUITER_STATUS.ARCHIVE) {
          // le recruiter étant archivé on se contente de le rendre de nouveau Actif
          await reactivateRecruiter(establishment_id)
        } else {
          // le compte se trouve validé, on procède à l'activation de la première offre et à la notification aux CFAs
          if (userFormulaire?.jobs?.length) {
            await activateEntrepriseRecruiterForTheFirstTime(userFormulaire)
          }
        }
      }

      // validate user email addresse
      await updateUser({ _id: user._id }, { is_email_checked: true })
      await sendWelcomeEmailToUserRecruteur(user)
      return res.status(200).send(user)
    }
  )

  server.delete(
    "/user",
    {
      schema: zRoutes.delete["/user"],
      onRequest: [server.auth(zRoutes.delete["/user"])],
    },
    async (req, res) => {
      const { userId, recruiterId } = req.query

      await removeUser(userId)

      if (recruiterId) {
        await deleteFormulaire(recruiterId)
      }
      await stopSession(req, res)
      return res.status(200).send({})
    }
  )
}
