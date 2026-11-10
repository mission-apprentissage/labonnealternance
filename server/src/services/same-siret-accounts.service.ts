import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { OPCOS_LABEL } from "shared/constants/recruteur"
import type { ICFA } from "shared/models/cfa.model"
import type { IEntreprise } from "shared/models/entreprise.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRoleManagement } from "shared/models/role-management.model"
import { AccessEntityType } from "shared/models/role-management.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import type { ISameSiretAccount, SameSiretAccountMatch } from "shared/routes/user.routes"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { userAndRoleAndOrganizationToUserRecruteur } from "@/services/user-recruteur.service"

// Les 9 derniers chiffres neutralisent l'indicatif : « +33 6… », « 0033 6… » et « 06… » désignent la même ligne.
const normalizePhone = (phone: string | null | undefined) => {
  const digits = (phone ?? "").replace(/\D/g, "")
  return digits.length >= 9 ? digits.slice(-9) : null
}

const normalizeName = (name: string | null | undefined) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s'-]+/g, " ")
    .trim()
    .toLowerCase()

type ContactFields = Pick<IUserWithAccount, "first_name" | "last_name" | "phone">

export const getAccountMatches = (target: ContactFields, other: ContactFields): SameSiretAccountMatch[] => {
  const matches: SameSiretAccountMatch[] = []
  const targetPhone = normalizePhone(target.phone)
  if (targetPhone && targetPhone === normalizePhone(other.phone)) {
    matches.push("phone")
  }
  const [targetFirst, targetLast, otherFirst, otherLast] = [target.first_name, target.last_name, other.first_name, other.last_name].map(normalizeName)
  const sameName = (targetFirst === otherFirst && targetLast === otherLast) || (targetFirst === otherLast && targetLast === otherFirst)
  if (targetFirst && targetLast && sameName) {
    matches.push("name")
  }
  return matches
}

/**
 * `entreprises.siret` et `cfas.siret` sont uniques : les comptes d'un même SIRET partagent le même `authorized_id`.
 * Pour un OPCO, seules les offres de son OPCO sont comptées, comme dans `getUserAndRecruitersDataForOpcoUser`.
 */
export const getSameSiretAccounts = async ({ role, opcos }: { role: IRoleManagement; opcos: OPCOS_LABEL[] | null }): Promise<ISameSiretAccount[]> => {
  const { authorized_type, authorized_id } = role
  if (authorized_type !== AccessEntityType.ENTREPRISE && authorized_type !== AccessEntityType.CFA) {
    return []
  }

  const organization: ICFA | IEntreprise | null = await getDbCollection(authorized_type === AccessEntityType.CFA ? "cfas" : "entreprises").findOne({
    _id: new ObjectId(authorized_id),
  })
  if (!organization) {
    throw internal(`inattendu : impossible de trouver l'organization avec id=${authorized_id}`)
  }

  const otherRoles = await getDbCollection("rolemanagements")
    .find({ authorized_id, authorized_type, user_id: { $ne: role.user_id } })
    .toArray()
  if (!otherRoles.length) {
    return []
  }

  const userIds = otherRoles.map(({ user_id }) => user_id)
  const [targetUser, users, jobsCounts] = await Promise.all([
    getDbCollection("userswithaccounts").findOne({ _id: role.user_id }),
    getDbCollection("userswithaccounts")
      .find({ _id: { $in: userIds } })
      .toArray(),
    getDbCollection("jobs_partners")
      .aggregate<{ _id: ObjectId; count: number }>([
        {
          $match: {
            managed_by: { $in: userIds },
            workplace_siret: organization.siret,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            ...(opcos ? { workplace_opco: { $in: opcos } } : {}),
          },
        },
        { $group: { _id: "$managed_by", count: { $sum: 1 } } },
      ])
      .toArray(),
  ])

  const usersById = new Map(users.map((user) => [user._id.toString(), user]))
  const jobsCountByUserId = new Map(jobsCounts.map(({ _id, count }) => [_id.toString(), count]))

  return otherRoles
    .flatMap((otherRole): ISameSiretAccount[] => {
      const user = usersById.get(otherRole.user_id.toString())
      if (!user) return []
      // Statut calculé comme sur la fiche du compte (DetailEntreprise lit le dernier élément de `status`).
      const lastStatus = userAndRoleAndOrganizationToUserRecruteur(user, otherRole, organization).status.at(-1)
      if (!lastStatus?.status) return []
      return [
        {
          _id: user._id,
          organizationId: authorized_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          createdAt: otherRole.createdAt,
          status: lastStatus.status,
          status_date: lastStatus.date ?? null,
          status_reason: lastStatus.reason || null,
          last_action_date: user.last_action_date ?? null,
          jobs_count: jobsCountByUserId.get(user._id.toString()) ?? 0,
          matches: targetUser ? getAccountMatches(targetUser, user) : [],
        },
      ]
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
