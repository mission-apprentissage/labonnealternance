import { logMessage } from "../../common/utils/logMessage.js"
import { oleoduc, accumulateData, readLineByLine, transformData, writeData } from "oleoduc"
import fs from "fs"
import path from "path"
import __dirname from "../../common/dirname.js"
const currentDirname = __dirname(import.meta.url)

const updateFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_update.csv")
const removeFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_remove.csv")
const addFilePath = path.join(currentDirname, "./assets/lba_save_etablissements_admin_add.csv")

let removeMap = {}
let updateMap = {}
let addMap = {}

let removeCount = 0
let addCount = 0
let updateCount = 0

const parseUpdateLine = (line) => {
  const terms = line.split("\t")

  updateCount++

  /*
    "id"	"sirets"	"name"	"new_email"	"new_phone"	"new_website"	"remove_email"	"remove_phone"	"remove_website"	"date_created"	"updated_by_id"	"romes_to_boost"	"boost"	"romes_to_remove"	"nafs_to_add"	"email_alternance"	"romes_alternance_to_boost"	"boost_alternance"	"romes_alternance_to_remove"	"score"	"score_alternance"	"social_network"	"phone_alternance"	"website_alternance"	"contact_mode"	"certified_recruiter"	"recruiter_uid"	"new_company_name"	"new_office_name"
    2364	"82294763600020"	X-FAB France	recrutement@xfab.com	"0160885151"	""	0	0	0	2018-01-02 12:55:30		""	0	""	""	""	""	0	""									""	""

      */

  if (updateCount > 1) {
    /*"id"
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

    let companies = []

    let sirets = terms[1].replace(/"/g, "").trim().split(/,|\s/g)
    sirets = sirets.map((siret) => siret.padStart(14, "0"))

    let email = terms[3]?.replace(/"/g, "")?.trim()
    let telephone = terms[4]?.replace(/"/g, "")?.trim()
    let website = terms[5]?.replace(/"/g, "")?.trim()

    let removeEmail = terms[6] // "0" | "1"
    let removePhone = terms[7]
    let removeWebsite = terms[8]

    let romesToBoost = terms[11]?.replace(/"/g, "")

    let romesToRemove = terms[13]?.replace(/"/g, "")

    let emailAlternance = terms[15]?.replace(/"/g, "")
    let romesAlternance = terms[16]?.replace(/"/g, "")

    let romesAlternanceToRemove = terms[18]?.replace(/"/g, "")

    let scoreAlternance = terms[20]
    let phoneAlternance = terms[22]?.replace(/"/g, "")
    let websiteAlternance = terms[23]
    let newCompanyName = terms[27]?.replace(/"/g, "")
    let newOfficeName = terms[28]?.replace(/"/g, "")

    website = websiteAlternance ? websiteAlternance : website
    telephone = phoneAlternance ? phoneAlternance : telephone
    email = emailAlternance ? emailAlternance : email

    website = removeWebsite === "1" ? "remove" : website
    telephone = removePhone === "1" ? "remove" : telephone
    email = removeEmail === "1" ? "remove" : email

    let type = "lbb"
    // si la moindre info concerne l'alternance on force le type à lba
    if (emailAlternance || phoneAlternance || websiteAlternance || scoreAlternance || romesAlternance) {
      type = "lba"
    }

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

    let name = newCompanyName || newOfficeName

    sirets.forEach((siret) => {
      let company = {
        siret,
        raisonsociale: name,
        enseigne: name,
        email,
        telephone,
        website,
        type,
        romes,
        removedRomes,
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
    siret	raisonsociale	enseigne	codenaf	numerorue	libellerue	codecommune	codepostal	email	tel	website	flag_alternance	flag_junior	flag_senior	flag_handicap	departement	trancheeffectif	score	coordinates_x	coordinates_y	id	date_created	date_updated	created_by_id	updated_by_id	email_alternance	score_alternance	social_network	phone_alternance	website_alternance	contact_mode	flag_poe_afpr	flag_pmsmp
    41766958700038	CENTRE INTERNATIONAL DE RESSOURCES ET D INNOVATION POUR LE DÉVELOPPEMENT DURABLE		9499Z	60	rue des acieries	42218	42000	contact@ciridd.org	477922340	https://www.ciridd.org/	0	0	0	0	42	0	0	4.4	45.4333	1	2018-03-15 14:57:25		25662			0					0	0
    */

  if (addCount > 1) {
    let lbbScore = terms[17].replace(/"/g, "")
    let lbaScore = terms[26].replace(/"/g, "")
    let score = lbaScore !== "0" ? lbaScore : lbbScore

    let company = {
      siret: terms[0].replace(/"/g, "").padStart(14, "0"),
      raisonsociale: terms[1].replace(/"/g, ""),
      enseigne: terms[2].replace(/"/g, ""),
      code_naf: terms[3].replace(/"/g, ""),
      numero_rue: terms[4].replace(/"/g, ""),
      libelle_rue: terms[5],
      code_commune: terms[6].replace(/"/g, ""),
      code_postal: terms[7].replace(/"/g, ""),
      email: terms[8],
      telephone: terms[9].replace(/"/g, ""),
      website: terms[10],
      tranche_effectif: terms[16].replace(/"/g, ""),
      type: lbaScore !== "0" ? "lba" : "lbb",
      score,
    }

    company.enseigne = company.enseigne || company.raisonsociale

    if (!company.enseigne) {
      logMessage("error", `Error adding company. Company ${company.siret} has no name`)
      return null
    }

    return company
  } else {
    return null
  }
}

const computeLine = async ({ saveMap, etablissement }) => {
  saveMap[etablissement.siret] = etablissement
}

const initSAVERemoveMap = async () => {
  try {
    logMessage("info", " -- Start init SAVE Remove map -- ")

    await oleoduc(
      fs.createReadStream(removeFilePath),
      readLineByLine(),
      transformData((line) => parseRemoveLine(line)),
      writeData(async (etablissement) => computeLine({ saveMap: removeMap, etablissement }))
    )

    logMessage("info", `End init SAVE Remove map (${removeCount} companies)`)
  } catch (err) {
    logMessage("error", err)
  }

  removeCount = 0

  return removeMap
}

const initSAVEAddMap = async () => {
  try {
    logMessage("info", " -- Start init SAVE Add map -- ")

    await oleoduc(
      fs.createReadStream(addFilePath),
      readLineByLine(),
      transformData((line) => parseAddLine(line)),
      writeData(async (etablissement) => computeLine({ saveMap: addMap, etablissement }))
    )

    logMessage("info", `End init SAVE Add map (${addCount} companies)`)
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

const initSAVEUpdateMap = async () => {
  try {
    logMessage("info", " -- Start init SAVE Update map -- ")

    await oleoduc(
      fs.createReadStream(updateFilePath),
      readLineByLine(),
      accumulateData((acc, data, flush) => reconstitutionLigne(acc, data, flush), { accumulator: "" }),
      transformData((line) => parseUpdateLine(line)),
      writeData(async (etablissements) => {
        etablissements.forEach((etablissement) => {
          computeLine({ saveMap: updateMap, etablissement })
        })
      })
    )

    logMessage("info", `End init SAVE Update map (${Object.keys(updateMap).length} companies)`)
  } catch (err) {
    logMessage("error", err)
  }

  updateCount = 0

  return updateMap
}

export { initSAVERemoveMap, initSAVEAddMap, initSAVEUpdateMap }
