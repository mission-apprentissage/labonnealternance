import { stringify } from "csv-stringify"
import { createWriteStream } from "fs"
import type { Filter } from "mongodb"
import path from "path"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import dayjs from "shared/helpers/dayjs"
import { ZAdresseCFA } from "shared/models/address.model"
import type { ICFA } from "shared/models/cfa.model"
import { type IEntreprise, type IReferentielRome, JOB_STATUS_ENGLISH, ZAdresseV3 } from "shared/models/index"
import { type IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { pipeline, Readable, Transform } from "stream"
import { promisify } from "util"
import { sendCsvToFranceTravail } from "@/common/apis/franceTravail/franceTravail.client"
import { logger } from "@/common/logger"
import { getDepartmentInfos } from "@/common/territoires"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import type { FTOffre } from "@/jobs/partenaireExport/FTExport.types"
import { buildLbaUrl } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

const pipelineAsync = promisify(pipeline)

const formatDate = (date: Date | null) => (date ? dayjs(date).format("DD/MM/YYYY") : null)

type DBJob = IJobsPartnersOfferPrivate & { referentielRome: IReferentielRome; entreprise: IEntreprise; cfa?: ICFA }

export const offerToFTOffer = (offre: DBJob) => {
  const { referentielRome, workplace_address_zipcode, cfa } = offre
  const addressPart = jobToFTOfferAddress(offre)
  //Récupération de l'appellation dans le rome_detail pour identifier le code OGR
  const appellation = referentielRome.appellations.find((appellation) => appellation.libelle === offre.offer_rome_appellation)

  if (!appellation || !addressPart) {
    return
  }

  const romeCode = offre.offer_rome_codes.at(0)
  const [longitude, latitude] = offre.workplace_geopoint.coordinates
  const ntcCle = offre.contract_type.includes("Apprentissage") ? "E2" : "FS"

  const companyLabel = offre.workplace_legal_name || offre.workplace_name || offre.workplace_brand
  const departmentInfos = workplace_address_zipcode ? getDepartmentInfos(workplace_address_zipcode) : null
  const cfaAddress = jobToCfaAddress(offre)

  const ftOffre: FTOffre = {
    Par_ref_offre: `${ntcCle}-${offre._id}`,
    Par_cle: "LABONNEALTERNANCE",
    Par_nom: "LABONNEALTERNANCE",
    Par_URL_offre: buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, offre._id, null, offre.offer_rome_appellation ?? undefined),
    Code_rome: romeCode,
    Code_OGR: parseInt(appellation.code_ogr, 10),
    Libelle_metier_OGR: appellation.libelle,
    Description: offre.offer_description,
    Off_experience_duree_min: null,
    Off_experience_duree_max: null,
    Exp_cle: "D",
    Exp_libelle: null,
    Dur_cle_experience: null,
    Dur_libelle_experience: null,
    Off_experience_commentaire: null,
    Qua_cle: null,
    Qua_libelle: null,
    SCN_cle: offre.workplace_naf_code,
    SCN_libelle: offre.workplace_naf_label,
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
    Off_contrat_duree_MO: offre.contract_duration,
    Off_contrat_duree_JO: null,
    Off_adr_id: null,
    Off_adr_norme: null,
    Off_adr_compl_1: null,
    Off_adr_compl_2: null,
    Off_adr_no_voie: null,
    Off_adr_nom_voie: null,
    CPO_cle: null,
    COM_cle: null,
    COM_libelle: null,
    DEP_cle: departmentInfos?.code,
    DEP_libelle: null,
    REG_cle: departmentInfos?.region.code,
    REG_libelle: null,
    Pay_cle: null,
    Pay_libelle: null,
    CON_cle: null,
    CON_libelle: null,
    Coordonnee_geo_loc_1: latitude.toString(),
    Coordonnee_geo_loc_2: longitude.toString(),
    PCO_cle_1: null,
    PCO_libelle_1: null,
    PCO_exi_cle_1: null,
    PCO_exi_libelle_1: null,
    PCO_cle_2: null,
    PCO_libelle_2: null,
    PCO_exi_cle_2: null,
    PCO_exi_libelle_2: null,
    Off_date_creation: formatDate(offre.created_at),
    Off_date_modification: formatDate(offre.updated_at),
    OST_poste_restant_nb: offre.offer_opening_count,
    Off_client_final_siret: offre.workplace_siret,
    Off_client_final_nom: undefined,
    Col_cle: null,
    Col_nom: null,
    Col_URL_offre: null,
    Version: null,
    Type_mouvement: "C",
    Date_debut_contrat: formatDate(offre.contract_start),
    Motif_suppression: null,
    Description_entreprise: null,
    Id_recruteur: null,
    Civ_correspondant: null,
    Nom_correspondant: null,
    Prenom_correspondant: null,
    Tel_correspondant: null,
    Mail_correspondant: null,
    Off_etab_enseigne: offre.is_delegated ? offre.cfa_legal_name : companyLabel,
    Off_etab_siret: offre.is_delegated ? offre.cfa_siret : offre.workplace_siret,
    Libelle_etab: cfa?.raison_sociale,
    Num_voie_etab: null,
    Type_voie_etab: null,
    Lib_voie_etab: null,
    Cplt_adresse_1: null,
    Cplt_adresse_2: null,
    Code_postal_etab: cfaAddress?.code_postal,
    Code_commune_etab: cfaAddress?.localite,
    Service: null,
    Mode_diffusion: "O",
    Rappel: null,
    Mode_presentation: null,
    Emploi_metier_isco: null,
    ...addressPart,
  }
  return ftOffre
}

const jobToCfaAddress = (job: DBJob) => {
  const { cfa } = job
  const parseResult = ZAdresseCFA.safeParse(cfa?.address_detail)
  return parseResult.data
}

const jobToFTOfferAddress = (job: DBJob): Partial<FTOffre> | null => {
  const { cfa, entreprise } = job
  if (cfa) {
    const adresse = jobToCfaAddress(job)
    if (!adresse) {
      return null
    }
    return {
      COM_cle: adresse.code_insee,
      COM_libelle: adresse.localite,
    }
  }
  const adresse = ZAdresseV3.safeParse(entreprise.address_detail).data
  if (!adresse) {
    return null
  }
  return {
    Off_adr_compl_1: adresse.complement_adresse,
    Off_adr_no_voie: adresse.numero_voie,
    Off_adr_nom_voie: [adresse.type_voie, adresse.libelle_voie].filter((x) => x).join(" "),
    COM_cle: adresse.code_commune,
    COM_libelle: adresse.libelle_commune,
    Pay_libelle: adresse.libelle_pays_etranger ?? "France",
  }
}

const getJobsToExport = async () => {
  const minDate = dayjs().subtract(60, "days").toDate()

  const jobPartnerFilter: Filter<IJobsPartnersOfferPrivate> = {
    offer_status: JOB_STATUS_ENGLISH.ACTIVE,
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    updated_at: { $gt: minDate },
  }
  const jobs = (await getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: jobPartnerFilter,
      },
      {
        $lookup: {
          from: "entreprises",
          localField: "workplace_siret",
          foreignField: "siret",
          as: "entreprise",
        },
      },
      {
        $unwind: "$entreprise",
      },
      {
        $lookup: {
          from: "referentielromes",
          localField: "offer_rome_codes",
          foreignField: "rome.code_rome",
          as: "referentielRome",
        },
      },
      {
        $unwind: "$referentielRome",
      },
    ])
    .toArray()) as DBJob[]

  return jobs
}

const generateCsvFile = async (csvPath: URL, jobs: DBJob[]) => {
  const source = Readable.from(jobs)
  const stringifier = stringify({ header: true, encoding: "utf8", delimiter: "|" })
  const destination = createWriteStream(csvPath)
  const transform = new Transform({
    objectMode: true,
    transform(chunk, _, callback) {
      try {
        const transformedChunk = offerToFTOffer(chunk as DBJob)
        callback(null, transformedChunk)
      } catch (error: any) {
        callback(error)
      }
    },
  })
  logger.info("Start stream to CSV")
  await pipelineAsync(source, transform, stringifier, destination)
}

export const exportJobsToFranceTravail = async () => {
  const csvPath = new URL("./exportFT.csv", import.meta.url)
  try {
    const jobs = await getJobsToExport()
    await generateCsvFile(csvPath, jobs)
    logger.info("Send CSV file to France Travail")
    if (config.env === "production") {
      await sendCsvToFranceTravail(path.resolve(csvPath.pathname))
    }
    await notifyToSlack({
      subject: "EXPORT FRANCE TRAVAIL",
      message: `${jobs.length} offres transmises à France Travail`,
    })
  } catch (err) {
    await notifyToSlack({
      subject: "EXPORT FRANCE TRAVAIL",
      message: `Echec de l'export des offres France Travail. ${err}`,
      error: true,
    })
  }
}
