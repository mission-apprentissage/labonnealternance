import { User2, NewUser } from "../common/model/schema/multiCompte/user2.types.js"
import { EntityRepository } from "../common/model/generic/EntityRepository.js"
import { Entity } from "../common/model/generic/Entity.js"

export class UserUnifiedService {
  constructor(private readonly userRepository: EntityRepository<User2>) {}

  async create(newUser: NewUser) {
    const userOpt = await this.findByEmail(newUser.email)
    if (userOpt) {
      throw new Error("User already exists")
    }
    const entityBase = Entity.new()
    const formatedEmail = this.formatEmail(newUser.email)
    const user: User2 = { ...entityBase, ...newUser, hasUserValidatedEmail: false, lastConnection: new Date(), email: formatedEmail }
    await this.userRepository.create(user)
    return user
  }
  async canConnect(email: string) {
    const userOpt = await this.findByEmail(email)
    if (!userOpt) {
      return false
    }
    return userOpt.hasUserValidatedEmail
  }
  private findByEmail(email: string) {
    return this.userRepository.findOneBy({ email: this.formatEmail(email) })
  }
  private formatEmail(email: string) {
    return email.toLocaleLowerCase()
  }
}
