import { User2, NewUser, UserEventType, UserStatusEvent, NewUserStatusEvent } from "../../common/model/schema/multiCompte/user2.types.js"
import { EntityRepository } from "../../common/model/generic/EntityRepository.js"
import { Entity } from "../../common/model/generic/Entity.js"
import { AccessAuthorizationService } from "./accessAuthorization.service.js"
import { BusinessErrorCodes, VALIDATION_UTILISATEUR, errorFactory } from "../../services/constant.service.js"
import { sendUserConfirmationEmail } from "../../services/etablissement.service.js"
import config from "../../config.js"
import { createMagicLinkToken } from "../../common/utils/jwtUtils.js"
import mailer from "../../services/mailer.service.js"
import { mailTemplate } from "../../assets/index.js"

export class User2Service {
  constructor(private readonly userRepository: EntityRepository<User2>, private readonly accessAuthorizationService: AccessAuthorizationService) {}

  async create(newUser: NewUser) {
    const userOpt = await this.findByEmail(newUser.email)
    if (userOpt) {
      return errorFactory("L'utilisateur existe déjà", BusinessErrorCodes.ALREADY_EXISTS)
    }
    const entityBase = Entity.new()
    const formatedEmail = this.formatEmail(newUser.email)
    const user: User2 = {
      ...entityBase,
      ...newUser,
      lastConnection: new Date(),
      email: formatedEmail,
      history: [],
    }
    return this.userRepository.create(user)
  }
  private async canLogin(email: string) {
    const userOpt = await this.findByEmail(email)
    if (!userOpt) {
      return errorFactory("L'utilisateur n'existe pas", BusinessErrorCodes.DOES_NOT_EXIST)
    }
    if (this.isInactif(userOpt)) {
      return errorFactory("Utilisateur inactif", BusinessErrorCodes.DISABLED)
    }
    if (userOpt.isAdmin || userOpt.opco) {
      return { user: userOpt }
    }
    const allAccess = await this.accessAuthorizationService.getAccessFor(userOpt.id)
    if (!allAccess.length) {
      return errorFactory("Utilisateur sans droits")
    }
    return { user: userOpt, access: allAccess }
  }
  async login(email: string) {
    const loginAuthorization = await this.canLogin(email)
    if ("error" in loginAuthorization) {
      return loginAuthorization
    }
    const { user, access } = loginAuthorization
    await this.userRepository.update(user.id, { lastConnection: new Date() })
    if (this.hasUserValidatedEmail(user)) {
      await this.sendLoginMail(user)
      return { user, access }
    } else {
      await sendUserConfirmationEmail({
        email: user.email,
        firstName: user.firstname,
        lastName: user.lastname,
        userRecruteurId: user.id,
      })
      return errorFactory("Utilisateur en attente de validation de son email")
    }
  }
  validateEmail(id: string) {
    return this.addEvent(id, newServerUserEvent({ reason: "validation email", status: UserEventType.VALIDATION_EMAIL }))
  }
  async addEvent(id: string, event: NewUserStatusEvent) {
    const userOpt = await this.userRepository.findById(id)
    if (!userOpt) {
      return errorFactory("L'utilisateur n'existe pas", BusinessErrorCodes.DOES_NOT_EXIST)
    }
    userOpt.history.push({ ...event, date: new Date() })
    await this.userRepository.update(id, { history: userOpt.history })
  }
  private isInactif(user: User2) {
    return this.getLastStatus(user) === UserEventType.INACTIF
  }
  private findByEmail(email: string) {
    return this.userRepository.findOneBy({ email: this.formatEmail(email) })
  }
  private formatEmail(email: string) {
    return email.toLocaleLowerCase()
  }
  private getLastStatus({ history }: User2) {
    const lastEvent = history.at(history.length - 1)
    return lastEvent?.status
  }
  private hasUserValidatedEmail(user: User2) {
    return user.history.some(({ status }) => status === UserEventType.VALIDATION_EMAIL)
  }
  private async sendLoginMail(user: User2) {
    const { email, lastname, firstname } = user
    const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(email)}`
    await mailer.sendEmail({
      to: email,
      subject: "Lien de connexion",
      template: mailTemplate["mail-connexion"],
      data: {
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
        },
        last_name: lastname,
        first_name: firstname,
        connexion_url: magiclink,
      },
    })
  }
}

export function newServerUserEvent({ reason, status }: Omit<NewUserStatusEvent, "grantedBy" | "validation_type">) {
  return {
    reason,
    status,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    grantedBy: "server",
  }
}
export function newManualUserEvent({ reason, status, grantedBy }: Omit<NewUserStatusEvent, "validation_type">) {
  return {
    reason,
    status,
    grantedBy,
    validation_type: VALIDATION_UTILISATEUR.MANUAL,
  }
}
