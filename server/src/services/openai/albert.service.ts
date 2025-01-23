/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */

import fs from "fs"
import path from "node:path"

import axios from "axios"
import FormData from "form-data"

import config from "@/config"

// ---------------------------------------------------
// 1. Paramètres et setup
// ---------------------------------------------------

const base_url = "https://albert.api.etalab.gouv.fr/v1"
const doc_url = "https://github.com/user-attachments/files/18505198/labonnealternance.raw_francetravail.json"

const file_path = "labonnealternance.raw_francetravail.json"

const collectionName = "test_ft" // Nom de la collection

// Création d'une instance Axios avec le header d'autorisation.
const axiosInstance = axios.create({
  baseURL: base_url,
  headers: {
    Authorization: `Bearer ${config.albert.apiKey}`,
  },
})

// ---------------------------------------------------
// 2. Téléchargement du fichier si besoin
// ---------------------------------------------------
async function downloadFileIfNotExists(url, outputPath) {
  if (!fs.existsSync(outputPath)) {
    console.log(`Téléchargement du fichier depuis : ${url}`)
    const response = await axios.get(url, { responseType: "stream" })
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath)
      response.data.pipe(writer)
      writer.on("finish", resolve)
      writer.on("error", reject)
    })
    console.log(`Fichier enregistré sous : ${outputPath}`)
  } else {
    console.log(`Le fichier existe déjà : ${outputPath}`)
  }
}

// ---------------------------------------------------
// 3. Chargement, parsing JSON et mise en forme
// ---------------------------------------------------
function formatData(rawData) {
  // On ne traite qu'un échantillon de 120 documents, par exemple
  const sampleSize = 120
  const formated_file = [] as any[]

  for (let i = 0; i < Math.min(sampleSize, rawData.length); i++) {
    const document = rawData[i]
    const appellationlibelle = document?.appellationlibelle || ""
    const description = document?.description || ""
    const intitule = document?.intitule || ""
    const entreprise = document?.entreprise || {}

    // Nettoyage du texte (équivalent des regex Python)
    let text = description.replace(/([.,;:!?])([^\s\d])/g, "$1 $2") // Espace après la ponctuation
    text = text.replace(/[\xa0\u00a0\r]/g, " ") // Retire caractères spéciaux
    text = text.replace(/&nbsp;/g, " ") // Retire &nbsp;
    text = text.replace(/,(?!\s)/, ". ") // Ajoute un espace après la première virgule

    formated_file.push({
      title: appellationlibelle,
      text: `${appellationlibelle} ${text} ${intitule}`,
      metadata: {
        id: document.id,
        description: text,
        entreprise: JSON.stringify(entreprise),
        appellationlibelle: appellationlibelle,
        intitule: intitule,
        type: document._metadata.openai.human_verification,
      },
    })
  }
  return formated_file
}

// ---------------------------------------------------
// 4. Création d'une collection sur l'API
// ---------------------------------------------------
async function createCollection(collectionName) {
  // Récupérer la liste des modèles embeddings
  const modelsResponse = await axiosInstance.get("/models")
  const embeddingsModels = modelsResponse.data?.data?.filter((m) => m.type === "text-embeddings-inference")
  // console.log(modelsResponse.data?.data)

  if (!embeddingsModels || embeddingsModels.length === 0) {
    throw new Error("Aucun modèle de type text-embeddings-inference trouvé")
  }
  const embeddingsModelId = embeddingsModels[0].id
  console.log("Modèle embeddings sélectionné :", embeddingsModelId)

  // Créer la collection
  const createResponse = await axiosInstance.post("/collections", {
    name: collectionName,
    model: embeddingsModelId,
  })

  return createResponse.data.id // ID de la collection
}

// ---------------------------------------------------
// 5. Découpage et envoi en plusieurs lots
// ---------------------------------------------------
async function sendInBatches(formatedData, collectionId) {
  const batchSize = 64

  for (let i = 0; i < formatedData.length; i += batchSize) {
    const batch = formatedData.slice(i, i + batchSize)

    // Écrit un fichier JSON temporaire
    const batchFilePath = `tmp_${i}.json`
    fs.writeFileSync(batchFilePath, JSON.stringify(batch, null, 2))

    // Vérification de la taille (max 20MB imposé par l'API)
    const stats = fs.statSync(batchFilePath)
    if (stats.size >= 20 * 1024 * 1024) {
      fs.unlinkSync(batchFilePath)
      throw new Error(`Le lot tmp_${i}.json dépasse 20 MB, découpez davantage vos données.`)
    }

    // Préparation du FormData pour l'upload
    const form = new FormData()
    form.append("request", JSON.stringify({ collection: collectionId }))
    form.append("file", fs.createReadStream(batchFilePath), {
      filename: path.basename(batchFilePath),
      contentType: "application/json",
    })

    // Envoi du lot
    const response = await axiosInstance.post("/files", form, {
      headers: {
        ...form.getHeaders(),
      },
    })

    if (response.status !== 201) {
      fs.unlinkSync(batchFilePath)
      throw new Error(`Erreur lors de l'importation du fichier tmp_${i}.json`)
    }

    // Nettoyage : suppression du fichier temporaire
    fs.unlinkSync(batchFilePath)
  }
}

// ---------------------------------------------------
// 6. Vérification de l'import
// ---------------------------------------------------
async function verifyDocuments(collectionId) {
  const { data } = await axiosInstance.get(`/documents/${collectionId}`)
  const documents = data?.data || []
  console.log(`Nombre total de documents importés : ${documents.length}`, documents)
}

// ---------------------------------------------------
// 7. Optionnel : suppression de la collection
// ---------------------------------------------------
async function deleteCollection(collectionId) {
  // Supprime la collection et tous les documents
  await axiosInstance.delete(`/collections/${collectionId}`)
  console.log(`Collection ${collectionId} supprimée.`)
}

/**
 * Retourne la liste des modèles disponibles, en séparant
 * - le premier modèle de langage (type = text-generation)
 * - le premier modèle d'embeddings (type = text-embeddings-inference)
 */
async function getModels() {
  const { data } = await axiosInstance.get("/models")
  const models = data?.data || []

  console.log(models)
  let languageModel = null
  let embeddingsModel = null

  for (const m of models) {
    if (m.type === "text-generation" && !languageModel) {
      languageModel = m.id
    }
    if (m.type === "text-embeddings-inference" && !embeddingsModel) {
      embeddingsModel = m.id
    }
    if (languageModel && embeddingsModel) break
  }
  return { languageModel, embeddingsModel }
}

/**
 * Récupère la liste des fichiers/documents d'une collection.
 */
async function listDocuments(collectionId) {
  const response = await axiosInstance.get(`/documents/${collectionId}`)
  return response.data?.data || []
}

/**
 * Effectue une requête RAG sur l'endpoint /search et renvoie le contenu trouvé.
 */
async function doSearch(collections, prompt, method = "semantic") {
  const payload = {
    collections,
    k: 6,
    prompt,
    method,
  }
  const response = await axiosInstance.post("/search", payload)
  return response.data.data // Tableau de résultats
}

/**
 * Extrait le contenu (chunk) des résultats d'une recherche
 * et crée un prompt complet RAG.
 */
function buildRAGPrompt(prompt, searchResults) {
  const chunkTexts = searchResults.map((r) => r.chunk.content)
  const joinedChunks = chunkTexts.join("\n\n")
  return `Réponds à la question suivante en te basant sur les documents ci-dessous :\n\n` + `Question: ${prompt}\n\n` + `Documents:\n${joinedChunks}`
}

/**
 * Envoie un prompt au modèle de langage (endpoint /chat/completions).
 */
async function callChatCompletion(modelId, userPrompt) {
  const response = await axiosInstance.post("/chat/completions", {
    messages: [{ role: "user", content: userPrompt }],
    model: modelId,
    stream: false,
    n: 1,
  })
  const text = response.data.choices[0].message.content
  return text
}

/**
 * Envoie un prompt au modèle de langage directement avec `search: true`
 * et des paramètres de recherche dans `search_args`.
 */
async function callChatWithSearch(modelId, messages, searchArgs) {
  const response = await axiosInstance.post("/chat/completions", {
    messages,
    model: modelId,
    stream: false,
    n: 1,
    search: true,
    search_args: searchArgs,
    max_tokens: 2048,
  })
  return response.data
}

//
export const runAlbert = async () => {
  try {
    // (b) Récupération du premier modèle de langage + embeddings
    // const { languageModel, embeddingsModel } = await getModels()
    // console.log("Modèle de langage choisi:", languageModel)
    // console.log("Modèle d’embeddings choisi:", embeddingsModel)
    const embeddingsModel = "intfloat/multilingual-e5-large"
    const languageModel = "meta-llama/Llama-3.1-8B-Instruct" // 'PleIAs/Cassandre-RAG' , 'BAAI/bge-reranker-v2-m3', 'neuralmagic/Meta-Llama-3.1-70B-Instruct-FP8', 'meta-llama/Llama-3.1-8B-Instruct'

    const collectionId = "72eb45bc-794e-4d50-bade-e40aab1d93fe"

    // // a) Téléchargement si besoin
    // await downloadFileIfNotExists(doc_url, file_path)
    // // b) Lecture du JSON
    // const rawData = JSON.parse(fs.readFileSync(file_path, "utf-8"))
    // // console.log("Exemple de document brut :", rawData[0])
    // // c) Mise en forme
    // const formatedData = formatData(rawData)
    // // console.log("Exemple de document formaté :", formatedData[0])
    // // // d) Création de la collection
    // collection_id = await createCollection(collectionName)
    // console.log("Collection ID :", collection_id)
    // // e) Envoi en plusieurs lots
    // await sendInBatches(formatedData, collection_id)
    // // f) Vérification
    // await verifyDocuments(collection_id)
    // g) (Optionnel) Suppression de la collection
    //    Supprimez ou commentez la ligne ci-dessous si vous voulez la conserver
    // await deleteCollection(collection_id)

    // (e) Vérification du nombre de documents
    const docs = await listDocuments(collectionId)
    console.log(`Nombre de documents dans la collection : ${docs.length}`)

    /////////
    // // ---------------------------------------------------
    //     // 4. Différentes méthodes de recherche
    //     // ---------------------------------------------------
    //     console.log('\n--- MÉTHODE LEXICALE ---');
    //     {
    //       const results = await doSearch([collectionId], question, 'lexical');
    //       const ragPrompt = buildRAGPrompt(question, results);
    //       const responseText = await callChatCompletion(languageModel, ragPrompt);
    //       console.log('(Lexical) Réponse du modèle :\n', responseText);
    //     }

    //     console.log('\n--- MÉTHODE SÉMANTIQUE ---');
    //     {
    //       const results = await doSearch([collectionId], question, 'semantic');
    //       const ragPrompt = buildRAGPrompt(question, results);
    //       const responseText = await callChatCompletion(languageModel, ragPrompt);
    //       console.log('(Sémantique) Réponse du modèle :\n', responseText);
    //     }

    //     console.log('\n--- MÉTHODE HYBRIDE ---');
    //     {
    //       const results = await doSearch([collectionId], question, 'hybrid');
    //       const ragPrompt = buildRAGPrompt(question, results);
    //       const responseText = await callChatCompletion(languageModel, ragPrompt);
    //       console.log('(Hybride) Réponse du modèle :\n', responseText);
    //     }

    //     console.log('\n--- RECHERCHE SUR INTERNET ---');
    //     {
    //       // On remplace la collection par "internet"
    //       const results = await doSearch(['internet'], question, 'semantic');
    //       const ragPrompt = buildRAGPrompt(question, results);
    //       const responseText = await callChatCompletion(languageModel, ragPrompt);
    //       console.log('(Internet) Réponse du modèle :\n', responseText);
    //     }

    // ---------------------------------------------------
    // 5. Requête direct /chat/completions avec search=true
    // ---------------------------------------------------

    const messages = [
      {
        role: "system",
        content: `En tant qu'expert d'analyse semantique dans le domaine des offres d'emplois en Alternance et en apprentissage, j'ai besoin que tu classifie des offres d'emplois en fonction de qui a posté l'offre.
           Ce qui me permettra de trier les offres pour les étudiants.
           Les CFA (centre de formations en apprentissage) postent des offres pour le compte d'autre entreprise.
           J'ai besoin de savoir si une offre est une offre postée par un CFA pour le compte d'une entreprise ou si l'offre est postée directement par l'entreprise elle même.
           Il se peut que les offres postées le soient par des plateformes d'interim, l'offre est donc de type entreprise.

           Il se peut que l'offre soit postée par une entreprise mais qu'un CFA soit liée à cette offre, par exemple: Cette offre est liée au CFA "Nom du CFA". Dans ce cas l'offre est de type entreprise avec CFA.
      `,
      },
      {
        role: "user",
        content: `
  Voici plusierus offres: ${JSON.stringify({
    offres: [
      {
        id: "186HKMC",
        appellationlibelle: "Directeur / Directrice de résidence hôtelière",
        description:
          "Appart'City a obtenu le Label Capital « Meilleur Employeur » en 2022 pour la 4ème année consécutive et « Entreprise engagée pour la diversité ».\n\nLe programme de formation\nNous proposons une formation diplômante de Responsable d'Etablissement Touristique en partenariat avec l'organisme de formation l'Académie du Tourisme basé à Six Fours les Plages.\nVous alternerez entre formation et mise en pratique au sein de nos Appart'City avec l'intervention de nos experts métiers. Rattaché à votre tuteur, le Directeur de site, vous participerez à la gestion d'un de nos appart-hôtel. \n\nVos principales missions : \n\nEnchantement client :\n- Accueillir les clients et contribuer à la réussite de leur séjour\n- Garantir la satisfaction client \n- Etre force de proposition pour développer l'enchantement client\n\nPilotage :\n- Travailler sur toutes les fonctions de l'exploitation (hébergement, service, étages, technique et commerciale), en assurant des shifts en réception\n- Fixer des objectifs, mesurer, assurer le suivi et réagir (plan d'action)\n- Veiller au respect des procédures du Groupe ainsi qu'à celui des normes d'exploitation (réglementation en vigueur, sécurité et Hygiène)\n- Aider dans le suivi et l'optimisation de la rentabilité financière du site\n \nMotivation et développement des compétences de l'équipe :\n- Aider le Directeur de site dans l'animation, et la motivation des équipes (hébergement, étages, service et technique)\n- Engager, mobiliser et accompagner les équipes à l'autonomie en les responsabilisant dans la confiance, l'écoute et la bienveillance\n\nCommunication :\n- Participer à des actions d'animations commerciales pour développer les évènements de la résidence,\n- Transmettre l'information\n\nEvènement :\n- Etre force de proposition sur des évènements mensuels et annuels avec les équipes afin de faire vivre nos Appart'City et enchanter nos clients\n\nVotre Profil\nVous disposez d'un Bac+2/3 et de préférence en hôtellerie/Restauration/Tourisme et vous avez acquis au minimum une expérience professionnelle de 3 ans en réception et/ou environnement hôtelier.\n\nVous avez un fort sens du service client, du relationnel et de la vente. Vous aimez le terrain.\nVous faites preuve de dynamisme, de polyvalence et d'autonomie.\nVous avez des aptitudes en Management, animation d'équipe et un réel SAVOIR ETRE en phase avec notre métier de service. Vous avez de bonnes bases d'anglais vous permettant d'échanger avec notre clientèle internationale. \n\nNous rejoindre, c'est l'opportunité pour vous de \n- Intégrer notre promotion de Responsables d'Etablissement Touristique Alternants 100% Appart'City.\n- Obtenir un diplôme de niveau III (Bac+4). \n- Rejoindre un groupe en plein développement n°1 de l'Appart-Hôtel en France qui privilégie la mobilité et la promotion interne.\n\n\nBon à savoir\nPoste en alternance à pourvoir à compter du mois de février 2025 pour une durée de 24 mois.\nCarte tickets restaurants - mutuelle.\nLogement de fonction pendant la période sur site et hébergement proposé à titre gracieux sur le lieu de formation à Six Fours les Plages.\nMobilité nationale obligatoire, vous pourrez être affecté(e) sur l'un de nos 7 sites basés en France avec un switch au bout d'un an à mi parcours selon la liste suivante :\n- Toulouse Labège\n- Nantes Centre\n- Lille Euralille\n- Lyon Villette\n- La Ciotat\n- Nimes Arènes\n- Montpellier Millénaire",
        entreprise: {
          nom: "APPART'CITY",
          siret: "49017612000049",
          entrepriseAdaptee: false,
        },
        intitule: "Responsable d'établissement Touristique en alternance (H/F)",
      },
    ],
  })}.
  Une fois que tu as déterminé si les offres sont de type CFA, Entreprise ou Entreprise_CFA tu répondras au format JSON:
  {offres: [{
    type: "CFA" | "entreprise" | "entreprise_CFA",
    id: "ID",
     cfa: "Nom du CFA" // si l'offre est de type entreprise_CFA ou CFA
    },
    ...
      ]}
  `,
      },
    ]

    console.log("\n--- /chat/completions (RAG intégré) ---")
    {
      // On demande au back-end Albert de faire la recherche + la completion
      const payload = {
        collections: [collectionId],
        k: 6,
        method: "semantic",
      }

      for (let index = 0; index < 2; index++) {
        const directRag = await callChatWithSearch(languageModel, [messages[index]], payload)
        const modelAnswer = directRag.choices[0].message.content
        const usedSources = directRag.search_results.map((r) => r.chunk.content)

        console.log("- Réponse du modèle :", modelAnswer, "\n")
        console.log("- Extraits / sources utilisés :\n", usedSources.join("\n"))
      }
    }
  } catch (err) {
    // @ts-ignore
    console.error("Erreur dans le processus :", err.response.data)
  }
}
