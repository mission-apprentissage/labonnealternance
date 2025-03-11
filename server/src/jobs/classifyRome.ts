import { asyncForEach, delay } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { Message, sendMistralMessages } from "@/services/mistralai/mistralai.service"

export const classifyRome = async () => {
  const helloWorkOffers = (await getDbCollection("raw_hellowork")
    .aggregate([
      {
        $match: { "job.code_rome": { $ne: null } },
      },
      {
        $project: {
          _id: 0,
          "job.title": 1,
          "job.description": 1,
          "job.code_rome": 1,
        },
      },
    ])
    .toArray()) as {
    job: { title: string; description: string; code_rome: string }
  }[]

  const ficheRomes = await getDbCollection("referentielromes").find({}).toArray()
  const llmData = helloWorkOffers.map(({ job: { title, description, code_rome } }) => {
    const ficheRome = ficheRomes.find((x) => x.rome.code_rome === code_rome)
    if (!ficheRome) {
      throw new Error(`rome ${code_rome} introuvable`)
    }
    return {
      title,
      description,
      ficheRome: ficheRome.rome.intitule,
    }
  })
  console.log("data size", llmData.length)

  const validationData = llmData.slice(0, 100)

  const intituleRomes = ficheRomes.map((x) => x.rome.intitule)
  const stats = {
    valid: 0,
    equal: 0,
  }
  await asyncForEach(validationData, async ({ title, description, ficheRome }) => {
    const result = await testOfferTitle(intituleRomes, title, description, ficheRome)
    console.log(result)
    if (result.isEqual) {
      stats.equal++
    }
    if (result.isValid) {
      stats.valid++
    }
    await delay(500)
  })
  stats.valid /= validationData.length
  stats.equal /= validationData.length
  console.log(stats)
}

const testOfferTitle = async (intituleRomes: string[], title: string, description: string, expected: string) => {
  const response = await callLLM(intituleRomes, title, description)
  const json = safeParseJson<any>(response)
  const resultFicheRome = json ? json.ficheRome : null
  const isValid = Boolean(resultFicheRome && intituleRomes.includes(resultFicheRome))
  const isEqual = resultFicheRome === expected
  return { response, isValid, isEqual, expected, description }
}

const safeParseJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value)
  } catch (err) {
    return null
  }
}

const callLLM = async (intituleRomes: string[], title: string, description: string): Promise<string> => {
  const messages: Message[] = [
    {
      role: "system",
      content: `En tant qu'expert d'analyse semantique dans le domaine des offres d'emplois en Alternance et en apprentissage, j'ai besoin que tu classifie des offres d'emplois
       et que tu leur associe une fiche ROME.

       Une fiche ROME est une description détaillée d'un métier.
       
        Je vais te donner le titre d'une offre d'emploi et tu devras me renvoyer l'intitulé de la fiche ROME associée.

        Voici quelques exemples :
        {"offre": "Alternance Technicien de Maintenance Sécurité Gaz H/F", "ficheRome": "Installateur / Installatrice fibre optique"}
        {"offre": "Commis de Salle H/F", "ficheRome": "Serveur / Serveuse en restauration"}
        {"offre": "Conseiller·e de Beauté - Conseiller.e de Beauté Esthéticienne en Alternance - Boutique Yves Rocher H/F", "ficheRome": "Esthéticien / Esthéticienne"}

        Voici l'ensemble des fiches ROME possibles :
        ${intituleRomes.join("\n")}
  `,
    },
    {
      role: "user",
      content: `
Voici le titre d'une offre : 
${title}

Voici la description de l'offre :
${description}

Quelle est la fiche ROME associée ?
`,
    },
  ]
  const response = await sendMistralMessages({
    messages,
    randomSeed: 45555,
  })
  return response
}
