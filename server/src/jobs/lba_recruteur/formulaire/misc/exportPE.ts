import { createWriteStream } from "fs"
import { oleoduc, transformData, transformIntoCSV } from "oleoduc"
import dayjs from "../../../../common/dayjs.js"
import { runScript } from "../../../scriptWrapper.js"

const stat = { ok: 0, ko: 0 }

const formatToPe = (x) => {
  const appellation = x.rome_detail.appellations.find((v) => v.libelle === x.rome_appellation_label)
  const adresse = x.adresse_detail
  const [latitude, longitude] = x.geo_coordonnees.split(",")

  if (!appellation || !adresse || !latitude || !longitude) {
    stat.ko++
    return
  }

  const formatDate = (date) => dayjs(date).format("JJ/MM/AAAA")

  return {
    Par_ref_offre: x.id_offre,
    Par_cle: "LA BONNEALTERNANCE",
    Par_nom: "LA BONNEALTERNANCE",
    Par_URL_offre: `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&type=matcha&itemId=${x.id_offre}`,
    Code_rome: x.romes[0],
    Code_OGR: appellation.code,
    Libelle_metier_OGR: appellation.libelle,
    Description: x.rome_detail.definition,
    Off_experience_duree_min: null,
    Off_experience_duree_max: null,
    Exp_cle: "D",
    Exp_libelle: null,
    Dur_cle_experience: null,
    Dur_libelle_experience: null,
    Off_experience_commentaire: null,
    Qua_cle: null,
    Qua_libelle: null,
    SCN_cle: x.code_naf,
    SCN_libelle: x.libelle_naf,
    Tfm_cle_1: null,
    Tfm_libelle_1: null,
    Dfm_cle_1: x.rome_detail.domaineProfessionnel.code,
    Dfm_libelle_1: x.rome_detail.domaineProfessionnel.libelle,
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
    NTC_cle: "CDD",
    NTC_libelle: null,
    TCO_cle: " “APP” ou “PRO” + dupliquer l’offre si le recruteur a indiqué les 2 types de contrats sur LBA nomenclature à revérifier",
    TCO_libelle: null,
    Off_contrat_duree_MO: x.duree_contrat,
    Off_contrat_duree_JO: null,
    Off_adr_id: null,
    Off_adr_norme: null,
    Off_adr_compl_1: null,
    Off_adr_compl_2: null,
    Off_adr_no_voie: adresse.numero_voie,
    Off_adr_nom_voie: adresse.nom_voie,
    CPO_cle: null,
    COM_cle: adresse.code_insee_localite,
    COM_libelle: null,
    DEP_cle: adresse.code_postal.slice(0, 2),
    DEP_libelle: null,
    REG_cle: null,
    REG_libelle: adresse.localite,
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
    Off_date_creation: formatDate(x.date_creation),
    Off_date_modification: formatDate(x.date_mise_a_jour),
    OST_poste_restant_nb: x.quantite,
    Off_client_final_siret:
      "siret Vérifier avec PE comment sont exploitées les données (siret, adresse, …) client final et etab. Pour savoir si on doit mettre en place des règles de gestion aprituclières pour les offres mandatées",
    Off_client_final_nom: " raison_sociale",
    Off_etab_enseigne: null,
    Col_cle: null,
    Col_nom: null,
    Col_URL_offre: null,
    Version: null,
    Type_mouvement: "C",
    Date_debut_contrat: x.date_debut_apprentissage,
    Motif_suppression: null,
    Description_entreprise: x.description ?? null,
    Off_etab_siret: x.gestionnaire,
    Id_recruteur: null,
    Civ_correspondant: null,
    Nom_correspondant: null,
    Prenom_correspondant: null,
    Tel_correspondant: null,
    Mail_correspondant: null,
    Libelle_etab: " Userrecruteurs.Raison_Sociale associée au SIRET gestionnaire",
    Num_voie_etab: " Numéro de la voie où se situe l’entreprise, issue de l’API Adresse et liée au SIRET gestionnaire",
    Type_voie_etab: " Type de la voie où se situe l’entreprise, issue de l’API Adresse et liée au SIRET gestionnaire",
    Lib_voie_etab: " Libellé de la voie où se situe l’entreprise, issue de l’API Adresse et liée au SIRET gestionnaire",
    Cplt_adresse_1: null,
    Cplt_adresse_2: null,
    Code_postal_etab: null,
    Code_commune_etab: " Code INSEE de l acommune où se situe l’entreprise, issue de l’API Adresse et liée au SIRET gestionnaire",
    Serviceb: null,
    Mode_diffusion: "O",
    Rappel_b: null,
    Mode_presentationb: null,
    Emploi_metier_iscob: null,
  }
}

runScript(async ({ db }) => {
  const path = new URL("./exportPE.csv", import.meta.url)

  await oleoduc(
    db.collection("offres").find({}),
    transformData((value) => {
      if (value.rome_detail) {
        stat.ok++
        return formatToPe(value)
      } else {
        stat.ko++
      }
    }),
    transformIntoCSV(),
    createWriteStream(path)
  )

  return stat
})
