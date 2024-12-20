import { badRequest, forbidden, internal, notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { ENTREPRISE } from "shared/constants"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { CFA, OPCOS_LABEL } from "shared/constants/recruteur"
import { IJob, IRecruiter, getUserStatus, parseEnum, parseEnumOrError, zRoutes } from "shared/index"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { stopSession } from "@/common/utils/session.service"
import { getUserFromRequest } from "@/security/authenticationService"
import { activateUserRole, deactivateUserRole, roleToUserType, entrepriseIsNotMyOpco } from "@/services/roleManagement.service"
import { createSuperUser } from "@/services/userWithAccount.service"

import { getDbCollection } from "../../common/utils/mongodbUtils"
import { deleteFormulaire, getFormulaireFromUserId, getFormulaireFromUserIdWithOpco } from "../../services/formulaire.service"
import { getUserAndRecruitersDataForOpcoUser, getUserNamesFromIds as getUsersFromIds } from "../../services/user.service"
import {
  getAdminUsers,
  getUserRecruteurById,
  getUsersForAdmin,
  removeUser,
  updateUserWithAccountFields,
  userAndRoleAndOrganizationToUserRecruteur,
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
      const userFromRequest = getUserFromRequest(req, zRoutes.get["/user/opco"]).value
      const opcoRole = await getDbCollection("rolemanagements").findOne({ authorized_type: AccessEntityType.OPCO, user_id: userFromRequest._id })
      if (!opcoRole) {
        throw forbidden("pas de role opco")
      }
      const opco = parseEnumOrError(OPCOS_LABEL, opcoRole.authorized_id)
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
      const groupedUsers = await getUsersForAdmin()
      return res.status(200).send(groupedUsers)
    }
  )
  server.get(
    "/admin/users",
    {
      schema: zRoutes.get["/admin/users"],
      onRequest: [server.auth(zRoutes.get["/admin/users"])],
    },
    async (_req, res) => {
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
      const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(userId) })
      if (!user) throw notFound(`user with id=${userId} not found`)
      const role = await getDbCollection("rolemanagements").findOne({ user_id: new ObjectId(userId), authorized_type: { $in: [AccessEntityType.ADMIN, AccessEntityType.OPCO] } })
      return res.status(200).send({ ...user, role: role ?? undefined })
    }
  )

  server.post(
    "/admin/users",
    {
      schema: zRoutes.post["/admin/users"],
      onRequest: [server.auth(zRoutes.post["/admin/users"])],
    },
    async (req, res) => {
      const userFields = req.body
      const userFromRequest = getUserFromRequest(req, zRoutes.post["/admin/users"]).value
      const user = await createSuperUser(userFields, {
        grantedBy: userFromRequest._id.toString(),
        origin: "création par l'interface admin",
      })
      return res.status(200).send({ _id: user._id })
    }
  )

  server.put(
    "/admin/users/:userId",
    {
      schema: zRoutes.put["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.put["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { userId } = req.params
      const { ...userFields } = req.body

      const result = await updateUserWithAccountFields(userId, userFields)
      if ("error" in result) {
        throw badRequest("L'email est déjà utilisé", { error: BusinessErrorCodes.EMAIL_ALREADY_EXISTS })
      }

      return res.status(200).send({ ok: true })
    }
  )

  server.put(
    "/admin/users/:userId/organization/:siret",
    {
      schema: zRoutes.put["/admin/users/:userId/organization/:siret"],
      onRequest: [server.auth(zRoutes.put["/admin/users/:userId/organization/:siret"])],
    },
    async (req, res) => {
      const { userAccess } = req
      const { userId, siret } = req.params
      // eslint-disable-next-line prefer-const
      let { opco, ...userFields } = req.body
      // restreint la modification de l opco aux opcos et admin
      if (!(userAccess?.admin || userAccess?.opcos.length)) {
        opco = undefined
      }

      const entreprise = await getDbCollection("entreprises").findOne({ siret })

      if (entreprise) {
        const roleManagement = await getDbCollection("rolemanagements").findOne({
          user_id: userId,
          authorized_id: entreprise._id.toString(),
          authorized_type: AccessEntityType.ENTREPRISE,
        })
        if (!roleManagement) {
          throw forbidden("L'entreprise n'est pas gérée par l'utilisateur cible", { error: BusinessErrorCodes.UNSUPPORTED })
        }
      } else {
        const cfa = await getDbCollection("cfas").findOne({ siret })
        if (cfa) {
          const roleManagement = await getDbCollection("rolemanagements").findOne({
            user_id: userId,
            authorized_id: cfa._id.toString(),
            authorized_type: AccessEntityType.CFA,
          })
          if (!roleManagement) {
            throw forbidden("Le CFA n'est pas géré par l'utilisateur cible", { error: BusinessErrorCodes.UNSUPPORTED })
          }
        } else {
          throw notFound("Etablissement non trouvé", { error: BusinessErrorCodes.NOTFOUND })
        }
      }

      const result = await updateUserWithAccountFields(userId, userFields)
      if ("error" in result) {
        throw badRequest(result.error === BusinessErrorCodes.EMAIL_ALREADY_EXISTS ? "L'email est déjà utilisé" : "Erreur business", { error: result.error })
      }

      if (opco && entreprise) {
        await getDbCollection("entreprises").findOneAndUpdate({ siret }, { $set: { opco, updatedAt: new Date() } })
        await getDbCollection("recruiters").updateMany({ establishment_siret: siret }, { $set: { opco, updatedAt: new Date() } })
      }

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
    "/user/:userId/organization/:organizationId",
    {
      schema: zRoutes.get["/user/:userId/organization/:organizationId"],
      onRequest: [server.auth(zRoutes.get["/user/:userId/organization/:organizationId"])],
    },
    async (req, res) => {
      const requestUser = getUserFromRequest(req, zRoutes.get["/user/:userId/organization/:organizationId"]).value
      if (!requestUser) throw badRequest()

      const { userId } = req.params
      const role = await getDbCollection("rolemanagements").findOne({
        user_id: new ObjectId(userId),
        // TODO à activer lorsque le frontend passe organizationId correctement
        // authorized_id: organizationId,
      })
      if (!role) {
        throw badRequest("role not found")
      }
      const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(userId) })
      if (!user) {
        throw badRequest("user not found")
      }
      const type = roleToUserType(role)

      if (!type) {
        throw internal("user type not found")
      }

      let organization: ICFA | IEntreprise | null = null
      if (type === CFA || type === ENTREPRISE) {
        organization = await getDbCollection(type === CFA ? "cfas" : "entreprises").findOne({ _id: new ObjectId(role.authorized_id) })
        if (!organization) {
          throw internal(`inattendu : impossible de trouver l'organization avec id=${role.authorized_id}`)
        }
      }

      let jobs: IJob[] = []
      let formulaire: IRecruiter | null = null

      const opcoOrAdminRole = await getDbCollection("rolemanagements").findOne({
        user_id: requestUser._id,
        authorized_type: { $in: [AccessEntityType.ADMIN, AccessEntityType.OPCO] },
      })

      const opco: OPCOS_LABEL | null = opcoOrAdminRole?.authorized_type === AccessEntityType.OPCO ? parseEnum(OPCOS_LABEL, opcoOrAdminRole.authorized_id) : null

      if (type === ENTREPRISE) {
        formulaire = opco ? await getFormulaireFromUserIdWithOpco(userId, opco) : await getFormulaireFromUserId(userId)
        jobs = formulaire?.jobs ?? []
      }

      const userRecruteur = userAndRoleAndOrganizationToUserRecruteur(user, role, organization, formulaire)

      if (opcoOrAdminRole && getLastStatusEvent(opcoOrAdminRole.status)?.status === AccessStatus.GRANTED) {
        const userIds = userRecruteur.status.flatMap(({ user }) => (user ? [user] : []))
        const users = await getUsersFromIds(userIds)
        userRecruteur.status.forEach((event) => {
          const user = users.find((user) => user._id.toString() === event.user)
          if (!user) return
          event.user = `${user.first_name} ${user.last_name}`
        })
      }
      return res.status(200).send({ ...userRecruteur, jobs })
    }
  )

  server.get(
    "/user/status/:userId",
    {
      schema: zRoutes.get["/user/status/:userId"],
      onRequest: [server.auth(zRoutes.get["/user/status/:userId"])],
    },
    async (req, res) => {
      const user = await getUserRecruteurById(req.params.userId)

      if (!user) throw notFound("User not found")
      const status_current = getUserStatus(user.status)
      if (!status_current) throw internal("User doesn't have status")

      return res.status(200).send({ status_current })
    }
  )

  server.get(
    "/user/status/:userId/by-token",
    {
      schema: zRoutes.get["/user/status/:userId/by-token"],
      onRequest: [server.auth(zRoutes.get["/user/status/:userId/by-token"])],
    },
    async (req, res) => {
      const user = await getUserRecruteurById(req.params.userId)

      if (!user) throw notFound("User not found")
      const status_current = getUserStatus(user.status)
      if (!status_current) throw internal("User doesn't have status")

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
      const { userId } = req.params
      const result = await updateUserWithAccountFields(userId, req.body)

      if ("error" in result) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }
      return res.status(200).send({})
    }
  )

  server.post(
    "/user/:userId/organization/:organizationId/deactivate",
    {
      schema: zRoutes.post["/user/:userId/organization/:organizationId/deactivate"],
      onRequest: [server.auth(zRoutes.post["/user/:userId/organization/:organizationId/deactivate"])],
    },
    async (req, res) => {
      const { reason } = req.body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, organizationId } = req.params
      const requestUser = getUserFromRequest(req, zRoutes.post["/user/:userId/organization/:organizationId/deactivate"]).value
      if (!requestUser) throw badRequest()
      await deactivateUserRole({
        reason,
        userId,
        requestedBy: requestUser,
      })
      return res.status(200).send({})
    }
  )

  server.post(
    "/user/:userId/organization/:organizationId/activate",
    {
      schema: zRoutes.post["/user/:userId/organization/:organizationId/activate"],
      onRequest: [server.auth(zRoutes.post["/user/:userId/organization/:organizationId/activate"])],
    },
    async (req, res) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, organizationId } = req.params
      const requestUser = getUserFromRequest(req, zRoutes.post["/user/:userId/organization/:organizationId/activate"]).value
      if (!requestUser) throw badRequest()
      await activateUserRole({
        userId,
        requestedBy: requestUser,
      })
      return res.status(200).send({})
    }
  )

  server.post(
    "/user/:userId/organization/:organizationId/not-my-opco",
    {
      schema: zRoutes.post["/user/:userId/organization/:organizationId/not-my-opco"],
      onRequest: [server.auth(zRoutes.post["/user/:userId/organization/:organizationId/not-my-opco"])],
    },
    async (req, res) => {
      const { reason } = req.body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, organizationId } = req.params
      const requestUser = getUserFromRequest(req, zRoutes.post["/user/:userId/organization/:organizationId/not-my-opco"]).value
      if (!requestUser) throw badRequest()
      await entrepriseIsNotMyOpco({
        reason,
        requestedBy: requestUser,
        userId,
      })
      return res.status(200).send({})
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
