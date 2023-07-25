import path from "path"
import axios from "axios"
import FormData from "form-data"
import { createWriteStream, createReadStream } from "fs"
import { pick } from "lodash-es"
import { oleoduc, transformData, transformIntoCSV } from "oleoduc"
import { Readable } from "stream"
import dayjs from "../../../../common/dayjs.js"
import { logger } from "../../../../common/logger.js"
import { UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { IUserRecruteur } from "../../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import config from "../../../../config.js"
import { getDepartmentByZipCode } from "../../../../common/territoires.js"

const stat = {
  ok: 0,
  ko: 0,
  matchingAppellation: 0,
  romeDetailVide: 0,
  adresse: 0,
  geoCoord: 0,
}

const formatDate = (date) => dayjs(date).format("DD/MM/YYYY")
const splitter = (str) => str.split(regex).filter(String)
const regex = /^(.*) (\d{4,5}) (.*)$/

/**
 * @description format data into Pole Emploi specific fields
 * @param {object} offre
 * @returns {Promise<object>}
 */
const formatToPe = async (offre) => {
  const appellation = offre.rome_detail.appellations.find((v) => v.libelle === offre.rome_appellation_label)
  const adresse = offre.address_detail
  const [latitude, longitude] = offre.geo_coordinates.split(",")

  const [rue, code_postal, ville] = offre.is_delegated && offre.cfa?.address_detail?.label ? splitter(offre.cfa.address_detail.label) : []

  const ntcCle = offre.type === "Apprentissage" ? "E2" : "FS"

  if (!appellation) {
    stat.matchingAppellation++
    return
  }
  if (!adresse) {
    stat.adresse++
    return
  }
  if (!latitude || !longitude) {
    stat.geoCoord++
    return
  }

  return {
    Par_ref_offre: `${ntcCle}-${offre.jobId}`,
    Par_cle: "LABONNEALTERNANCE",
    Par_nom: "LABONNEALTERNANCE",
    Par_URL_offre: `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&type=matcha&itemId=${offre.jobId}`,
    Code_rome: offre.rome_code[0],
    Code_OGR: appellation.code,
    Libelle_metier_OGR: appellation.libelle,
    Description: offre.rome_detail.definition,
    Off_experience_duree_min: null,
    Off_experience_duree_max: null,
    Exp_cle: "D",
    Exp_libelle: null,
    Dur_cle_experience: null,
    Dur_libelle_experience: null,
    Off_experience_commentaire: null,
    Qua_cle: null,
    Qua_libelle: null,
    SCN_cle: offre.naf_code,
    SCN_libelle: offre.naf_label,
    Tfm_cle_1: null,
    Tfm_libelle_1: null,
    Dfm_cle_1: null,
    Dfm_libelle_1: null,
    Dfm_exi_cle_1: null,
    Dfm_exi_libelle_1: null,
    Tfm_cle_2: null,
    Tfm_libelle_2: null,
    Dfm_cle_2: null,
    Dfm_libelle_2: null,
    Dfm_exi_cle_2: null,
    Dfm_exi_libelle_2: null,
    Lan_cle_1: null,
    Lan_libelle_1: null,
    NVL_cle_1: null,
    NVL_libelle_1: null,
    Lan_exi_cle_1: null,
    Lan_exi_libelle_1: null,
    Lan_cle_2: null,
    Lan_libelle_2: null,
    NVL_cle_2: null,
    NVL_libelle_2: null,
    Lan_exi_cle_2: null,
    Lan_exi_libelle_2: null,
    TSA_cle: null,
    TSA_libelle: null,
    Off_salaire_min: null,
    Off_salaire_max: null,
    UMO_cle: null,
    UMO_libelle: null,
    Off_salaire_nb_mois: null,
    Off_salaire_cpt_commentaire: null,
    Off_travail_hebdo_nb_hh: null,
    Off_travail_hebdo_nb_mi: null,
    THO_cle: null,
    THO_libelle: null,
    Off_THO_commentaire: null,
    NTC_cle: ntcCle,
    NTC_libelle: null,
    TCO_cle: "CDD",
    TCO_libelle: null,
    Off_contrat_duree_MO: offre.job_duration,
    Off_contrat_duree_JO: null,
    Off_adr_id: null,
    Off_adr_norme: null,
    Off_adr_compl_1: null,
    Off_adr_compl_2: null,
    Off_adr_no_voie: adresse.numero_voie,
    Off_adr_nom_voie: `${adresse.type_voie ?? ""} ${adresse.nom_voie ?? ""}`,
    CPO_cle: null,
    COM_cle: adresse.code_insee_localite,
    COM_libelle: null,
    DEP_cle: adresse.code_postal.slice(0, 2),
    DEP_libelle: null,
    REG_cle: getDepartmentByZipCode(adresse.code_postal.slice(0, 3))?.region.code,
    REG_libelle: null,
    Pay_cle: null,
    Pay_libelle: adresse.l7,
    CON_cle: null,
    CON_libelle: null,
    Coordonnee_geo_loc_1: latitude,
    Coordonnee_geo_loc_2: longitude,
    PCO_cle_1: null,
    PCO_libelle_1: null,
    PCO_exi_cle_1: null,
    PCO_exi_libelle_1: null,
    PCO_cle_2: null,
    PCO_libelle_2: null,
    PCO_exi_cle_2: null,
    PCO_exi_libelle_2: null,
    Off_date_creation: formatDate(offre.job_creation_date),
    Off_date_modification: formatDate(offre.job_update_date),
    OST_poste_restant_nb: offre.job_count,
    Off_client_final_siret: offre.establishment_siret,
    Off_client_final_nom: adresse.l7,
    Off_etab_enseigne: offre.cfa ? offre.cfa?.establishment_raison_sociale : offre.establishment_raison_sociale ?? null,
    Col_cle: null,
    Col_nom: null,
    Col_URL_offre: null,
    Version: null,
    Type_mouvement: "C",
    Date_debut_contrat: formatDate(offre.job_start_date),
    Motif_suppression: null,
    Description_entreprise: offre.job_description ?? null,
    Off_etab_siret: offre.cfa_delegated_siret,
    Id_recruteur: null,
    Civ_correspondant: null,
    Nom_correspondant: null,
    Prenom_correspondant: null,
    Tel_correspondant: null,
    Mail_correspondant: null,
    Libelle_etab: null,
    Num_voie_etab: null,
    Type_voie_etab: rue ?? null,
    Lib_voie_etab: rue ?? null,
    Cplt_adresse_1: ville,
    Cplt_adresse_2: null,
    Code_postal_etab: code_postal,
    Code_commune_etab: null,
    Service: null,
    Mode_diffusion: "O",
    Rappel: null,
    Mode_presentation: null,
    Emploi_metier_isco: null,
  }
}

/**
 * Sends CSV file to Pole Emploi API through a "form data".
 */
const sendCsvToPE = async (csvPath: string): Promise<void> => {
  const form = new FormData()
  form.append("login", config.poleEmploiDepotOffres.login)
  form.append("password", config.poleEmploiDepotOffres.password)
  form.append("nomFlux", config.poleEmploiDepotOffres.nomFlux)
  form.append("fichierAenvoyer", createReadStream(csvPath))
  form.append("periodeRef", "")

  const { data } = await axios.post("https://portail-partenaire.pole-emploi.fr/partenaire/depotcurl", form, {
    headers: {
      ...form.getHeaders(),
    },
  })

  return data
}

/**
 * @description Generate a CSV with eligible offers for Pole Emploi integration
 */
export const exportPE = async ({ db }): Promise<void> => {
  const csvPath = new URL("./exportPE.csv", import.meta.url)
  const buffer = []

  const [lowerLimit, upperLimit] = [dayjs().subtract(90, "days").toDate(), dayjs().toDate()]
  const offres = await db
    .collection("jobs")
    .find({ job_creation_date: { $gt: lowerLimit, $lt: upperLimit } })
    .toArray()

  logger.info("get info from user...")
  await asyncForEach(offres, async (offre) => {
    const user: IUserRecruteur = offre.is_delegated ? await UserRecruteur.findOne({ establishment_siret: offre.cfa_delegated_siret }) : null

    if (typeof offre.rome_detail !== "string" && offre.rome_detail) {
      offre.job_type.map(async (type) => {
        if (offre.rome_detail && typeof offre.rome_detail !== "string") {
          buffer.push({ ...offre, type: type, cfa: user ? pick(user, ["address_detail", "establishment_raison_sociale"]) : null })
        } else {
          stat.ko++
        }
      })
    }
  })

  logger.info("Start stream to CSV...")
  await oleoduc(
    Readable.from(buffer),
    transformData((value) => formatToPe(value)),
    transformIntoCSV({ separator: "|" }),
    createWriteStream(csvPath)
  )

  logger.info("Stats: ", stat)
  logger.info("Send CSV...")

  const response = await sendCsvToPE(path.resolve(csvPath.pathname))

  logger.info(`CSV sent (${response})`)
}
