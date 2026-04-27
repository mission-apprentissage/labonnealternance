import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { blockJobsPartnersFromCfaList, getBlockedCfaMention } from "./blockJobsPartnersFromCfaList"
import { GEIQ_WHITELIST } from "./geiqWhitelist"

describe("blockJobsPartnersFromCfaListTask", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      nock.cleanAll()
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("should block the offer", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "ISCOD",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { business_error } = job
    expect.soft(business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })

  it("should block the offer when the CFA is mentioned in offer_description", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        offer_description: "Formation en alternance avec Iscod pour une prise de poste immediate",
        business_error: null,
      },
    ])

    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })

  it("should block the offer when the CFA is mentioned in workplace_description", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        workplace_description: "Entreprise partenaire du CFA Iscod pour le recrutement en alternance",
        business_error: null,
      },
    ])

    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })

    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED)
  })

  it("should NOT block the offer", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_name: "totally valid company name",
        offer_description: "Description d'offre legitime",
        workplace_description: "Description d'entreprise legitime",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { business_error } = job
    expect.soft(business_error).toEqual(null)
  })

  it("should NOT block a whitelisted partner even when the company name is blacklisted", async () => {
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.JOBTEASER,
        workplace_name: "ISCOD",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    const { business_error } = job
    expect.soft(business_error).toEqual(null)
  })

  it("should NOT block an offer from the GEIQ whitelist even when workplace_name is in the CFA blacklist", async () => {
    await givenSomeComputedJobPartners([
      {
        workplace_siret: GEIQ_WHITELIST[0],
        workplace_name: "ISCOD",
        business_error: null,
      },
    ])
    // when
    await blockJobsPartnersFromCfaList({ shouldNotifySlack: false })
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toBe(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(null)
  })
})

describe("getBlockedCfaMention", () => {
  it("should block a cfa", () => {
    expect
      .soft(
        getBlockedCfaMention({
          offer_description:
            "<p>Au sein de l’équipe communication (3 chargés de communication et une graphiste), vous participerez à l’amplification de la visibilité des actions de l’agence auprès de ses différentes cibles : investisseurs, offreurs de solutions, territoires, porteurs de projets stratégiques, bénéficiaires et acteurs de la cybersécurité et partenaires institutionnels.</p><p>L’objectif : transformer l’expertise terrain et les réussites opérationnelles en leviers de notoriété, d’attractivité et d’acquisition.</p><p><strong>1. Veille, collecte et structuration de l’information</strong></p><ul><li>Rechercher, qualifier et consolider des contenus fiables valorisant les expertises du Grand Est et de notre agence</li><li>Avec le soutien des chargés de communication, structurer la matière éditoriale en lien avec les priorités stratégiques</li></ul><p><strong>2. Développement éditorial multicanal (LinkedIn &amp; sites web)</strong></p><ul><li>Contribuer à l’animation des 5 canaux LinkedIn et des 3 groupes privés</li><li>Développer des contenus éditoriaux pour les différents sites web de l’agence (articles, pages projets, actualités, dossiers thématiques), avec une attention particulière aux enjeux SEO, y compris en environnement multilingue</li><li>Adapter les contenus aux différentes cibles et aux différents supports</li><li>Proposer également des contenus issus des activités menées par l’agence pour les canaux de communication interne</li></ul><p><strong>3. Production de contenus à forte valeur ajoutée</strong></p><ul><li>Avec la supervision des chargés de communication réaliser des interviews et proposer de nouveaux formats narratifs</li><li>Concevoir carrousels, supports visuels et contenus vidéo (via outils simplifiés) avec le soutien de notre graphiste</li></ul><p><strong>4. Analyse et optimisation</strong></p><ul><li>Suivre et analyser les KPI (site web, réseaux sociaux, campagnes)</li><li>Proposer des optimisations éditoriales et stratégiques</li><li>Mettre à jour les supports clés (site, présentations, supports institutionnels)</li></ul>",
          workplace_description:
            "<p>Grand Est Développement est l’agence régionale au service de la transformation des entreprises et des territoires du Grand Est, née sous l’impulsion et avec le soutien de la Région Grand Est et de la Chambre de Commerce et d’Industrie du Grand Est.</p><p>L’agence <strong>contribue au développement et au rayonnement de la région Grand Est </strong>en France comme à l’international en <strong>guidant les entreprises et les territoires </strong>dans leurs projets de <strong>transformation et d’innovation</strong>.</p><p>Son équipe de plus de 90 collaborateurs intervient sur 7 antennes réparties en région Grand Est.</p>",
          workplace_name: "Grand Est Développement",
        })
      )
      .toEqual(null)
  })
})
