import { useMongo } from "@tests/utils/mongo.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveAdminUserTest,
  saveCfaUserTest,
  saveEntrepriseUserTest,
  validatedUserStatus,
} from "@tests/utils/user.test.utils"
import type { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessStatus } from "shared/models/index"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { sendEmailConfirmationEntreprise } from "./etablissement.service"
import { archiveDelegatedFormulaire } from "./formulaire.service"
import mailer from "./mailer.service"
import { activateUserRole, deactivateUserRole } from "./role-management.service"

vi.mock("./mailer.service", () => ({ default: { sendEmail: vi.fn().mockResolvedValue({}) } }))

useMongo()

const ENTREPRISE_SIRET = "11000001500013"

const saveOffer = async (managedBy: ObjectId, siret: string, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
  const offer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    managed_by: managedBy,
    workplace_siret: siret,
    offer_status_history: [],
    ...overrides,
  })
  await getDbCollection("jobs_partners").insertOne(offer)
  return offer
}

const getStatus = async (offer: IJobsPartnersOfferPrivate) => (await getDbCollection("jobs_partners").findOne({ _id: offer._id }))?.offer_status
const sentSubjects = () => vi.mocked(mailer.sendEmail).mock.calls.map(([{ subject }]) => subject)

const saveAwaitingAccount = () =>
  saveEntrepriseUserTest(
    { status: validatedUserStatus },
    { status: [roleManagementEventFactory({ status: AccessStatus.AWAITING_VALIDATION })] },
    { siret: ENTREPRISE_SIRET, status: [entrepriseStatusEventFactory()] }
  )

beforeEach(() => {
  vi.mocked(mailer.sendEmail).mockClear()
})

describe("validation d'un compte en attente (#5498)", () => {
  afterEach(() => {
    config.moderation.enforce = false
  })

  it("publie l'offre en attente avec son mail, et laisse l'offre en modération", async () => {
    config.moderation.enforce = true
    const { user, entreprise } = await saveAwaitingAccount()
    const pending = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, offer_title: "Offre conforme" })
    const inReview = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, offer_title: "Offre bloquée" })
    const { user: admin } = await saveAdminUserTest({ status: validatedUserStatus })

    await activateUserRole({ userId: user._id, organizationId: entreprise._id.toString(), requestedBy: admin })

    expect(await getStatus(pending)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect(await getStatus(inReview)).toBe(JOB_STATUS_ENGLISH.EN_MODERATION)
    expect(sentSubjects()).toEqual(["Bienvenue sur La bonne alternance", expect.stringContaining("est publiée")])
  })

  it("n'envoie pas de mail par offre quand le blocage est désactivé", async () => {
    const { user, entreprise } = await saveAwaitingAccount()
    const pending = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    const { user: admin } = await saveAdminUserTest({ status: validatedUserStatus })

    await activateUserRole({ userId: user._id, organizationId: entreprise._id.toString(), requestedBy: admin })

    expect(await getStatus(pending)).toBe(JOB_STATUS_ENGLISH.ACTIVE)
    expect(sentSubjects()).toEqual(["Bienvenue sur La bonne alternance"])
  })
})

describe("désactivation d'un compte", () => {
  it("annule les offres en attente et en modération, avec le seul mail de désactivation", async () => {
    const { user, entreprise } = await saveAwaitingAccount()
    const pending = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE })
    const inReview = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION })
    const { user: admin } = await saveAdminUserTest({ status: validatedUserStatus })

    await deactivateUserRole({ reason: "test", userId: user._id, organizationId: entreprise._id.toString(), requestedBy: admin })

    expect(await getStatus(pending)).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect(await getStatus(inReview)).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect(sentSubjects()).toEqual(["Mise à jour de votre compte sur La bonne alternance"])
  })
})

describe("archiveDelegatedFormulaire", () => {
  it("annule les offres des entreprises gérées par le CFA", async () => {
    const { user, cfa, entreprise, entrepriseManagedByCfa } = await saveCfaUserTest({ status: validatedUserStatus }, {}, { siret: ENTREPRISE_SIRET })
    // Le lien CFA-entreprise a son propre identifiant : c'est entreprise_id qui désigne l'entreprise.
    expect(entrepriseManagedByCfa._id.toString()).not.toBe(entreprise._id.toString())
    const active = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.ACTIVE, is_delegated: true })
    const inReview = await saveOffer(user._id, entreprise.siret, { offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, is_delegated: true })

    await archiveDelegatedFormulaire(user._id, cfa._id)

    expect(await getStatus(active)).toBe(JOB_STATUS_ENGLISH.ANNULEE)
    expect(await getStatus(inReview)).toBe(JOB_STATUS_ENGLISH.ANNULEE)
  })
})

describe("mail de confirmation d'un compte créé avec sa première offre", () => {
  it.each([
    [JOB_STATUS_ENGLISH.ACTIVE, "./templates/mail-nouvelle-offre-depot-simplifie.mjml.ejs"],
    // Une offre en modération n'est pas annoncée : le mail ne confirme que l'adresse.
    [JOB_STATUS_ENGLISH.EN_MODERATION, "./templates/mail-confirmation-email.mjml.ejs"],
  ])("offre %s ⇒ %s", async (offer_status, template) => {
    const { user, entreprise } = await saveAwaitingAccount()
    await saveOffer(user._id, entreprise.siret, { offer_status, is_delegated: false })

    await sendEmailConfirmationEntreprise(user._id, AccessStatus.GRANTED, EntrepriseStatus.VALIDE)

    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ template: expect.stringContaining(template.slice(2)) }))
  })
})
