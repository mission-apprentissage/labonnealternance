import crypto from "node:crypto"

import { useMongo } from "@tests/utils/mongo.test.utils"
import {
  entrepriseStatusEventFactory,
  roleManagementEventFactory,
  saveAdminUserTest,
  saveCfaUserTest,
  saveEntrepriseManagedByCfa,
  saveEntrepriseUserTest,
  saveRoleManagement,
  validatedUserStatus,
} from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { generateApplicantFixture, generateApplicationFixture } from "shared/fixtures/application.fixture"
import { generateAppointmentFixture } from "shared/fixtures/appointment.fixture"
import { generateCacheInfoSiretFixture } from "shared/fixtures/cache-info-siret.fixture"
import { generateCacheGeolocationFixture } from "shared/fixtures/geolocation.fixture"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { generateUserFixture } from "shared/fixtures/user.fixture"
import { EMAIL_LOG_TYPE, JOB_STATUS_ENGLISH, TrafficType } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IRgpdErasureMode, IRgpdUserType } from "shared/models/rgpd-erasure.model"
import { RGPD_ERASURE_MODE, RGPD_ERASURE_STATUS, RGPD_USER_TYPE } from "shared/models/rgpd-erasure.model"
import { AccessEntityType } from "shared/models/role-management.model"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { s3Delete } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { createFeedbackForm } from "@/services/feedback-form.service"
import { changeJobsPartnersStatus } from "@/services/job-partner-status.service"
import { removeJobPartnersFromSearchItems } from "@/services/search/search-items.service"
import { hashEmail } from "@/services/traffic-source.service"

import { eraseRgpdUser, previewRgpdErasure } from "./rgpd-erasure.service"

const deleteContactMock = vi.hoisted(() => vi.fn())

vi.mock("@getbrevo/brevo", async (importOriginal) => {
  const mod = await importOriginal<any>()
  class ContactsApi {
    setApiKey = vi.fn()
    deleteContact = deleteContactMock
  }
  return { ...mod, default: { ...mod.default, ContactsApi } }
})
vi.mock("@/common/utils/aws-utils", () => ({
  s3Delete: vi.fn().mockResolvedValue(undefined),
  s3WriteString: vi.fn(),
  s3ReadAsString: vi.fn(),
  s3ReadAsStream: vi.fn(),
  s3SignedUrl: vi.fn(),
  getS3FileLastUpdate: vi.fn(),
}))
vi.mock("@/common/utils/sentry-utils", () => ({ sentryCaptureException: vi.fn() }))
// Comportement réel, remplaçable test par test pour simuler une panne au milieu de l'effacement.
vi.mock("@/services/job-partner-status.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/services/job-partner-status.service")>()
  return { ...mod, changeJobsPartnersStatus: vi.fn(mod.changeJobsPartnersStatus) }
})
vi.mock("@/services/search/search-items.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/services/search/search-items.service")>()
  return { ...mod, removeJobPartnersFromSearchItems: vi.fn(mod.removeJobPartnersFromSearchItems) }
})

const s3DeleteSpy = vi.mocked(s3Delete)
const ADMIN_ID = new ObjectId()
const GEOLOCATION_KEY = "2 RUE DU LOUP, 75001"

let siretSequence = 0
const nextSiret = () => String(12000001600000 + ++siretSequence)

const addressDetail = { code_postal: "75001", libelle_commune: "Paris", acheminement_postal: { l4: "2 rue du loup", l6: "75001", l7: "FRANCE" } }

const saveRecruiter = async (email: string, { individual = false }: { individual?: boolean } = {}) => {
  const siret = nextSiret()
  const recruiter = await saveEntrepriseUserTest(
    { email, status: validatedUserStatus },
    { status: [roleManagementEventFactory()] },
    { siret, status: [entrepriseStatusEventFactory()], raison_sociale: individual ? "Jean Dupond" : "Boulangerie SAS", address_detail: addressDetail }
  )
  const cache = generateCacheInfoSiretFixture({ siret })
  if (!individual && cache.data) cache.data.data.unite_legale.personne_physique_attributs = {}
  await getDbCollection("cache_siret").insertOne(cache)
  return recruiter
}

const saveOffer = async (userId: ObjectId, siret: string, data: Partial<IJobsPartnersOfferPrivate> = {}) => {
  const offer = generateJobsPartnersOfferPrivate({
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    partner_job_id: new ObjectId().toString(),
    managed_by: userId,
    workplace_siret: siret,
    workplace_legal_name: "Jean Dupond",
    workplace_address_zipcode: "75001",
    workplace_address_city: "Paris",
    workplace_address_label: "2 rue du loup 75001 Paris",
    workplace_geopoint: { type: "Point", coordinates: [2.345678, 48.861234] },
    apply_email: "recruteur@test.fr",
    apply_phone: "0601020304",
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    ...data,
  })
  await getDbCollection("jobs_partners").insertOne(offer)
  return offer
}

const saveApplicant = async (email: string) => {
  const applicant = generateApplicantFixture({ email })
  await getDbCollection("applicants").insertOne(applicant)
  const application = generateApplicationFixture({ applicant_id: applicant._id, applicant_attachment_deleted_at: null })
  await getDbCollection("applications").insertOne(application)
  return { applicant, application }
}

const erase = (userType: IRgpdUserType, email: string, mode: IRgpdErasureMode = RGPD_ERASURE_MODE.ANONYMIZE, requestedBy: ObjectId | null = ADMIN_ID) =>
  eraseRgpdUser({ userType, query: { email }, mode, requestRef: "#5819", requestedBy })

const preview = (userType: IRgpdUserType, email: string, mode: IRgpdErasureMode = RGPD_ERASURE_MODE.ANONYMIZE, requestedBy = ADMIN_ID) =>
  previewRgpdErasure({ userType, email, mode, requestedBy })

describe("effacement RGPD", () => {
  useMongo()

  beforeEach(() => {
    s3DeleteSpy.mockReset()
    s3DeleteSpy.mockResolvedValue(undefined)
    deleteContactMock.mockReset()
    deleteContactMock.mockResolvedValue({})
  })

  describe("ciblage (faux positifs)", () => {
    it("n'efface que l'adresse exacte, pas une adresse qui la contient ou la prolonge", async () => {
      const cible = await saveRecruiter("jean@x.fr")
      const prolongee = await saveRecruiter("jean@x.fr.com")
      const prefixee = await saveRecruiter("ajean@x.fr")
      const offrePrefixee = await saveOffer(prefixee.user._id, prefixee.entreprise.siret)

      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: cible.user._id })).toBe(0)
      for (const autre of [prolongee, prefixee]) {
        expect(await getDbCollection("userswithaccounts").countDocuments({ _id: autre.user._id })).toBe(1)
        expect(await getDbCollection("rolemanagements").countDocuments({ user_id: autre.user._id })).toBe(1)
      }
      expect(await getDbCollection("jobs_partners").findOne({ _id: offrePrefixee._id })).toMatchObject({
        managed_by: prefixee.user._id,
        apply_email: "recruteur@test.fr",
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      })
    })

    it("retrouve le compte malgré la casse et les espaces de la saisie", async () => {
      const cible = await saveRecruiter("jean@x.fr")

      await erase(RGPD_USER_TYPE.ENTREPRISE, "  Jean@X.fr ")

      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: cible.user._id })).toBe(0)
    })

    it("garde l'entreprise et son cache SIRET quand un autre compte gère le même établissement", async () => {
      const cible = await saveRecruiter("jean@x.fr", { individual: true })
      const collegue = await saveRoleManagement({
        user_id: new ObjectId(),
        authorized_id: cible.entreprise._id.toString(),
        authorized_type: AccessEntityType.ENTREPRISE,
        status: [roleManagementEventFactory()],
      })

      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(await getDbCollection("entreprises").countDocuments({ _id: cible.entreprise._id })).toBe(1)
      expect(await getDbCollection("cache_siret").countDocuments({ siret: cible.entreprise.siret })).toBe(1)
      expect(await getDbCollection("rolemanagements").countDocuments({ _id: collegue._id })).toBe(1)
    })

    it("garde une entreprise qui n'est pas individuelle, même sans autre compte", async () => {
      const cible = await saveRecruiter("jean@x.fr", { individual: false })

      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(await getDbCollection("entreprises").countDocuments({ _id: cible.entreprise._id })).toBe(1)
      // Le cache se reconstitue à la demande : il part dès que plus aucun compte ne gère le SIRET.
      expect(await getDbCollection("cache_siret").countDocuments({ siret: cible.entreprise.siret })).toBe(0)
    })

    it("retire nom et adresse des candidatures reçues par une entreprise individuelle, pas par une société", async () => {
      const individuelle = await saveRecruiter("jean@x.fr", { individual: true })
      const societe = await saveRecruiter("rh@societe.fr")
      const candidature = (offer: IJobsPartnersOfferPrivate, siret: string, company_name: string) =>
        generateApplicationFixture({ job_id: offer._id, company_siret: siret, company_name, company_address: "2 rue du loup 75001 Paris" })
      const recueParIndividuelle = candidature(await saveOffer(individuelle.user._id, individuelle.entreprise.siret), individuelle.entreprise.siret, "Jean Dupond")
      const recueParSociete = candidature(await saveOffer(societe.user._id, societe.entreprise.siret), societe.entreprise.siret, "Boulangerie SAS")
      await getDbCollection("applications").insertMany([recueParIndividuelle, recueParSociete])

      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")
      await erase(RGPD_USER_TYPE.ENTREPRISE, "rh@societe.fr")

      expect(await getDbCollection("applications").findOne({ _id: recueParIndividuelle._id })).toMatchObject({ company_name: "anonymisé", company_address: null })
      expect(await getDbCollection("applications").findOne({ _id: recueParSociete._id })).toMatchObject({
        company_name: "Boulangerie SAS",
        company_address: "2 rue du loup 75001 Paris",
      })
    })

    it("ne touche que le type choisi quand l'e-mail est aussi celui d'un candidat", async () => {
      const recruteur = await saveRecruiter("jean@x.fr")
      const { applicant, application } = await saveApplicant("jean@x.fr")

      const apercu = await preview(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")
      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(apercu.other_user_types).toEqual([RGPD_USER_TYPE.CANDIDAT])
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: recruteur.user._id })).toBe(0)
      expect(await getDbCollection("applicants").countDocuments({ _id: applicant._id })).toBe(1)
      expect(await getDbCollection("applications").countDocuments({ _id: application._id })).toBe(1)
    })

    it("ne trouve pas un compte CFA cherché comme recruteur entreprise", async () => {
      await saveCfaUserTest({ email: "cfa@x.fr" })

      const apercu = await preview(RGPD_USER_TYPE.ENTREPRISE, "cfa@x.fr")

      expect(apercu).toMatchObject({ found: false, other_user_types: [RGPD_USER_TYPE.CFA], steps: [] })
      await expect(erase(RGPD_USER_TYPE.ENTREPRISE, "cfa@x.fr")).rejects.toThrow(/Aucun utilisateur/)
    })
  })

  describe("recruteur entreprise", () => {
    const seedRecruiter = async () => {
      const recruteur = await saveRecruiter("jean@x.fr", { individual: true })
      const { _id: userId } = recruteur.user
      const { siret } = recruteur.entreprise
      const active = await saveOffer(userId, siret)
      const pourvue = await saveOffer(userId, siret, { offer_status: JOB_STATUS_ENGLISH.POURVUE })
      const decideeParLui = await saveOffer(new ObjectId(), nextSiret(), {
        offer_status_history: [{ status: JOB_STATUS_ENGLISH.ACTIVE, reason: "validée", date: new Date(), granted_by: "jean@x.fr" }],
      })
      const application = generateApplicationFixture({ job_id: active._id, company_email: "jean@x.fr", company_phone: "0601020304" })
      await getDbCollection("applications").insertOne(application)
      await getDbCollection("jobs_partners_moderations").insertOne({
        _id: new ObjectId(),
        job_id: active._id,
        trigger: "creation",
        verdict: "conforme",
        status: "ok",
        findings: [{ champ: "job_description", category: "mineurs", severity: "bloquant", verbatim: "extrait" }],
        original_text: { job_description: "Appelez Jean au 06 01 02 03 04", job_employer_description: null },
        masked_text: { job_description: "Appelez [NOM] au [TEL]", job_employer_description: null },
        prompt_version: "1.0.0",
        model: "test",
        duration_ms: 10,
        review: null,
        created_at: new Date(),
      })
      await getDbCollection("trafficsources").insertOne({
        _id: new ObjectId(),
        user_id: userId,
        traffic_type: TrafficType.ENTREPRISE,
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
        referer: null,
        created_at: new Date(),
      })
      await getDbCollection("rolemanagement360").insertOne({ _id: new ObjectId(), role_user_id: userId, user_email: "jean@x.fr" })
      await getDbCollection("emailblacklists").insertOne({ _id: new ObjectId(), email: "jean@x.fr", blacklisting_origin: "brevo", created_at: new Date() })
      await getDbCollection("cache_geolocation").insertOne(generateCacheGeolocationFixture({ address: GEOLOCATION_KEY }))
      await getDbCollection("cache_geolocation").insertOne(generateCacheGeolocationFixture({ address: "75001" }))
      return { recruteur, active, pourvue, decideeParLui, application }
    }

    it("annonce à l'aperçu exactement ce que l'exécution fait", async () => {
      await seedRecruiter()

      const apercu = await preview(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")
      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(rapport.status).toBe(RGPD_ERASURE_STATUS.DONE)
      // Brevo n'est pas interrogé à l'aperçu, et ignoré hors production.
      expect(rapport.steps).toEqual(apercu.steps)
      expect(apercu.steps.filter(({ count }) => count && count > 0).length).toBeGreaterThan(10)
    })

    it("anonymise le compte, ses offres, ses caches et trace la demande sans e-mail en clair", async () => {
      const { recruteur, active, pourvue, decideeParLui, application } = await seedRecruiter()

      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      const { _id: userId } = recruteur.user
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: userId })).toBe(0)
      expect(await getDbCollection("rolemanagements").countDocuments({ user_id: userId })).toBe(0)
      expect(await getDbCollection("anonymized_userswithaccounts").countDocuments({ _id: userId })).toBe(1)
      expect(await getDbCollection("rolemanagement360").countDocuments({})).toBe(0)

      const offreActive = await getDbCollection("jobs_partners").findOne({ _id: active._id })
      expect(offreActive).toMatchObject({
        offer_status: JOB_STATUS_ENGLISH.ANNULEE,
        managed_by: null,
        apply_email: null,
        apply_phone: null,
        workplace_legal_name: null,
        workplace_address_label: "75001 Paris",
        workplace_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
      })
      expect(await getDbCollection("jobs_partners").findOne({ _id: pourvue._id })).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.POURVUE, managed_by: null })
      expect((await getDbCollection("jobs_partners").findOne({ _id: decideeParLui._id }))?.offer_status_history[0].granted_by).toBe("anonymisé")

      expect(await getDbCollection("jobs_partners_moderations").findOne({ job_id: active._id })).toMatchObject({
        original_text: null,
        masked_text: null,
        findings: [{ verbatim: null }],
      })
      expect(await getDbCollection("applications").findOne({ _id: application._id })).toMatchObject({ company_email: "", company_phone: null })
      expect(await getDbCollection("trafficsources").findOne({})).toMatchObject({ user_id: null })

      expect(await getDbCollection("entreprises").countDocuments({ _id: recruteur.entreprise._id })).toBe(0)
      expect(await getDbCollection("cache_siret").countDocuments({ siret: recruteur.entreprise.siret })).toBe(0)
      expect(await getDbCollection("cache_geolocation").distinct("address")).toEqual(["75001"])
      expect(await getDbCollection("emailblacklists").countDocuments({})).toBe(0)

      const audit = await getDbCollection("rgpd_erasures").findOne({ _id: rapport.audit_id })
      const expectedHash = crypto.createHmac("sha256", config.rgpdAuditHmacSecret).update("jean@x.fr").digest("hex")
      expect(audit).toMatchObject({
        email_hash: expectedHash,
        user_type: RGPD_USER_TYPE.ENTREPRISE,
        mode: RGPD_ERASURE_MODE.ANONYMIZE,
        request_ref: "#5819",
        requested_by: ADMIN_ID,
        status: "done",
      })
      expect(JSON.stringify(audit)).not.toMatch(/jean@x\.fr/i)
    })

    it("s'arrête sur un échec en base en gardant le compte, puis termine à la relance", async () => {
      const { recruteur, active, application } = await seedRecruiter()
      vi.mocked(removeJobPartnersFromSearchItems).mockRejectedValueOnce(new Error("mongo indisponible"))

      const interrompu = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(interrompu.status).toBe(RGPD_ERASURE_STATUS.FAILED)
      expect(interrompu.failures).toEqual([{ collection: expect.stringContaining("search_"), message: "mongo indisponible" }])
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: recruteur.user._id })).toBe(1)
      expect(await getDbCollection("rgpd_erasures").findOne({ _id: interrompu.audit_id })).toMatchObject({ status: RGPD_ERASURE_STATUS.FAILED })

      const relance = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(relance.status).toBe(RGPD_ERASURE_STATUS.DONE)
      expect(await getDbCollection("jobs_partners").findOne({ _id: active._id })).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, managed_by: null, apply_email: null })
      expect(await getDbCollection("applications").findOne({ _id: application._id })).toMatchObject({ company_email: "", company_phone: null })
      expect(await getDbCollection("jobs_partners_moderations").findOne({ job_id: active._id })).toMatchObject({ original_text: null })
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: recruteur.user._id })).toBe(0)
    })

    it("s'arrête dès la première étape en base quand l'annulation des offres échoue", async () => {
      const { recruteur, active } = await seedRecruiter()
      vi.mocked(changeJobsPartnersStatus).mockRejectedValueOnce(new Error("mongo indisponible"))

      const interrompu = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(interrompu.status).toBe(RGPD_ERASURE_STATUS.FAILED)
      expect(interrompu.steps.map(({ collection }) => collection)).toEqual(["brevo"])
      expect(await getDbCollection("jobs_partners").findOne({ _id: active._id })).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, managed_by: recruteur.user._id })
    })

    it("en suppression définitive, ne garde aucune copie et supprime les classifications", async () => {
      const { recruteur, active } = await seedRecruiter()

      await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr", RGPD_ERASURE_MODE.DELETE)

      expect(await getDbCollection("anonymized_userswithaccounts").countDocuments({ _id: recruteur.user._id })).toBe(0)
      expect(await getDbCollection("jobs_partners_moderations").countDocuments({ job_id: active._id })).toBe(0)
      expect(await getDbCollection("trafficsources").countDocuments({})).toBe(0)
      expect(await getDbCollection("jobs_partners").findOne({ _id: active._id })).toMatchObject({ offer_status: JOB_STATUS_ENGLISH.ANNULEE, apply_email: null })
    })
  })

  describe("CFA", () => {
    it("supprime les entreprises suivies quand le CFA n'a plus de compte, pas quand un collègue reste", async () => {
      const seul = await saveCfaUserTest({ email: "seul@cfa.fr" })
      const accompagne = await saveCfaUserTest({ email: "accompagne@cfa.fr" })
      await saveRoleManagement({
        user_id: new ObjectId(),
        authorized_id: accompagne.cfa._id.toString(),
        authorized_type: AccessEntityType.CFA,
        status: [roleManagementEventFactory()],
      })
      await saveEntrepriseManagedByCfa({ cfa_id: seul.cfa._id })

      await erase(RGPD_USER_TYPE.CFA, "seul@cfa.fr")
      await erase(RGPD_USER_TYPE.CFA, "accompagne@cfa.fr")

      expect(await getDbCollection("entreprise_managed_by_cfa").countDocuments({ cfa_id: seul.cfa._id })).toBe(0)
      expect(await getDbCollection("entreprise_managed_by_cfa").countDocuments({ cfa_id: accompagne.cfa._id })).toBe(1)
    })
  })

  describe("OPCO et administrateurs", () => {
    it("refuse qu'un administrateur efface son propre compte", async () => {
      const { user } = await saveAdminUserTest({ email: "admin@x.fr", status: validatedUserStatus })
      await saveAdminUserTest({ email: "autre-admin@x.fr", status: validatedUserStatus })

      await expect(preview(RGPD_USER_TYPE.OPCO_ADMIN, "admin@x.fr", RGPD_ERASURE_MODE.ANONYMIZE, user._id)).rejects.toThrow(/propre compte/)
      await expect(erase(RGPD_USER_TYPE.OPCO_ADMIN, "admin@x.fr", RGPD_ERASURE_MODE.ANONYMIZE, user._id)).rejects.toThrow(/propre compte/)
    })

    it("refuse d'effacer le dernier administrateur actif, accepte quand un autre reste", async () => {
      const { user: dernier } = await saveAdminUserTest({ email: "dernier@x.fr", status: validatedUserStatus })

      await expect(erase(RGPD_USER_TYPE.OPCO_ADMIN, "dernier@x.fr")).rejects.toThrow(/dernier administrateur/)
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: dernier._id })).toBe(1)

      await saveAdminUserTest({ email: "relais@x.fr", status: validatedUserStatus })
      await erase(RGPD_USER_TYPE.OPCO_ADMIN, "dernier@x.fr")
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: dernier._id })).toBe(0)
    })

    it("remplace l'e-mail de l'administrateur dans les décisions de modération", async () => {
      await saveAdminUserTest({ email: "modo@x.fr", status: validatedUserStatus })
      await saveAdminUserTest({ email: "relais@x.fr", status: validatedUserStatus })
      const moderationId = new ObjectId()
      await getDbCollection("jobs_partners_moderations").insertOne({
        _id: moderationId,
        job_id: new ObjectId(),
        trigger: "creation",
        verdict: "conforme",
        status: "ok",
        findings: [],
        original_text: null,
        masked_text: null,
        prompt_version: "1.0.0",
        model: "test",
        duration_ms: 10,
        review: { status: "validee", by: "modo@x.fr", at: new Date() },
        created_at: new Date(),
      })

      await erase(RGPD_USER_TYPE.OPCO_ADMIN, "modo@x.fr")

      expect((await getDbCollection("jobs_partners_moderations").findOne({ _id: moderationId }))?.review?.by).toBe("anonymisé")
    })
  })

  describe("décisions prises par un administrateur", () => {
    const formulaire = (slug: string) => ({
      slug,
      title: "Utilité de la fiche",
      trigger: { type: "interactions" as const, autoOpen: false, fullScreen: false, minInteractions: 1, scope: ["/recherche"] },
      questions: [],
    })

    it("remplace son identifiant et son e-mail, pas ceux d'un autre administrateur", async () => {
      const { user: modo } = await saveAdminUserTest({ email: "modo@x.fr", status: validatedUserStatus })
      const { user: relais } = await saveAdminUserTest({ email: "relais@x.fr", status: validatedUserStatus })
      const role = (grantedBy: string) =>
        saveRoleManagement({
          user_id: new ObjectId(),
          authorized_id: new ObjectId().toString(),
          authorized_type: AccessEntityType.ENTREPRISE,
          status: [roleManagementEventFactory({ granted_by: grantedBy })],
        })
      const valideParModo = await role(modo._id.toString())
      const valideParRelais = await role(relais._id.toString())
      await createFeedbackForm(formulaire("cree_par_modo"), "modo@x.fr")
      await createFeedbackForm(formulaire("cree_par_relais"), "relais@x.fr")

      await erase(RGPD_USER_TYPE.OPCO_ADMIN, "modo@x.fr")

      expect((await getDbCollection("rolemanagements").findOne({ _id: valideParModo._id }))?.status[0].granted_by).toBe("anonymisé")
      expect((await getDbCollection("rolemanagements").findOne({ _id: valideParRelais._id }))?.status[0].granted_by).toBe(relais._id.toString())
      expect(await getDbCollection("feedback_forms").findOne({ slug: "cree_par_modo" })).toMatchObject({ created_by: "anonymisé", status_history: [{ granted_by: "anonymisé" }] })
      expect(await getDbCollection("feedback_forms").findOne({ slug: "cree_par_relais" })).toMatchObject({
        created_by: "relais@x.fr",
        status_history: [{ granted_by: "relais@x.fr" }],
      })
    })
  })

  describe("candidat", () => {
    const seedCandidat = async () => {
      const cible = await saveApplicant("candidat@x.fr")
      const autre = await saveApplicant("autre@x.fr")
      await getDbCollection("applicants_email_logs").insertMany([
        { _id: new ObjectId(), applicant_id: cible.applicant._id, application_id: cible.application._id, type: EMAIL_LOG_TYPE.RELANCE, message_id: null, createdAt: new Date() },
        { _id: new ObjectId(), applicant_id: autre.applicant._id, application_id: autre.application._id, type: EMAIL_LOG_TYPE.RELANCE, message_id: null, createdAt: new Date() },
      ])
      const traffic = (applicationId: ObjectId, email: string) => ({
        _id: new ObjectId(),
        application_id: applicationId,
        applicant_email_hash: hashEmail(email),
        traffic_type: TrafficType.APPLICATION,
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
        referer: null,
        created_at: new Date(),
      })
      await getDbCollection("trafficsources").insertMany([traffic(cible.application._id, "candidat@x.fr"), traffic(autre.application._id, "autre@x.fr")])
      return { cible, autre }
    }

    it("anonymise le candidat sans toucher aux données d'un autre", async () => {
      const { cible, autre } = await seedCandidat()

      const apercu = await preview(RGPD_USER_TYPE.CANDIDAT, "candidat@x.fr")
      const rapport = await erase(RGPD_USER_TYPE.CANDIDAT, "candidat@x.fr")

      expect(rapport.steps).toEqual(apercu.steps)
      expect(s3DeleteSpy).toHaveBeenCalledExactlyOnceWith("applications", `cv-${cible.application._id}`)
      expect(await getDbCollection("applicants").countDocuments({})).toBe(1)
      expect(await getDbCollection("applications").countDocuments({})).toBe(1)
      expect(await getDbCollection("applicants_email_logs").countDocuments({ applicant_id: autre.applicant._id })).toBe(1)
      expect(await getDbCollection("applicants_email_logs").countDocuments({})).toBe(1)
      expect(await getDbCollection("trafficsources").countDocuments({ application_id: autre.application._id })).toBe(1)
      expect(await getDbCollection("trafficsources").countDocuments({})).toBe(1)
      expect(await getDbCollection("anonymized_applicants").countDocuments({ applicant_id: cible.applicant._id })).toBe(1)
      expect(await getDbCollection("anonymized_applications").countDocuments({ _id: cible.application._id })).toBe(1)
    })

    it("en suppression définitive, ne garde aucune copie", async () => {
      await seedCandidat()

      await erase(RGPD_USER_TYPE.CANDIDAT, "candidat@x.fr", RGPD_ERASURE_MODE.DELETE)

      expect(await getDbCollection("anonymized_applicants").countDocuments({})).toBe(0)
      expect(await getDbCollection("anonymized_applications").countDocuments({})).toBe(0)
      expect(await getDbCollection("applicants").countDocuments({})).toBe(1)
    })

    it("n'écrit rien en base quand la purge S3 échoue, et trace l'échec", async () => {
      const { cible } = await seedCandidat()
      s3DeleteSpy.mockRejectedValue(new Error("S3 indisponible"))

      const rapport = await erase(RGPD_USER_TYPE.CANDIDAT, "candidat@x.fr")

      expect(rapport.status).toBe(RGPD_ERASURE_STATUS.FAILED)
      expect(rapport.failures).toEqual([{ collection: "s3 (CV)", message: expect.stringMatching(/avant toute écriture/) }])
      expect(await getDbCollection("applications").countDocuments({ _id: cible.application._id })).toBe(1)
      expect(await getDbCollection("applicants").countDocuments({ _id: cible.applicant._id })).toBe(1)
      expect(await getDbCollection("anonymized_applicants").countDocuments({})).toBe(0)
      expect(await getDbCollection("rgpd_erasures").findOne({ _id: rapport.audit_id })).toMatchObject({ status: RGPD_ERASURE_STATUS.FAILED })
    })
  })

  describe("candidat rendez-vous apprentissage", () => {
    it("anonymise vers anonymized_users et anonymized_appointments", async () => {
      const user = generateUserFixture({ email: "rdva@x.fr" })
      const autre = generateUserFixture({ email: "autre-rdva@x.fr" })
      await getDbCollection("users").insertMany([user, autre])
      await getDbCollection("appointments").insertMany([generateAppointmentFixture({ applicant_id: user._id }), generateAppointmentFixture({ applicant_id: autre._id })])

      await erase(RGPD_USER_TYPE.CANDIDAT_RDVA, "rdva@x.fr")

      expect(await getDbCollection("users").distinct("email")).toEqual(["autre-rdva@x.fr"])
      expect(await getDbCollection("appointments").countDocuments({ applicant_id: autre._id })).toBe(1)
      expect(await getDbCollection("appointments").countDocuments({})).toBe(1)
      expect(await getDbCollection("anonymized_users").countDocuments({ _id: user._id })).toBe(1)
      expect(await getDbCollection("anonymized_appointments").countDocuments({ applicant_id: user._id })).toBe(1)
    })
  })

  describe("Brevo", () => {
    const originalEnv = config.env

    beforeEach(() => {
      config.env = "production"
    })

    afterEach(() => {
      config.env = originalEnv
    })

    it("supprime le contact par son e-mail", async () => {
      await saveRecruiter("jean@x.fr")

      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(deleteContactMock).toHaveBeenCalledExactlyOnceWith("jean@x.fr")
      expect(rapport.steps.find(({ collection }) => collection === "brevo")?.count).toBe(1)
      expect(rapport.status).toBe(RGPD_ERASURE_STATUS.DONE)
    })

    it("pose la trace d'audit avant la première étape", async () => {
      await saveRecruiter("jean@x.fr")
      let statusDuringBrevo: string | undefined
      deleteContactMock.mockImplementation(async () => {
        statusDuringBrevo = (await getDbCollection("rgpd_erasures").findOne({}))?.status
        return {}
      })

      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(statusDuringBrevo).toBe("in_progress")
      expect(await getDbCollection("rgpd_erasures").findOne({ _id: rapport.audit_id })).toMatchObject({ status: RGPD_ERASURE_STATUS.DONE, steps: rapport.steps })
    })

    it("considère un contact absent (404) comme effacé", async () => {
      await saveRecruiter("jean@x.fr")
      deleteContactMock.mockRejectedValue({ response: { statusCode: 404 } })

      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(rapport.status).toBe(RGPD_ERASURE_STATUS.DONE)
      expect(rapport.steps.find(({ collection }) => collection === "brevo")?.count).toBe(0)
    })

    it("termine l'effacement en base et passe en partiel quand Brevo échoue", async () => {
      const { user } = await saveRecruiter("jean@x.fr")
      deleteContactMock.mockRejectedValue({ response: { statusCode: 500, body: { message: "jean@x.fr indisponible" } } })

      const rapport = await erase(RGPD_USER_TYPE.ENTREPRISE, "jean@x.fr")

      expect(rapport.status).toBe(RGPD_ERASURE_STATUS.PARTIAL)
      expect(rapport.failures).toEqual([{ collection: "brevo", message: "suppression du contact Brevo en échec (statut 500)" }])
      expect(await getDbCollection("userswithaccounts").countDocuments({ _id: user._id })).toBe(0)
    })
  })
})
