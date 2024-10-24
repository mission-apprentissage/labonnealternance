import { createWriteStream } from "fs"
import path from "path"
import { Readable } from "stream"

import { oleoduc, transformData, transformIntoCSV } from "oleoduc"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { JOB_STATUS } from "shared/models"

import { sendCsvToFranceTravail } from "../../common/apis/franceTravail/franceTravail.client"
import { logger } from "../../common/logger"
import { getDepartmentByZipCode } from "../../common/territoires"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import dayjs from "../../services/dayjs.service"

const regex = /^(.*) (\d{4,5}) (.*)$/
const formatDate = (date) => dayjs(date).format("DD/MM/YYYY")
const splitter = (str) => str.split(regex).filter(String)

/**
 * @description format data into Pole Emploi specific fields
 * @param {object} offre
 * @returns {Promise<object>}
 */
const formatToPe = async (offre) => {
  //Récupération de l'appellation dans le rome_detail pour identifier le code OGR
  const appellation = offre.rome_detail.appellations.find((v) => v.libelle === offre.rome_appellation_label)
  const adresse = offre.address_detail
  const [latitude, longitude] = offre.geo_coordinates.split(",")

  const [rue, code_postal, ville] = offre.is_delegated && offre.cfa?.address_detail?.label ? splitter(offre.cfa.address_detail.label) : []

  const ntcCle = offre.type === "Apprentissage" ? "E2" : "FS"

  if (!appellation || !adresse || !latitude || !longitude) {
    return
  }

  return {
    Par_ref_offre: `${ntcCle}-${offre.jobId}`,
    Par_cle: "LABONNEALTERNANCE",
    Par_nom: "LABONNEALTERNANCE",
    Par_URL_offre: `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&type=matcha&itemId=${offre.jobId}`,
    Code_rome: offre.rome_code[0],
    Code_OGR: appellation.code_ogr,
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
    DEP_cle: adresse.code_postal ? adresse.code_postal.slice(0, 2) : "",
    DEP_libelle: null,
    REG_cle: adresse.code_postal ? getDepartmentByZipCode(adresse.code_postal)?.region.code ?? "" : "",
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
 * @description Generate a CSV with eligible offers for Pole Emploi integration
 */
export const exportToFranceTravail = async (): Promise<void> => {
  try {
    const csvPath = new URL("./exportFT.csv", import.meta.url)
    const buffer: any[] = []
    const threshold = dayjs().subtract(30, "days").toDate()

    // Retrieve only active offers
    const offres: any[] = await getDbCollection("jobs")
      .find({
        job_status: JOB_STATUS.ACTIVE,
        recruiterStatus: RECRUITER_STATUS.ACTIF,
        geo_coordinates: { $nin: ["NOT FOUND", null] },
        job_update_date: { $gte: threshold },
        address_detail: { $ne: null },
      })
      .toArray()

    logger.info(`get info from ${offres.length} offers...`)
    await asyncForEach(offres, async (offre) => {
      const cfa = offre.is_delegated ? await getDbCollection("cfas").findOne({ siret: offre.cfa_delegated_siret }) : null

      if (typeof offre.rome_detail !== "string" && offre.rome_detail) {
        offre.job_type.map(async (type) => {
          if (offre.rome_detail && typeof offre.rome_detail !== "string") {
            const cfaFields = cfa ? { address_detail: cfa.address_detail, establishment_raison_sociale: cfa.raison_sociale } : null
            buffer.push({ ...offre, type, cfa: cfaFields })
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

    await sendCsvToFranceTravail(path.resolve(csvPath.pathname))

    await notifyToSlack({
      subject: "EXPORT FRANCE TRAVAIL",
      message: `${buffer.length} offres transmises à France Travail`,
    })
  } catch (err) {
    await notifyToSlack({
      subject: "EXPORT FRANCE TRAVAIL",
      message: `Echec de l'export des offres France Travail. ${err}`,
      error: true,
    })
    throw err
  }
}
