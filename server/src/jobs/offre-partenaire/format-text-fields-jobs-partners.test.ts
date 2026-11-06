import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { formatTextFieldsJobsPartners } from "./format-text-fields-jobs-partners"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

describe("format-text-fields-jobs-partners", () => {
  useMongo()

  beforeEach(() => {
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("laisse à null les champs texte absents du document", async () => {
    // Cas du bug : le filtre du job sélectionne un document dès qu'UN des champs listés est
    // renseigné, mais les autres étaient réécrits à "" — ce qui neutralisait ensuite le
    // repli `??` de fillSiretInfosForPartners sur l'enseigne / la raison sociale du SIRET.
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_name: null,
        workplace_description: null,
        offer_description: null,
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.workplace_name).toBe(null)
    expect.soft(job.workplace_description).toBe(null)
    expect.soft(job.offer_description).toBe(null)
    expect.soft(job.offer_title).toBe("Développeur web en alternance")
  })

  it("laisse la chaîne vide d'un champ renseigné qui se vide à la sanitization", async () => {
    // cf. sanitizeNullableTextField
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "<img src=x>",
        workplace_name: "   ",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.offer_description).toBe("")
    expect.soft(job.workplace_name).toBe("")
  })

  it("laisse tel quel un champ déjà à la chaîne vide", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_name: "",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.workplace_name).toBe("")
  })

  it.each([
    ["vidée par la sanitization", "<script>alert(1)</script>"],
    ["faite de balises et de blancs", "<p>   </p><p>&nbsp;</p><br/><br/><br/><br/>"],
    ["réduite à des coordonnées", "contact.rh@agence-exemple.fr 06 12 34 56 78"],
    ["de moins de 30 caractères visibles", "<p><b>Poste de vendeur en boutique</b></p>"],
    ["absente", null],
  ])("bloque en WRONG_DATA une offer_description %s (#5855)", async (_, offer_description) => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description,
        offer_rome_codes: ["M1805"],
      },
    ])

    await formatTextFieldsJobsPartners({})
    await validateComputedJobPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.business_error).toBe(JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA)
    expect.soft(job.validated).toBe(false)
  })

  it("valide une offer_description d'au moins 30 caractères visibles", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "<p><b>Poste de vendeur en boutique de prêt-à-porter</b></p>",
        offer_rome_codes: ["M1805"],
      },
    ])

    await formatTextFieldsJobsPartners({})
    await validateComputedJobPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.business_error).toBe(null)
    expect.soft(job.validated).toBe(true)
  })

  it("ne bloque pas les recruteurs LBA, dont la description est une constante", async () => {
    await givenSomeComputedJobPartners([
      {
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        offer_title: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        offer_description: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.business_error).toBe(null)
  })

  it("sanitize les champs renseignés sans les vider", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "  Développeur web  ",
        workplace_name: "  ACME  ",
        workplace_description: "<p>Une <strong>vraie</strong> entreprise</p>",
        offer_description: '<a href="http://spam.example">Postulez ici</a>',
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.offer_title).toBe("Développeur web")
    expect.soft(job.workplace_name).toBe("ACME")
    // Les balises de mise en forme sont conservées (keepFormat), le lien est retiré.
    expect.soft(job.workplace_description).toBe("<p>Une <strong>vraie</strong> entreprise</p>")
    expect.soft(job.offer_description).toBe("Postulez ici")
  })

  it("homogénéise le code et le libellé NAF (issue #5344)", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_naf_code: "6202A",
        workplace_naf_label: "FABRICATION D'AUTRES PRODUITS LAITIERS",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.workplace_naf_code).toBe("62.02A")
    expect.soft(job.workplace_naf_label).toBe("Fabrication d'autres produits laitiers")
  })

  it("laisse à null un NAF absent", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_naf_code: null,
        workplace_naf_label: null,
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.workplace_naf_code).toBe(null)
    expect.soft(job.workplace_naf_label).toBe(null)
  })

  it("retire les coordonnées en clair des descriptions (issue #5227)", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "<p>Envoyez votre CV à recrutement@acme.fr ou appelez le 06 12 34 56 78.</p>",
        workplace_description: "ACME, contact rh@acme.fr",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    // la mise en forme est conservée, seules les coordonnées disparaissent
    expect.soft(job.offer_description).toBe("<p>Envoyez votre CV à ou appelez le.</p>")
    expect.soft(job.workplace_description).toBe("ACME, contact")
  })

  it("détecte un email masqué par une entité HTML", async () => {
    // sanitizeTextField décode les entités avant le passage des regex
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "Contact : recrutement&#64;acme.fr",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.offer_description).toBe("Contact :")
  })

  it("ne touche pas aux nombres des descriptions qui ne sont pas des téléphones", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "SIRET 01234567800012, rémunération 12 500 € brut, début le 01/09/2026",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.offer_description).toBe("SIRET 01234567800012, rémunération 12 500 € brut, début le 01/09/2026")
  })
})
