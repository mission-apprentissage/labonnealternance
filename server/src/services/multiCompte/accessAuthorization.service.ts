import { groupBy } from "lodash-es"
import { Entity } from "../../common/model/generic/Entity.js"
import { EntityRepository } from "../../common/model/generic/EntityRepository.js"
import {
  AccessAuthorization,
  AccessAuthorizationEvent,
  AccessEntityType,
  AccessStatus,
  NewAccessAuthorization,
} from "../../common/model/schema/multiCompte/accessAuthorization.types.js"

export class AccessAuthorizationService {
  constructor(private readonly accessAuthorizationRepository: EntityRepository<AccessAuthorization>) {}

  async add({ accessedId, accessedType, accessorId, accessorType, reason, status, validation_type, grantedBy }: NewAccessAuthorization) {
    let authorization = await this.accessAuthorizationRepository.findOneBy({ accessedId, accessedType, accessorId, accessorType })
    const newHistoryEvent: AccessAuthorizationEvent = {
      reason,
      date: new Date(),
      status,
      validation_type,
      grantedBy,
    }
    if (authorization) {
      authorization.history.push(newHistoryEvent)
      await this.accessAuthorizationRepository.update(authorization.id, {
        history: authorization.history,
      })
    } else {
      authorization = await this.accessAuthorizationRepository.create({
        ...Entity.new(),
        accessedId,
        accessedType,
        accessorId,
        accessorType,
        history: [newHistoryEvent],
      })
    }
    return authorization
  }
  async getAccessFor(id: string, entityType = AccessEntityType.USER) {
    const authorizations = await this.accessAuthorizationRepository.findBy({ accessedId: id, accessedType: entityType })
    const validAuthorizations = authorizations.filter((authorization) => this.getLastEvent(authorization)?.status === AccessStatus.GRANTED)
    const groups = groupBy(validAuthorizations, ({ accessedId, accessedType }) => `${accessedType}_${accessedId}`)
    return Object.values(groups).map(([{ accessedId, accessorType }]) => ({ accessedId, accessorType }))
  }
  private getLastEvent({ history }: AccessAuthorization) {
    return history.at(history.length - 1)
  }
}
