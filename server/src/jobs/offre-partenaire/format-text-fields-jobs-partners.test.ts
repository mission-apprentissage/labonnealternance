import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { formatTextFieldsJobsPartners } from "./format-text-fields-jobs-partners"

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

  it("normalise à null un champ déjà à la chaîne vide", async () => {
    // Le corpus importé avant ce correctif contient des "" : le job ne doit pas les perpétuer.
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_name: "",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.workplace_name).toBe(null)
  })

  it("normalise à null un champ dont il ne reste rien après sanitization", async () => {
    await givenSomeComputedJobPartners([
      {
        offer_title: "Développeur web en alternance",
        workplace_name: "   ",
      },
    ])

    await formatTextFieldsJobsPartners({})

    const [job] = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect(job.workplace_name).toBe(null)
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
