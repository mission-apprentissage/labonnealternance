import { groupBy } from "lodash-es"
import { EntityRepository } from "../../common/model/generic/EntityRepository.js"
import { RoleManagement, RoleManagementEvent, AccessEntityType, AccessStatus, NewRoleManagement } from "../../common/model/schema/multiCompte/roleManagement.types.js"

export class AccessAuthorizationService {
  constructor(private readonly accessAuthorizationRepository: EntityRepository<RoleManagement>) {}

  async add({
    accessed_id: accessedId,
    accessed_type: accessedType,
    accessor_id: accessorId,
    accessor_type: accessorType,
    reason,
    status,
    validation_type,
    granted_by: grantedBy,
  }: NewRoleManagement) {
    let authorization = await this.accessAuthorizationRepository.findOneBy({
      accessed_id: accessedId,
      accessed_type: accessedType,
      accessor_id: accessorId,
      accessor_type: accessorType,
    })
    const newHistoryEvent: RoleManagementEvent = {
      reason,
      date: new Date(),
      status,
      validation_type,
      granted_by: grantedBy,
    }
    if (authorization) {
      authorization.history.push(newHistoryEvent)
      await this.accessAuthorizationRepository.update(authorization._id, {
        history: authorization.history,
      })
    } else {
      authorization = await this.accessAuthorizationRepository.create({
        accessed_id: accessedId,
        accessed_type: accessedType,
        accessor_id: accessorId,
        accessor_type: accessorType,
        history: [newHistoryEvent],
      })
    }
    return authorization
  }
  async getAccessFor(id: string, entityType = AccessEntityType.USER) {
    const authorizations = await this.accessAuthorizationRepository.findBy({ accessed_id: id, accessed_type: entityType })
    const validAuthorizations = authorizations.filter((authorization) => this.getLastEvent(authorization)?.status === AccessStatus.GRANTED)
    const groups = groupBy(validAuthorizations, ({ accessed_id: accessedId, accessed_type: accessedType }) => `${accessedType}_${accessedId}`)
    return Object.values(groups).map(([{ accessed_id: accessedId, accessor_type: accessorType }]) => ({ accessedId, accessorType }))
  }
  private getLastEvent({ history }: RoleManagement) {
    return history.at(history.length - 1)
  }
}
