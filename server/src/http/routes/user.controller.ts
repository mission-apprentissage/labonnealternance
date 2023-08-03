import express from "express"
import { deleteFormulaire, getFormulaire, sendCFADelegationMail, updateOffre } from "../../services/formulaire.service.js"
import { mailTemplate } from "../../assets/index.js"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../services/constant.service.js"
import dayjs from "../../services/dayjs.service.js"
import { Recruiter, UserRecruteur } from "../../common/model/index.js"
import { createMagicLinkToken } from "../../common/utils/jwtUtils.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { createUser, updateUser, updateUserValidationHistory, removeUser } from "../../services/userRecruteur.service.js"
import mailer from "../../services/mailer.service.js"

export default () => {
  const router = express.Router()

  router.get(
    "/opco",
    tryCatch(async (req, res) => {
      const userQuery = JSON.parse(req.query.userQuery)
      const formulaireQuery = JSON.parse(req.query.formulaireQuery)

      const [users, formulaires] = await Promise.all([UserRecruteur.find(userQuery).lean(), Recruiter.find(formulaireQuery).lean()])

      const results = users.reduce((acc, user) => {
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

      return res.json(results)
    })
  )

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const query = JSON.parse(req.query.users)

      const users = await UserRecruteur.find(query).lean()

      return res.json(users)

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
      // return res.json(result);
    })
  )

  router.get(
    "/:userId",
    tryCatch(async (req, res) => {
      const users = await UserRecruteur.findOne({ _id: req.params.userId }).lean()
      let formulaire

      if (users.type === ENTREPRISE) {
        formulaire = await Recruiter.findOne({ establishment_id: users.establishment_id }).select({ jobs: 1, _id: 0 }).lean()
      }

      return res.json({ ...users, ...formulaire })
    })
  )

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const user = await createUser(req.body)
      return res.json(user)
    })
  )

  router.put(
    "/:userId",
    tryCatch(async (req, res) => {
      const userPayload = req.body
      const { userId } = req.params

      const exist = await UserRecruteur.findOne({ email: userPayload.email, _id: { $ne: userId } }).lean()

      if (exist) {
        return res.status(400).json({ error: true, reason: "EMAIL_TAKEN" })
      }

      const user = await updateUser({ _id: userId }, userPayload)
      return res.json(user)
    })
  )

  router.put(
    "/:userId/history",
    tryCatch(async (req, res) => {
      const history = req.body
      const user = await updateUserValidationHistory(req.params.userId, history)

      // if user is disable, return the user data directly
      if (history.status === ETAT_UTILISATEUR.DESACTIVE) {
        return res.json(user)
      }

      if (user.type === ENTREPRISE) {
        /**
         * if entreprise type of user is validated :
         * - activate offer
         * - update expiration date to one month later
         * - send email to delegation if available
         */
        const userFormulaire = await getFormulaire({ establishment_id: user.establishment_id })
        const job = Object.assign(userFormulaire.jobs[0], { job_status: "Active", job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD") })
        await updateOffre(job._id, job)

        if (job?.delegations && job?.delegations.length) {
          await Promise.all(job.delegations.map(async (delegation) => await sendCFADelegationMail(delegation.email, job, userFormulaire, delegation.siret_code)))
        }
      }

      // validate user email addresse
      await updateUser({ _id: user._id }, { is_email_checked: true })

      // get magiclink url
      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(user.email)}`

      const { email, last_name, first_name, establishment_raison_sociale } = user

      // send welcome email to user
      await mailer.sendEmail({
        to: email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          last_name,
          first_name,
          establishment_raison_sociale,
          email,
          is_delegated: user.type === CFA,
          url: magiclink,
        },
      })

      return res.json(user)
    })
  )

  router.delete(
    "/",
    tryCatch(async (req, res) => {
      const { userId, recruiterId } = req.query

      await removeUser(userId)

      if (recruiterId) {
        await deleteFormulaire(recruiterId)
      }

      return res.sendStatus(200)
    })
  )

  return router
}
