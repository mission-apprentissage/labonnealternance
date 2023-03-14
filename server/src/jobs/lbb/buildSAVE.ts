// @ts-nocheck
import { logMessage } from "../../common/utils/logMessage.js"
import { oleoduc, accumulateData, readLineByLine, transformData, writeData } from "oleoduc"
import fs from "fs"
import path from "path"
import __dirname from "../../common/dirname.js"
import { pushFileToBucket } from "./bonnesBoitesUtils.js"
const currentDirname = __dirname(import.meta.url)

const tempDir = "./assets/"

const updateFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_update.csv")
const removeFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_remove.csv")
const addFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_add.csv")

const removeMap = {}
const updateMap = {}
const addMap = {}

let removeCount = 0
let addCount = 0
let updateCount = 0

const parseUpdateLine = (line) => {
  const terms = line.split("\t")

  updateCount++

  /*Deux premières lignes du fichier csv. Première ligne contient l'en-tête avec les noms des champs. Deuxième ligne un exemple avec les cas de remplissage les plus fréquents :

    "id"	"sirets"	"name"	"new_email"	"new_phone"	"new_website"	"remove_email"	"remove_phone"	"remove_website"	"date_created"	"updated_by_id"	"romes_to_boost"	"boost"	"romes_to_remove"	"nafs_to_add"	"email_alternance"	"romes_alternance_to_boost"	"boost_alternance"	"romes_alternance_to_remove"	"score"	"score_alternance"	"social_network"	"phone_alternance"	"website_alternance"	"contact_mode"	"certified_recruiter"	"recruiter_uid"	"new_company_name"	"new_office_name"
    2364	"82294763600020"	X-FAB France	recrutement@xfab.com	"0160885151"	""	0	0	0	2018-01-02 12:55:30		""	0	""	""	""	""	0	""									""	""

      */

  if (updateCount > 1) {
    /* Liste des champs dans l'ordre de 0 à N :
    
    "id"
    "sirets"	
    "name"	
    "new_email"	
    "new_phone"	
    "new_website"	
    "remove_email"	
    "remove_phone"	
    "remove_website"	
    "date_created"	
    "updated_by_id"	
    "romes_to_boost"	
    "boost"	
    "romes_to_remove"	
    "nafs_to_add"	
    "email_alternance"	
    "romes_alternance_to_boost"	
    "boost_alternance"	
    "romes_alternance_to_remove"	
    "score"	
    "score_alternance"	
    "social_network"	
    "phone_alternance"	
    "website_alternance"	
    "contact_mode"	
    "certified_recruiter"	
    "recruiter_uid"	
    "new_company_name"	
    "new_office_name"
    */

    const companies = []

    let sirets = terms[1].replace(/"/g, "").trim().split(/,|\s/g)
    sirets = sirets.map((siret) => siret.padStart(14, "0"))

    let email = terms[3]?.replace(/"/g, "")?.trim()
    let phone = terms[4]?.replace(/"/g, "")?.trim()
    let website = terms[5]?.replace(/"/g, "")?.trim()

    const removeEmail = terms[6] // "0" | "1"
    const removePhone = terms[7]
    const removeWebsite = terms[8]

    const romesToBoost = terms[11]?.replace(/"/g, "")

    const romesToRemove = terms[13]?.replace(/"/g, "")

    const emailAlternance = terms[15]?.replace(/"/g, "")
    const romesAlternance = terms[16]?.replace(/"/g, "")

    const romesAlternanceToRemove = terms[18]?.replace(/"/g, "")

    const phoneAlternance = terms[22]?.replace(/"/g, "")
    const websiteAlternance = terms[23]
    const newCompanyName = terms[27]?.replace(/"/g, "")
    const newOfficeName = terms[28]?.replace(/"/g, "")

    website = websiteAlternance ? websiteAlternance : website
    phone = phoneAlternance ? phoneAlternance : phone
    email = emailAlternance ? emailAlternance : email

    website = removeWebsite === "1" ? "remove" : website
    phone = removePhone === "1" ? "remove" : phone
    email = removeEmail === "1" ? "remove" : email

    let romes = null
    if (romesToBoost || romesAlternance) {
      // merge et unique sur les romes
      romes = [...new Set((romesToBoost ? romesToBoost.split(",") : []).concat(romesAlternance ? romesAlternance.split(",") : []))]
    }

    let removedRomes = null
    if (romesToRemove || romesAlternanceToRemove) {
      // merge et unique sur les romes
      removedRomes = [...new Set((romesToRemove ? romesToRemove.split(",") : []).concat(romesAlternanceToRemove ? romesAlternanceToRemove.split(",") : []))]
    }

    const name = newCompanyName || newOfficeName

    sirets.forEach((siret) => {
      const company = {
        siret,
      }

      if (name) {
        company.raison_sociale = name
        company.enseigne = name
      }

      if (email === "remove") {
        company.email = ""
      } else if (email) {
        company.email = email
      }

      if (phone === "remove") {
        company.phone = ""
      } else if (phone) {
        company.phone = phone
      }

      if (website === "remove") {
        company.website = ""
      } else if (website) {
        company.website = website
      }

      if (romes) {
        company.rome_codes = romes
      } else if (removedRomes) {
        company.removedRomes = removedRomes
      }

      companies.push(company)
    })

    return companies
  } else {
    return null
  }
}

const parseRemoveLine = (line) => {
  const terms = line.split("\t")
  removeCount++

  if (removeCount > 1) {
    return {
      siret: terms[1].replace(/"/g, "").padStart(14, "0"),
    }
  } else {
    return null
  }
}
const parseAddLine = (line) => {
  const terms = line.split("\t")

  addCount++

  /*
    Deux premières lignes du fichier csv. Première ligne contient l'en-tête avec les noms des champs. Deuxième ligne un exemple avec les cas de remplissage les plus fréquents :

    siret	raisonsociale	enseigne	codenaf	numerorue	libellerue	codecommune	codepostal	email	tel	website	flag_alternance	flag_junior	flag_senior	flag_handicap	departement	trancheeffectif	score	coordinates_x	coordinates_y	id	date_created	date_updated	created_by_id	updated_by_id	email_alternance	score_alternance	social_network	phone_alternance	website_alternance	contact_mode	flag_poe_afpr	flag_pmsmp
    41766958700038	CENTRE INTERNATIONAL DE RESSOURCES ET D INNOVATION POUR LE DÉVELOPPEMENT DURABLE		9499Z	60	rue des acieries	42218	42000	contact@ciridd.org	477922340	https://www.ciridd.org/	0	0	0	0	42	0	0	4.4	45.4333	1	2018-03-15 14:57:25		25662			0					0	0
    */

  if (addCount > 1) {
    const lbbScore = terms[17].replace(/"/g, "")
    const lbaScore = terms[26].replace(/"/g, "")
    const score = lbaScore !== "0" ? lbaScore : lbbScore

    const company = {
      siret: terms[0].replace(/"/g, "").padStart(14, "0"),
      raison_sociale: terms[1].replace(/"/g, ""),
      enseigne: terms[2].replace(/"/g, ""),
      naf_code: terms[3].replace(/"/g, ""),
      street_number: terms[4].replace(/"/g, ""),
      street_name: terms[5].replace(/"/g, ""),
      insee_city_code: terms[6].replace(/"/g, ""),
      zip_code: terms[7].replace(/"/g, ""),
      email: terms[8].replace(/"/g, ""),
      phone: terms[9].replace(/"/g, ""),
      website: terms[10].replace(/"/g, ""),
      company_size: terms[16].replace(/"/g, ""),
      algorithm_origin: lbaScore !== "0" ? "lba" : "lbb",
      recruitment_potential: score,
    }

    company.enseigne = company.enseigne || company.raison_sociale

    if (!company.enseigne) {
      logMessage("error", `Error adding company. Company ${company.siret} has no name`)
      return null
    }

    return company
  } else {
    return null
  }
}

const initSAVERemoveFile = async () => {
  try {
    logMessage("info", " -- Start init SAVE Remove File -- ")

    const companiesToRemove = []
    await oleoduc(
      fs.createReadStream(removeFilePath),
      readLineByLine(),
      transformData((line) => parseRemoveLine(line)),
      writeData(async (etablissement) => companiesToRemove.push(etablissement))
    )

    fs.writeFileSync(path.join(currentDirname, `${tempDir}removeSAVE.json`), JSON.stringify(companiesToRemove))

    await pushFileToBucket({ key: "removeSAVE.json", filePath: path.join(currentDirname, `${tempDir}removeSAVE.json`) })

    logMessage("info", `End init SAVE Remove file with (${removeCount} companies)`)
  } catch (err) {
    logMessage("error", err)
  }

  removeCount = 0

  return removeMap
}

const initSAVEAddFile = async () => {
  try {
    logMessage("info", " -- Start init SAVE Add file -- ")

    const companiesToAdd = []
    await oleoduc(
      fs.createReadStream(addFilePath),
      readLineByLine(),
      transformData((line) => parseAddLine(line)),
      writeData(async (etablissement) => companiesToAdd.push(etablissement))
    )

    fs.writeFileSync(path.join(currentDirname, `${tempDir}addSAVE.json`), JSON.stringify(companiesToAdd))

    await pushFileToBucket({ key: "addSAVE.json", filePath: path.join(currentDirname, `${tempDir}addSAVE.json`) })

    logMessage("info", `End init SAVE Add file with (${addCount} companies)`)
  } catch (err) {
    logMessage("error", err)
  }

  addCount = 0

  return addMap
}

const reconstitutionLigne = (acc, data, flush) => {
  // reconstitue une ligne du CSV à partir de plusieurs lignes. En effet certains champs sont sur plusieurs lignes (ROMEs, Sirets ...)
  let tokens = data.split("\t")
  if (tokens.length === 1) {
    acc += "," + data
  } else {
    if (acc !== "") {
      acc += "," + data
    } else {
      acc += data
    }
  }
  // premier éléments manque la ,

  tokens = acc.split("\t")

  if (tokens.length < 25) {
    //accumulation des données pour reconstituer la ligne entière
    return acc
  } else {
    //flush ligne complète
    flush(acc)
    //Reset accumulateur pour prochaine ligne
    return ""
  }
}

const initSAVEUpdateFile = async () => {
  try {
    logMessage("info", " -- Start init SAVE Update file -- ")

    const companiesToUpdate = []
    await oleoduc(
      fs.createReadStream(updateFilePath),
      readLineByLine(),
      accumulateData((acc, data, flush) => reconstitutionLigne(acc, data, flush), { accumulator: "" }),
      transformData((line) => parseUpdateLine(line)),
      writeData(async (etablissements) => etablissements.map((etablissement) => companiesToUpdate.push(etablissement)))
    )

    fs.writeFileSync(path.join(currentDirname, `${tempDir}updateSAVE.json`), JSON.stringify(companiesToUpdate))

    await pushFileToBucket({ key: "updateSAVE.json", filePath: path.join(currentDirname, `${tempDir}updateSAVE.json`) })

    logMessage("info", `End init SAVE Update file with (${companiesToUpdate.length} companies)`)
  } catch (err) {
    logMessage("error", err)
  }

  updateCount = 0

  return updateMap
}

export default async function buildSAVE() {
  await initSAVERemoveFile()
  await initSAVEAddFile()
  await initSAVEUpdateFile()
}
