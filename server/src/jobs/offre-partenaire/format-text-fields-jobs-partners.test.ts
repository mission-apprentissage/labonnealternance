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
    // Cas du bug : le filtre du job sélectionne un document dès qu'UN des quatre champs est
    // renseigné, mais les trois autres étaient réécrits à "" — ce qui neutralisait ensuite le
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
})
