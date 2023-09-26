import Boom from "boom"
import { IJob, zRoutes } from "shared/index"

import { Recruiter, UserRecruteur } from "../../common/model/index"
import { getStaticFilePath } from "../../common/utils/getStaticFilePath"
import config from "../../config"
import { ENTREPRISE, ETAT_UTILISATEUR, JOB_STATUS, RECRUITER_STATUS } from "../../services/constant.service"
import dayjs from "../../services/dayjs.service"
import { deleteFormulaire, getFormulaire, reactivateRecruiter, sendDelegationMailToCFA, updateOffre } from "../../services/formulaire.service"
import mailer from "../../services/mailer.service"
import { createUser, removeUser, sendWelcomeEmailToUserRecruteur, updateUser, updateUserValidationHistory } from "../../services/userRecruteur.service"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/api/user/opco",
    {
      schema: zRoutes.get["/api/user/opco"],
      preHandler: [],
    },
    async (req, res) => {
      const { userQuery, formulaireQuery } = req.query

      const [users, formulaires] = await Promise.all([UserRecruteur.find(userQuery).lean(), Recruiter.find(formulaireQuery).lean()])

      const results = users.reduce((acc: any[], user) => {
        acc.push({ ...user, offres: 0 })

        const form = formulaires.find((x) => x.establishment_id === user.establishment_id)

        if (form) {
          const found = acc.findIndex((x) => x.establishment_id === form.establishment_id)

          if (found !== -1) {
            acc[found].jobs = form.jobs.length ?? 0
            acc[found].origin = form.origin
            acc[found].job_detail = form.jobs ?? []
          }
        }

        return acc
      }, [])

      return res.status(200).send(results)
    }
  )

  server.get(
    "/api/user",
    {
      schema: zRoutes.get["/api/user"],
      preHandler: [server.auth(zRoutes.get["/api/user"].securityScheme)],
    },
    async (req, res) => {
      const query = req.query.users
      // @ts-expect-error: TODO
      if (query?.$expr?.$eq[0]?.$arrayElemAt[1]) {
        // @ts-expect-error: TODO
        query.$expr.$eq[0].$arrayElemAt[1] = parseInt(query.$expr.$eq[0].$arrayElemAt[1])
      }
      const users = await UserRecruteur.find(query).lean()
      return res.status(200).send(users)

      /**
       * KBA 13/10/2022 : To reuse when frontend can deal with pagination
       * Quick fix made above for now
       */
      // let qs = req.query;
      // const query = qs && qs.query ? JSON.parse(qs.query) : {};
      // const options = qs && qs.options ? JSON.parse(qs.options) : {};
      // const page = qs && qs.page ? qs.page : 1;
      // const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 100;

      // const result = await getUsers(query, options, { page, limit });
      // return res.status(200).send(result);
    }
  )

  server.get(
    "/api/user/:userId",
    {
      schema: zRoutes.get["/api/user/:userId"],
      preHandler: [],
    },
    async (req, res) => {
      const user = await UserRecruteur.findOne({ _id: req.params.userId }).lean()
      let jobs: IJob[] = []

      if (!user) return res.status(400).send()

      if (user.type === ENTREPRISE) {
        const response = await Recruiter.findOne({ establishment_id: user.establishment_id }).select({ jobs: 1, _id: 0 }).lean()
        if (!response) {
          throw Boom.internal("Get establishement from user failed to fetch", { userId: user._id })
        }
        jobs = response.jobs
      }

      return res.status(200).send({ ...user, jobs })
    }
  )

  server.post(
    "/api/user",
    {
      schema: zRoutes.post["/api/user"],
      preHandler: [],
    },
    async (req, res) => {
      const user = await createUser(req.body)
      return res.status(200).send(user)
    }
  )

  server.put(
    "/api/user/:userId",
    {
      schema: zRoutes.put["/api/user/:userId"],
      preHandler: [],
    },
    async (req, res) => {
      const userPayload = req.body
      const { userId } = req.params

      const exist = await UserRecruteur.findOne({ email: userPayload.email, _id: { $ne: userId } }).lean()

      if (exist) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }

      const user = await updateUser({ _id: userId }, userPayload)
      return res.status(200).send(user)
    }
  )

  server.put(
    "/api/user/:userId/history",
    {
      schema: zRoutes.put["/api/user/:userId/history"],
      preHandler: [],
    },
    async (req, res) => {
      const history = req.body
      const user = await updateUserValidationHistory(req.params.userId, history)

      if (!user) return res.status(400).send()

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
              accountDisabled: `${config.publicUrlEspacePro}/images/image-compte-desactive.png?raw=true`,
              logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
            },
            last_name,
            first_name,
            email,
            reason: history.reason,
            emailSupport: "mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Compte%20pro%20non%20validé",
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
        /**
         * if entreprise type of user is validated :
         * - activate offer
         * - update expiration date to one month later
         * - send email to delegation if available
         */
        const userFormulaire = await getFormulaire({ establishment_id: user.establishment_id })

        if (userFormulaire.status === RECRUITER_STATUS.ARCHIVE) {
          // le recruiter étant archivé on se contente de le rendre de nouveau Actif
          await reactivateRecruiter(user.establishment_id)
        } else {
          // le compte se trouve validé et on procède à l'activation de la première offre et à la notification aux CFAs
          if (userFormulaire?.jobs?.length) {
            const job: IJob = Object.assign(userFormulaire.jobs[0], { job_status: JOB_STATUS.ACTIVE, job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD") })
            await updateOffre(job._id.toString(), job)

            if (job?.delegations && job?.delegations.length) {
              await Promise.all(
                job.delegations.map(
                  async (delegation) =>
                    // TODO NIMP
                    await sendDelegationMailToCFA(delegation.email as string, job, userFormulaire as any, delegation.siret_code as string)
                )
              )
            }
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
    "/api/user",
    {
      schema: zRoutes.delete["/api/user"],
      preHandler: [],
    },
    async (req, res) => {
      const { userId, recruiterId } = req.query

      await removeUser(userId)

      if (recruiterId) {
        await deleteFormulaire(recruiterId)
      }

      return res.status(200).send()
    }
  )
}
