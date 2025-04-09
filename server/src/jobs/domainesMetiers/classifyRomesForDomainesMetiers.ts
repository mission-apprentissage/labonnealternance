import fs from "node:fs/promises"

import { oleoduc, writeData } from "oleoduc"
import { z } from "zod"

import { deduplicate } from "@/common/utils/array"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"
import { Message, sendMistralMessages } from "@/services/mistralai/mistralai.service"

type RomeDocumentRaw = {
  rome: {
    intitule: string
  }
  definition: string
  appellations: {
    libelle: string
  }[]
}

type LLMInputDocument = {
  titre: string
  definition: string
  appellations: string[]
}

const ZLLMOutput = z.record(z.array(z.string()))

export const classifyRomesForDomainesMetiers = async () => {
  const sousDomaines = await getValidSousDomaines()
  const stats = { inputSentSize: 0, receivedSize: 0, receivedMatchingInputSize: 0 }
  let index = await getCurrentIndex()
  console.info({ index })
  const currentMappings = await getAllMappings()

  await oleoduc(
    getMissingOutputQuery(currentMappings).stream(),
    streamGroupByCount(20),
    writeData(async (typedDocuments: RomeDocumentRaw[]) => {
      const llmInputDocuments: LLMInputDocument[] = typedDocuments.map(({ rome, definition, appellations }) => ({
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
        if (!llmResponse) {
          throw new Error(`empty output`)
        }
        const parsed = ZLLMOutput.safeParse(JSON.parse(llmResponse))
        if (!parsed.success) {
          throw new Error(`output parsing error: ${JSON.stringify(parsed.error, null, 2)}`)
        }
        const { data: typedResponse } = parsed
        const inputSentSize = llmInputDocuments.length
        const receivedSize = Object.keys(typedResponse).length
        const receivedMatchingInputSize = llmInputDocuments.filter((doc) => Object.keys(typedResponse).includes(doc.titre)).length
        console.info({
          inputSentSize,
          receivedSize,
          receivedMatchingInputSize,
        })
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
    })
  )
  console.info(stats)
}

export const classifyRomesForDomainesMetiersAnalyze = async () => {
  const mappings = await getAllMappings()
  const validDomains = await getValidSousDomaines()
  const invalidDomains = deduplicate(Object.values(mappings).flatMap((array) => array.filter((domain) => !validDomains.includes(domain))))
  console.log("invalid sous domaines", invalidDomains)

  const missingOutput = await getMissingOutputQuery(mappings).toArray()
  console.info("missing", missingOutput)
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
  if ((await fs.stat(outputFilename)).isFile()) {
    console.info("reading", outputFilename)
    return JSON.parse((await fs.readFile(outputFilename)).toString())
  }

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

const getMissingOutputQuery = (mappings: Record<string, string[]>) => {
  const treatedInputs = Object.keys(mappings)
  return getDbCollection("referentielromes").find(
    {
      "rome.intitule": { $nin: treatedInputs },
    },
    {
      projection: {
        _id: 0,
        "rome.intitule": 1,
        definition: 1,
        "appellations.libelle": 1,
      },
    }
  )
}
