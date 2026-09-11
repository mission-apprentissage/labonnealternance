import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
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
    // Garde-fou : écrire null ici ferait échouer la validation zod de jobs_partners, qui refuse
    // null sur offer_description (non-nullable) mais accepte "" — l'offre ne serait plus importée.
    // Un "" est traité comme absent côté lecture, où les chaînes de repli utilisent `||`.
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

  it("laisse une offre dont la description se vide franchir la validation", async () => {
    // La conséquence réelle du garde-fou ci-dessus : avec null, la validation refuse l'offre
    // (offer_description est non-nullable) et elle n'est plus importée dans jobs_partners.
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        offer_description: "<script>alert(1)</script>",
        offer_rome_codes: ["M1805"],
      },
    ])

    await formatTextFieldsJobsPartners({})
    await validateComputedJobPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(job.errors).toEqual([])
    expect.soft(job.validated).toBe(true)
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
