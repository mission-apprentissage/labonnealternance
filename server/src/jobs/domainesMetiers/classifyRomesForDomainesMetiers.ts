import fs from "node:fs/promises"
import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { z } from "zod"

import type { AggregationCursor } from "mongodb"
import { removeAccents } from "shared"
import { deduplicate, partition } from "@/common/utils/array"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDatabase, getDbCollection } from "@/common/utils/mongodbUtils"
import { groupStreamData } from "@/common/utils/streamUtils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

type RomeDocumentRaw = {
  rome: {
    intitule: string
    code_rome: string
  }
  definition: string
  appellations: {
    libelle: string
  }[]
  domaines: {
    codes_romes: string[]
    intitules_romes: string[]
    sous_domaine: string
  }[]
}

type LLMInputDocument = {
  titre: string
  definition: string
  appellations: string[]
}

const ZLLMOutput = z.record(z.array(z.string()))

const domainContainsRome = (
  domaine: {
    codes_romes: string[]
    intitules_romes: string[]
  },
  rome: { intitule: string; code_rome: string }
): boolean => {
  return domaine.codes_romes.some((code_rome, index) => code_rome === rome.code_rome && domaine.intitules_romes[index] === rome.intitule)
}

const isAlreadyClassified = (document: RomeDocumentRaw): boolean => {
  if (document.domaines.length === 0) {
    return false
  }
  return document.domaines.every((domaine) => domainContainsRome(domaine, document.rome))
}

export const classifyRomesForDomainesMetiers = async () => {
  const BATCH_SIZE = 20
  const sousDomaines = await getValidSousDomaines()
  const stats = { inputSentSize: 0, receivedSize: 0, receivedMatchingInputSize: 0 }
  let index = await getCurrentIndex()
  console.info({ index })
  const currentMappings = await getAllMappings()

  async function processBatch(typedDocuments: RomeDocumentRaw[]) {
    const toClassifyDocuments = typedDocuments.filter((document) => !isAlreadyClassified(document))
    if (!toClassifyDocuments.length) {
      return
    }

    const llmInputDocuments: LLMInputDocument[] = toClassifyDocuments.map(({ rome, definition, appellations }) => ({
      titre: rome.intitule,
      definition,
      appellations: appellations.map(({ libelle }) => libelle),
    }))

    console.info(
      "sending",
      llmInputDocuments.map((x) => x.titre)
    )

    const llmResponse = await classifyRomeDocuments(llmInputDocuments, sousDomaines)
    console.info("llmResponse:", llmResponse)

    try {
      if (!llmResponse) throw new Error(`empty output`)

      const parsed = ZLLMOutput.safeParse(JSON.parse(llmResponse))
      if (!parsed.success) {
        throw new Error(`output parsing error: ${JSON.stringify(parsed.error, null, 2)}`)
      }

      const { data: typedResponse } = parsed
      const inputSentSize = llmInputDocuments.length
      const receivedSize = Object.keys(typedResponse).length
      const receivedMatchingInputSize = llmInputDocuments.filter((doc) => Object.keys(typedResponse).includes(doc.titre)).length

      console.info({ inputSentSize, receivedSize, receivedMatchingInputSize })

      stats.inputSentSize += inputSentSize
      stats.receivedSize += receivedSize
      stats.receivedMatchingInputSize += receivedMatchingInputSize

      const filename = `./classifyRomesForDomainesMetiers.output.${index}.json`
      console.info("writing", filename)
      await fs.appendFile(filename, JSON.stringify(typedResponse, null, 2))
      index++
    } catch (error) {
      console.error(error)
    }
  }

  await pipeline(
    getMissingOutputQuery(Object.keys(currentMappings)).stream(),
    groupStreamData({ size: BATCH_SIZE }),
    new Writable({
      objectMode: true,
      async write(documents, _, callback) {
        await processBatch(documents)
        callback()
      },
    })
  )

  console.info(stats)
}

function normalizeString(str: string): string {
  if (!str) return str
  return removeAccents(str)
    .toLocaleLowerCase()
    .split("")
    .filter((x) => /[a-z ]/.test(x))
    .join("")
}

function isInDomainArray(domains: string[], domain: string): boolean {
  return domains.map(normalizeString).includes(normalizeString(domain))
}

export const classifyRomesForDomainesMetiersAnalyze = async () => {
  const romesToTreatDocuments = (await getMissingOutputQuery([]).toArray()).filter((document) => !isAlreadyClassified(document))
  console.info("Romes à traiter", romesToTreatDocuments.length)

  const romesToTreat = romesToTreatDocuments.map((x) => x.rome.intitule)

  const romeToDomaines = Object.fromEntries(Object.entries(await getAllMappings()).filter(([rome]) => romesToTreat.includes(rome)))
  if (!Object.keys(romeToDomaines).length) {
    throw new Error("no mappings found")
  }
  console.info("nombre de romes", Object.keys(romeToDomaines).length)

  const notTreatedRomes = romesToTreat.filter((rome) => !Object.keys(romeToDomaines).includes(rome))
  console.info("Romes non traités", notTreatedRomes.length)
  if (notTreatedRomes.length) {
    console.info("1er rome non traité", notTreatedRomes[0])
  }

  const validDomains = await getValidSousDomaines()
  function isValidDomain(domain: string): boolean {
    return isInDomainArray(validDomains, domain)
  }

  const hallucinatedDomains = deduplicate(Object.values(romeToDomaines).flatMap((array) => array.filter((domain) => !isValidDomain(domain))))
  console.info("Sous domaines hallucinés", hallucinatedDomains)

  Object.entries(romeToDomaines).forEach(([rome, domains]) => {
    const hasValidDomain = domains.some(isValidDomain)
    if (!hasValidDomain) {
      console.info(`Rome sans domaine valide: ${rome}`)
    }
  })

  const romeIntitulesAndCodes = await getDbCollection("referentielromes")
    .find({}, { projection: { _id: 0, "rome.intitule": 1, "rome.code_rome": 1 } })
    .toArray()
  const intituleRomeHallucines = Object.keys(romeToDomaines).filter((intitule) => !romeIntitulesAndCodes.find((x) => x.rome.intitule === intitule))
  console.info("Intitulés de ROME hallucinés", intituleRomeHallucines)

  const domaineToRomes: Record<string, { code: string; intitule: string }[]> = {}
  Object.entries(romeToDomaines).forEach(([intitule, domains]) => {
    domains.forEach((domain) => {
      let group = domaineToRomes[domain]
      if (!group) {
        group = []
        domaineToRomes[domain] = group
      }
      const code = romeIntitulesAndCodes.find((x) => x.rome.intitule === intitule)?.rome.code_rome
      if (!code) {
        console.warn(`rome not found with intitule=${intitule}`)
      }
      group.push({ intitule, code: code ?? "" })
    })
  })
  const { match: validInvertedEntries, notMatch: hallucinatedInvertedEntries } = partition(Object.entries(domaineToRomes), ([domain]) => isValidDomain(domain))

  const validDomainToRomes = Object.fromEntries(validInvertedEntries)
  await fs.writeFile("./classifyRomesForDomainesMetiers.inverted.valid.json", JSON.stringify(validDomainToRomes, null, 2))
  const hallucinatedDomainToRomes = Object.fromEntries(hallucinatedInvertedEntries)
  await fs.writeFile("./classifyRomesForDomainesMetiers.inverted.invalid.json", JSON.stringify(hallucinatedDomainToRomes, null, 2))

  const domainesAvecRomes = Object.entries(domaineToRomes)
    .filter(([_domain, romes]) => Boolean(romes.length))
    .map(([domain]) => domain)
  const domainesSansRomes = validDomains.filter((domain) => !isInDomainArray(domainesAvecRomes, domain))
  console.info("Domaines sans nouveau rome", domainesSansRomes)
}

export async function findDomainesMetiersIncoherents() {
  const domainesmetiers = await getDbCollection("domainesmetiers")
    .find(
      {
        $expr: {
          $ne: [{ $size: "$codes_romes" }, { $size: "$intitules_romes" }],
        },
      },
      {
        projection: {
          domaine: 1,
          sous_domaine: 1,
          codes_romes: 1,
          intitules_romes: 1,
        },
      }
    )
    .toArray()
  console.info(domainesmetiers.length, "domaines incohérents trouvés")
  await fs.writeFile("./domainesmetiers.incoherents.json", JSON.stringify(domainesmetiers, null, 2))
}

const classifyRomeDocuments = async (romeDocuments: LLMInputDocument[], sousDomaines: string[]) => {
  const messages: Message[] = [
    {
      role: "system",
      content: `En tant qu'expert d'analyse semantique dans le domaine des offres d'emplois en Alternance et en apprentissage, 
      j'ai besoin que tu analyse les fiches ROME et que tu associe chaque fiche ROME à un domaine métier.
      Ces fiches ROME proposent une description détaillée des métiers.

      Voici la liste des domaines métiers possibles :
      ${JSON.stringify(sousDomaines, null, 2)}

Je vais te donner les informations des fiches ROME au format JSON.
Tu vas ensuite déterminer pour chaque fiche ROME quels sont les domaines métiers les plus appropriés.
Puis, tu répondras en utilisant ce format JSON :
{
  "<rome_intitule>": ["<domaine métier 1>", "<domaine métier 2>", ...],
}

Par exemple, si les fiches ROME sont :
[
  {
    "titre": "Conducteur / Conductrice d'engins agricoles",
    "definition": "Réalise des travaux agricoles mécanisés. Aménage et prépare les terrains, assure le labourage, le désherbage, les semis et récolte la production. Utilise différentes machines (tracteur, moissonneuse-batteuse, ensileuse) et en assure l'entretien et la maintenance de premier niveau.",
    "appellations": [
      "Chauffeur / Chauffeuse de machines agricoles",
      "Conducteur / Conductrice d'automoteur de récolte",
      "Conducteur / Conductrice de machines à vendanger",
      "Conducteur / Conductrice de matériels de semis",
      "Conducteur / Conductrice de pulvérisateur",
      "Conducteur / Conductrice de tracteur",
      "Conducteur / Conductrice de tracteur enjambeur",
      "Conducteur / Conductrice de tracto-benne",
      "Conducteur / Conductrice d'engins d'exploitation agricole",
      "Conducteur / Conductrice d'épareuse",
      "Opérateur / Opératrice d'épandage",
      "Tractoriste agricole"
    ]
  },
  {
    "titre": "Grossiste en produits frais",
    "definition": "Réalise des opérations de vente en gros de produits frais (fruits, légumes, fleurs, ...) destinés à un public de professionnels (restaurateurs, détaillants, collectivités, ...) selon la réglementation commerciale, les règles d'hygiène et de sécurité alimentaires et la stratégie commerciale de l'entreprise. Peut préparer les commandes des clients.",
    "appellations": [
      "Grossiste en produits frais"
    ]
  },
  {
    "titre": "Conducteur / Conductrice de ligne en industrie chimique",
    "definition": "Surveille et régule une installation de transformation chimique, thermique ou physique de produits chimiques, pharmaceutiques ou de parfumerie, selon les normes d'hygiène, de sécurité, les normes environnementales et les impératifs de production (qualité, coûts, délais, ...). Effectue des contrôles de conformité des matières en cours de production. Met en oeuvre des mesures correctives définies en cas de dysfonctionnement des équipements et anomalies de réaction des produits transformés. Peut piloter l'installation à distance (salle de contrôle, ...) et réaliser la maintenance de premier niveau. Peut suivre et analyser les données de production.",
    "appellations": [
      "Conducteur / Conductrice de ligne en industrie chimique"
    ]
  }
]
Tu devras répondre :
{
  "Conducteur / Conductrice d'engins agricoles": ["Exploitation forestière, sylviculture", "Conduite d'engins agricoles"],
  "Conducteur / Conductrice de ligne en industrie chimique": ["Chimie"],
  "Grossiste en produits frais": ["Accueil, service client", "Vente en magasin : alimentation, produits frais, boissons"],
}
  `,
    },
    {
      role: "user",
      content: `
      Voici les fiches ROME à classifier :
      ${JSON.stringify(romeDocuments, null, 2)}
`,
    },
  ]
  try {
    const response = await sendMistralMessages({
      messages,
      randomSeed: 45555,
      maxTokens: 2048,
    })
    if (!response) {
      return undefined
    }
    return response
  } catch (error) {
    console.error(error)
  }
}

const getValidSousDomaines = async () => {
  const domaineMetiers = await getDbCollection("domainesmetiers").find({}).toArray()
  const sousDomainesSet = new Set<string>()
  domaineMetiers.forEach((domaineMetier) => sousDomainesSet.add(domaineMetier.sous_domaine))
  sousDomainesSet.add("Arts plastiques, galeries, marché de l'art")
  sousDomainesSet.add("Industrie des matériaux de construction")
  const sousDomaines = [...sousDomainesSet].sort()
  return sousDomaines
}

const getCurrentIndex = async () => {
  let index = 0
  await asyncForEach(await fs.readdir("."), async (filename) => {
    const reg = /classifyRomesForDomainesMetiers.output.([0-9]+).json/g
    const match = reg.exec(filename)
    if (!match) {
      return
    }
    const fileIndex = parseInt(match[1], 10)
    index = Math.max(index, fileIndex)
  })
  return index + 1
}

const getAllMappings = async (): Promise<Record<string, string[]>> => {
  const outputFilename = `./classifyRomesForDomainesMetiers.output.json`

  let mappings: Record<string, string[]> = {}
  await asyncForEach(await fs.readdir("."), async (filename) => {
    if (!/classifyRomesForDomainesMetiers.output.[0-9]+.json/g.test(filename)) {
      return
    }
    const json = JSON.parse((await fs.readFile(`./${filename}`)).toString()) as Record<string, string[]>
    mappings = { ...mappings, ...json }
  })
  console.info("writing", outputFilename)
  await fs.writeFile(outputFilename, JSON.stringify(mappings, null, 2))
  return mappings
}

const getMissingOutputQuery = (treatedRomesIntitules: string[]): AggregationCursor<RomeDocumentRaw> => {
  return getDbCollection("referentielromes").aggregate([
    {
      $match: {
        "rome.intitule": { $nin: treatedRomesIntitules },
      },
    },
    {
      $lookup: {
        from: "domainesmetiers",
        localField: "rome.code_rome",
        foreignField: "codes_romes",
        as: "domaines",
      },
    },
    {
      $project: {
        _id: 0,
        "domaines.codes_romes": 1,
        "domaines.intitules_romes": 1,
        "domaines.sous_domaine": 1,
        "rome.intitule": 1,
        "rome.code_rome": 1,
        definition: 1,
        "appellations.libelle": 1,
      },
    },
  ])
}

export const analyzeRemovedRomes = async () => {
  const newRomes = (
    await getDbCollection("referentielromes")
      .find({}, { projection: { _id: 0, "rome.intitule": 1, "rome.code_rome": 1 } })
      .toArray()
  ).map((x) => x.rome)

  const oldRomesRaw = (await getDatabase()
    .collection("referentielromes_previous")
    .find({}, { projection: { _id: 0, "rome.intitule": 1, "rome.code_rome": 1 } })
    .toArray()) as unknown as { rome: { code_rome: string; intitule: string } }[]
  const oldRomes = oldRomesRaw.map((x) => x.rome)

  const codeRomeSupprimes = oldRomes.filter((oldRome) => !newRomes.some((newRome) => newRome.code_rome === oldRome.code_rome))
  console.info("Code ROME supprimés", codeRomeSupprimes.length)

  const codeRomeRenommes = oldRomes.filter((oldRome) => newRomes.find((newRome) => newRome.code_rome === oldRome.code_rome && newRome.intitule !== oldRome.intitule))
  console.info("Code ROME renommés", codeRomeRenommes.length)

  const romeRenommesSimilaires = codeRomeRenommes.filter((oldRome) =>
    newRomes.find((newRome) => newRome.code_rome === oldRome.code_rome && normalizeString(newRome.intitule) === normalizeString(oldRome.intitule))
  )
  console.info("Code ROME renommés avec libellé similaire", romeRenommesSimilaires.length)

  const domaines = await getDbCollection("domainesmetiers").find({}).toArray()
  const notMatchingSizeDomains = domaines.filter((x) => x.codes_romes.length !== x.intitules_romes.length)
  console.info("Domaines dont la taille ne correspond pas", notMatchingSizeDomains.length)

  const romesInDomainSet = new Set<string>()
  domaines.forEach((domaine) => {
    domaine.codes_romes.forEach((code) => {
      romesInDomainSet.add(code)
    })
  })

  const oldRomesNotInDomain = oldRomes.filter((rome) => !romesInDomainSet.has(rome.code_rome))
  console.info("anciens ROME qui ne sont pas dans domainesmetiers", oldRomesNotInDomain.length)
}
