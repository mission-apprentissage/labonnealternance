import { mockApiEntreprise } from "@tests/mocks/mockApiEntreprise"
import { mockGeolocalisation } from "@tests/mocks/mockGeolocalisation"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveDbEntity, saveEntrepriseUserTest, validatedUserStatus } from "@tests/utils/user.test.utils"
import { omit } from "lodash-es"
import { ObjectId } from "mongodb"
import { AccessEntityType, AccessStatus, JOB_STATUS_ENGLISH, removeAccents } from "shared"
import { generateCfaFixture } from "shared/fixtures/cfa.fixture"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateJobFixture } from "shared/fixtures/recruiter.fixture"
import { generateRoleManagementFixture, generateRoleManagementStatusEventFixture } from "shared/fixtures/role-management.fixture"
import { generateReferentielRome } from "shared/fixtures/rome.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/user-with-account.fixture"
import type { ICFA } from "shared/models/cfa.model"
import type { IFormationCatalogue } from "shared/models/formation.model"
import { zFormationCatalogueSchema } from "shared/models/formation.model"
import type { IEntreprise, IJobCreate, IReferentielRome, IUserWithAccount } from "shared/models/index"
import { JOB_START_TYPE } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { checkForJobActivations, createJob, createJobDelegations, getCompetencesRomeFromPartnerJob, getFormulairesForCfaManagedEnterprises } from "./formulaire.service"
import mailer from "./mailer.service"

// Mock mailer service to avoid sending actual emails during tests
vi.mock("@/services/mailer.service", () => {
  return {
    default: {
      sendEmail: vi.fn().mockResolvedValue({ messageId: "test-message-id", accepted: ["test@example.com"] }),
      renderEmail: vi.fn().mockResolvedValue("<html>Test Email</html>"),
    },
  }
})

useMongo()

beforeEach(() => {
  vi.mocked(mailer.sendEmail).mockClear()
})

describe("createJob", () => {
  let user: IUserWithAccount
  let entreprise: IEntreprise
  let referentielRome: IReferentielRome

  beforeEach(async () => {
    const mockApiEntrepriseInstance = mockApiEntreprise.infosEntreprise()
    const mockGeolocalisationInstance = mockGeolocalisation()

    const email = "entreprise@mail.fr"
    entreprise = generateEntrepriseFixture()
    user = generateUserWithAccountFixture({
      _id: new ObjectId("670ce1ded6ce30c3c90a0e1d"),
      email,
    })
    const role = generateRoleManagementFixture({
      authorized_type: AccessEntityType.ENTREPRISE,
      authorized_id: entreprise._id.toString(),
      user_id: user._id,
    })
    referentielRome = generateReferentielRome()
    await getDbCollection("userswithaccounts").insertOne(user)
    await getDbCollection("referentielromes").insertOne(referentielRome)
    await getDbCollection("rolemanagements").insertOne(role)
    await getDbCollection("entreprises").insertOne(entreprise)

    return async () => {
      mockApiEntrepriseInstance.persist(false)
      mockGeolocalisationInstance.persist(false)
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("entreprises").deleteMany({})
      await getDbCollection("rolemanagements").deleteMany({})
      await getDbCollection("referentielromes").deleteMany({})
    }
  })

  const generateValidJobWritable = (): IJobCreate => {
    const fixture = generateJobFixture({
      job_start_type: JOB_START_TYPE.PRECISE_DATE,
      job_start_date_flexible: false,
      rome_code: [referentielRome.rome.code_rome],
      rome_label: referentielRome.rome.intitule,
      rome_appellation_label: referentielRome.appellations[0].libelle,
      competences_rome: {
        savoir_etre_professionnel: referentielRome.competences.savoir_etre_professionnel?.slice(0, 1),
        savoir_faire: referentielRome.competences.savoir_faire?.slice(0, 1),
        savoirs: referentielRome.competences.savoirs?.slice(0, 1),
      },
    })
    return {
      job_start_type: fixture.job_start_type ?? JOB_START_TYPE.PRECISE_DATE,
      job_start_date_flexible: Boolean(fixture.job_start_date_flexible),
      job_start_date: fixture.job_start_date,
      rome_code: fixture.rome_code,
      rome_label: fixture.rome_label,
      rome_appellation_label: fixture.rome_appellation_label,
      competences_rome: fixture.competences_rome,
      job_type: fixture.job_type,
      job_count: fixture.job_count,
      job_duration: fixture.job_duration,
      job_level_label: fixture.job_level_label,
      job_rythm: fixture.job_rythm,
      delegations: fixture.delegations,
      job_description: fixture.job_description,
      job_employer_description: fixture.job_employer_description,
      offer_title_custom: fixture.offer_title_custom,
      to_applicant_questions: fixture.to_applicant_questions,
      ft_support: fixture.ft_support ?? null,
    }
  }

  it("should insert a job", async () => {
    const job = generateValidJobWritable()
    const result = await createJob({ user, siret: entreprise.siret, job })

    expect
      .soft(omit(result, ["_id", "apply_recipient_id", "apply_url", "created_at", "lba_url", "offer_creation", "partner_job_id", "updated_at", "offer_expiration"]))
      .toMatchSnapshot()
  }, 20_000)

  it("should raise a bad request when savoir_etre_professionnel do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoir_etre_professionnel = [
      {
        code_ogr: "test",
        libelle: "test",
        coeur_metier: "test",
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when savoir_faire do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoir_faire = [
      {
        libelle: "test",
        items: [
          {
            code_ogr: "test",
            libelle: "test",
            coeur_metier: "test",
          },
        ],
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when savoirs do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.competences_rome!.savoirs = [
      {
        libelle: "test",
        items: [
          {
            code_ogr: "test",
            libelle: "test",
            coeur_metier: "test",
          },
        ],
      },
    ]
    await expect.soft(async () => createJob({ user, siret: entreprise.siret, job })).rejects.toThrow("compétences invalides")
  })
  it("should raise a bad request when rome_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_label = "test"
    await expect
      .soft(async () => createJob({ user, siret: entreprise.siret, job }))
      .rejects.toThrow(
        `L'intitulé du code ROME ne correspond pas au référentiel : ${removeAccents(referentielRome.rome.intitule.toLowerCase())}, reçu ${removeAccents(job.rome_label.toLowerCase())}`
      )
  })
  it("should raise a bad request when rome_appellation_label do not match referentiel rome", async () => {
    const job = generateValidJobWritable()
    job.rome_appellation_label = "test"
    await expect
      .soft(async () => createJob({ user, siret: entreprise.siret, job }))
      .rejects.toThrow(`L'appellation du code ROME ne correspond pas au référentiel : reçu ${removeAccents(job.rome_appellation_label.toLowerCase())}`)
  })
})

describe("getCompetencesRomeFromPartnerJob", () => {
  it("should reconstruct competences_rome from partner fields and rome_detail", () => {
    const referentielRome = generateReferentielRome()
    const selectedSavoirEtre = referentielRome.competences.savoir_etre_professionnel?.at(0)
    const selectedSavoirFaireCategory = referentielRome.competences.savoir_faire?.at(0)
    const selectedSavoirFaireItem = selectedSavoirFaireCategory?.items.at(0)
    const selectedSavoirsCategory = referentielRome.competences.savoirs?.at(0)
    const selectedSavoirsItem = selectedSavoirsCategory?.items.at(0)

    expect.soft(selectedSavoirEtre).toBeDefined()
    expect.soft(selectedSavoirFaireCategory).toBeDefined()
    expect.soft(selectedSavoirFaireItem).toBeDefined()
    expect.soft(selectedSavoirsCategory).toBeDefined()
    expect.soft(selectedSavoirsItem).toBeDefined()

    const partnerJob = {
      ...generateJobsPartnersOfferPrivate({
        offer_desired_skills: selectedSavoirEtre ? [selectedSavoirEtre.libelle] : [],
        offer_to_be_acquired_skills: selectedSavoirFaireCategory && selectedSavoirFaireItem ? [`${selectedSavoirFaireCategory.libelle}\t${selectedSavoirFaireItem.libelle}`] : [],
        offer_to_be_acquired_knowledge: selectedSavoirsCategory && selectedSavoirsItem ? [`${selectedSavoirsCategory.libelle}\t${selectedSavoirsItem.libelle}`] : [],
      }),
      rome_detail: referentielRome,
    }

    const competencesRome = getCompetencesRomeFromPartnerJob(partnerJob)

    expect(competencesRome).toEqual({
      savoir_etre_professionnel: [selectedSavoirEtre],
      savoir_faire: [{ libelle: selectedSavoirFaireCategory!.libelle, items: [selectedSavoirFaireItem] }],
      savoirs: [{ libelle: selectedSavoirsCategory!.libelle, items: [selectedSavoirsItem] }],
    })
  })
})

describe("getFormulairesForCfaManagedEnterprises", () => {
  let cfa: ICFA
  let cfaUser: IUserWithAccount
  let entreprise: IEntreprise
  let entrepriseManagedByCfaContact: { last_name: string; first_name: string; phone: string; email: string }

  const insertEntrepriseManagedByCfa = async (data: { entreprise_id: ObjectId; cfa_id: ObjectId } & typeof entrepriseManagedByCfaContact) => {
    const now = new Date()
    await getDbCollection("entreprise_managed_by_cfa").insertOne({
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
      origin: "fixture",
      ...data,
    })
  }

  beforeEach(async () => {
    cfa = generateCfaFixture()
    cfaUser = generateUserWithAccountFixture({ email: "cfa-user@mail.fr" })
    entreprise = generateEntrepriseFixture({ siret: "11000001500013" })
    entrepriseManagedByCfaContact = {
      last_name: "Contact-Nom",
      first_name: "Contact-Prenom",
      phone: "0611223344",
      email: "contact-entreprise@mail.fr",
    }

    await getDbCollection("cfas").insertOne(cfa)
    await getDbCollection("userswithaccounts").insertOne(cfaUser)
    await getDbCollection("entreprises").insertOne(entreprise)
  })

  it("should return recruiters for entreprises managed by the cfa, using the contact of entreprise_managed_by_cfa instead of the cfa user's", async () => {
    const role = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: cfaUser._id,
    })
    await getDbCollection("rolemanagements").insertOne(role)
    await insertEntrepriseManagedByCfa({ entreprise_id: entreprise._id, cfa_id: cfa._id, ...entrepriseManagedByCfaContact })

    const matchingJob = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      workplace_siret: entreprise.siret,
      managed_by: cfaUser._id,
    })
    // Offre d'un autre partenaire sur le même siret : ne doit pas être remontée
    const otherPartnerJob = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      workplace_siret: entreprise.siret,
      managed_by: cfaUser._id,
    })
    // Offre gérée par un autre user sur le même siret : ne doit pas être remontée
    const otherManagedByJob = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      workplace_siret: entreprise.siret,
      managed_by: new ObjectId(),
    })
    await getDbCollection("jobs_partners").insertMany([matchingJob, otherPartnerJob, otherManagedByJob])

    const recruiters = await getFormulairesForCfaManagedEnterprises(cfaUser._id, cfa._id, false)

    expect(recruiters).toHaveLength(1)
    const [recruiter] = recruiters
    expect(recruiter.establishment_siret).toBe(entreprise.siret)
    expect(omit(recruiter, ["jobs"])).toMatchObject(entrepriseManagedByCfaContact)
    expect(recruiter.jobs).toHaveLength(1)
    expect(recruiter.jobs[0]._id).toEqual(matchingJob._id)
    // @ts-expect-error candidatures est supprimé du job retourné
    expect(recruiter.jobs[0].candidatures).toBeUndefined()
  })

  it("should return an empty array when the cfa manages no entreprise", async () => {
    const role = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: cfaUser._id,
    })
    await getDbCollection("rolemanagements").insertOne(role)

    const recruiters = await getFormulairesForCfaManagedEnterprises(cfaUser._id, cfa._id, false)

    expect(recruiters).toEqual([])
  })

  it("should throw a not found error when the cfa does not exist", async () => {
    // Le role référence bien le cfaId ciblé, mais aucun document cfa n'existe pour cet id
    await getDbCollection("cfas").deleteOne({ _id: cfa._id })
    const role = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: cfaUser._id,
    })
    await getDbCollection("rolemanagements").insertOne(role)

    await expect(getFormulairesForCfaManagedEnterprises(cfaUser._id, cfa._id, false)).rejects.toThrow(`Aucun CFA ayant pour id ${cfa._id.toString()}`)
  })

  it("should throw an internal error when the requesting user has no role on the cfa and is not admin", async () => {
    await expect(getFormulairesForCfaManagedEnterprises(cfaUser._id, cfa._id, false)).rejects.toThrow(`inattendu: mainRole vide pour userId=${cfaUser._id}`)
  })

  it("should fallback, for an admin without an own role, to the oldest GRANTED CFA role", async () => {
    const olderGrantedUser = generateUserWithAccountFixture({ email: "older-granted@mail.fr" })
    const newerGrantedUser = generateUserWithAccountFixture({ email: "newer-granted@mail.fr" })
    await getDbCollection("userswithaccounts").insertMany([olderGrantedUser, newerGrantedUser])

    const olderGrantedRole = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: olderGrantedUser._id,
      createdAt: new Date("2021-01-01T00:00:00.000Z"),
      status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
    })
    const newerGrantedRole = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: newerGrantedUser._id,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
    })
    await getDbCollection("rolemanagements").insertMany([newerGrantedRole, olderGrantedRole])
    await insertEntrepriseManagedByCfa({ entreprise_id: entreprise._id, cfa_id: cfa._id, ...entrepriseManagedByCfaContact })

    const jobManagedByOlderUser = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      workplace_siret: entreprise.siret,
      managed_by: olderGrantedUser._id,
    })
    const jobManagedByNewerUser = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      workplace_siret: entreprise.siret,
      managed_by: newerGrantedUser._id,
    })
    await getDbCollection("jobs_partners").insertMany([jobManagedByOlderUser, jobManagedByNewerUser])

    // Un admin quelconque, sans role propre sur ce cfa
    const adminUserId = new ObjectId()
    const recruiters = await getFormulairesForCfaManagedEnterprises(adminUserId, cfa._id, true)

    expect(recruiters).toHaveLength(1)
    expect(recruiters[0].jobs).toHaveLength(1)
    expect(recruiters[0].jobs[0]._id).toEqual(jobManagedByOlderUser._id)
    expect(recruiters[0].managed_by).toBe(olderGrantedUser._id.toString())
  })

  it("should fallback, for an admin without an own role, to a GRANTED CFA role even if a DENIED role is older", async () => {
    const deniedUser = generateUserWithAccountFixture({ email: "denied@mail.fr" })
    const grantedUser = generateUserWithAccountFixture({ email: "granted@mail.fr" })
    await getDbCollection("userswithaccounts").insertMany([deniedUser, grantedUser])

    const deniedRole = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: deniedUser._id,
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
      status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.DENIED })],
    })
    const grantedRole = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: grantedUser._id,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
      status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.GRANTED })],
    })
    await getDbCollection("rolemanagements").insertMany([deniedRole, grantedRole])
    await insertEntrepriseManagedByCfa({ entreprise_id: entreprise._id, cfa_id: cfa._id, ...entrepriseManagedByCfaContact })

    const adminUserId = new ObjectId()
    const recruiters = await getFormulairesForCfaManagedEnterprises(adminUserId, cfa._id, true)

    expect(recruiters).toHaveLength(1)
    expect(recruiters[0].managed_by).toBe(grantedUser._id.toString())
  })

  it("should return an empty array for an admin without an own role when no CFA role is GRANTED", async () => {
    const deniedUser = generateUserWithAccountFixture({ email: "only-denied@mail.fr" })
    await getDbCollection("userswithaccounts").insertOne(deniedUser)
    const deniedRole = generateRoleManagementFixture({
      authorized_type: AccessEntityType.CFA,
      authorized_id: cfa._id.toString(),
      user_id: deniedUser._id,
      status: [generateRoleManagementStatusEventFixture({ status: AccessStatus.DENIED })],
    })
    await getDbCollection("rolemanagements").insertOne(deniedRole)

    const adminUserId = new ObjectId()
    const recruiters = await getFormulairesForCfaManagedEnterprises(adminUserId, cfa._id, true)

    expect(recruiters).toEqual([])
  })

  it("should return an empty array for an admin without an own role when the cfa has no role at all", async () => {
    const adminUserId = new ObjectId()
    const recruiters = await getFormulairesForCfaManagedEnterprises(adminUserId, cfa._id, true)

    expect(recruiters).toEqual([])
  })
})

// mails (CFA + confirmation recruteur) déclenchés une fois le compte réellement validé : cf. le commentaire dans createJobDelegations.
const saveFormationCatalogue = (data: Partial<IFormationCatalogue>) =>
  saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), { catalogue_published: true, ...data })

const saveJob = async (user: IUserWithAccount, entreprise: IEntreprise, overrides: Partial<IJobsPartnersOfferPrivate> = {}) => {
  const job = generateJobsPartnersOfferPrivate({
    managed_by: user._id,
    workplace_siret: entreprise.siret,
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    ...overrides,
  })
  await getDbCollection("jobs_partners").insertOne(job)
  return job
}

const ENTREPRISE_SIRET = "11000001500013"
const CFA_SIRET = "13002526500013"

describe("createJobDelegations", () => {
  it("should create the delegation, notify the CFA and send the recruiter a recap mail when the account is already validated", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise)
    const etablissementId = new ObjectId().toString()
    await saveFormationCatalogue({
      etablissement_formateur_id: etablissementId,
      etablissement_formateur_siret: CFA_SIRET,
      etablissement_formateur_courriel: "cfa@mail.fr",
      etablissement_formateur_entreprise_raison_sociale: "Mon CFA",
      etablissement_formateur_adresse: "1 rue du Test",
      etablissement_formateur_code_postal: "75001",
      etablissement_formateur_localite: "Paris",
    })

    await createJobDelegations({ jobId: job._id, etablissementCatalogueIds: [etablissementId] })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.delegations).toEqual([{ email: "cfa@mail.fr", siret_code: CFA_SIRET, etablissement_id: etablissementId }])
    expect(updatedJob?.job_delegation_count).toBe(1)

    expect(mailer.sendEmail).toHaveBeenCalledTimes(2)
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "cfa@mail.fr", subject: "Une entreprise recrute dans votre domaine" }))
    expect(mailer.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: "Votre offre a été partagée à 1 école(s)",
        data: expect.objectContaining({
          delegations: [{ raison_sociale: "Mon CFA", siret_code: CFA_SIRET, adresse_etablissement: "1 rue du Test, 75001 Paris" }],
        }),
      })
    )
  })

  it("should create the delegation but send no mail when the recruiter's role is not GRANTED yet", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, { status: [] }, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise)
    const etablissementId = new ObjectId().toString()
    await saveFormationCatalogue({ etablissement_formateur_id: etablissementId, etablissement_formateur_siret: CFA_SIRET, etablissement_formateur_courriel: "cfa@mail.fr" })

    await createJobDelegations({ jobId: job._id, etablissementCatalogueIds: [etablissementId] })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.delegations).toHaveLength(1)
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should create the delegation but send no mail when the recruiter's email is not confirmed yet", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: [] }, {}, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise)
    const etablissementId = new ObjectId().toString()
    await saveFormationCatalogue({ etablissement_formateur_id: etablissementId, etablissement_formateur_siret: CFA_SIRET, etablissement_formateur_courriel: "cfa@mail.fr" })

    await createJobDelegations({ jobId: job._id, etablissementCatalogueIds: [etablissementId] })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.delegations).toHaveLength(1)
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should silently skip an etablissementCatalogueId with no matching published formation", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise)

    await createJobDelegations({ jobId: job._id, etablissementCatalogueIds: [new ObjectId().toString()] })

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.delegations).toEqual([])
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })
})

describe("checkForJobActivations", () => {
  const cfaDelegation = { email: "cfa@mail.fr", siret_code: CFA_SIRET, etablissement_id: "etab-1" }

  it("should activate the awaiting job and send the CFA + recap mail once the account is fully validated", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, delegations: [cfaDelegation] })

    await checkForJobActivations(user._id, entreprise._id)

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.ACTIVE)

    expect(mailer.sendEmail).toHaveBeenCalledTimes(2)
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "cfa@mail.fr", subject: "Une entreprise recrute dans votre domaine" }))
    expect(mailer.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email, subject: "Votre offre a été partagée à 1 école(s)" }))
  })

  it("should do nothing when the recruiter's email is not confirmed yet", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: [] }, {}, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, delegations: [cfaDelegation] })

    await checkForJobActivations(user._id, entreprise._id)

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_ATTENTE)
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should do nothing when the role is not GRANTED for this entreprise", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, { status: [] }, { siret: ENTREPRISE_SIRET })
    const job = await saveJob(user, entreprise, { offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE, delegations: [cfaDelegation] })

    await checkForJobActivations(user._id, entreprise._id)

    const updatedJob = await getDbCollection("jobs_partners").findOne({ _id: job._id })
    expect(updatedJob?.offer_status).toBe(JOB_STATUS_ENGLISH.EN_ATTENTE)
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })

  it("should do nothing when there is no awaiting job for this entreprise", async () => {
    const { user, entreprise } = await saveEntrepriseUserTest({ status: validatedUserStatus }, {}, { siret: ENTREPRISE_SIRET })
    await saveJob(user, entreprise, { offer_status: JOB_STATUS_ENGLISH.ACTIVE })

    await expect(checkForJobActivations(user._id, entreprise._id)).resolves.toBeUndefined()
    expect(mailer.sendEmail).not.toHaveBeenCalled()
  })
})
