import { z } from "zod"

/**
 * Flat representation of a France Travail offer row, as produced by offerToFTOffer().
 * Field names and nullability match the exporter output exactly.
 * Dates are formatted as DD/MM/YYYY strings (output of dayjs(...).format("DD/MM/YYYY")).
 * Repeated XSD elements (Formation×2, Langue×2, Permis×2) are flattened with _1/_2 suffixes.
 */
export const zFTOffre = z.object({
  // ── Partenaire ──────────────────────────────────────────────────────────────
  Par_ref_offre: z.string().min(1).max(50).describe("Référence partenaire de l'offre"),
  Par_cle: z.string().min(1).max(50).describe("Identifiant du partenaire (clé)"),
  Par_nom: z.string().min(1).max(50).describe("Nom du partenaire (libellé)"),
  Par_URL_offre: z.string().min(1).max(300).describe("URL de l'offre chez le partenaire"),

  // ── ROME ────────────────────────────────────────────────────────────────────
  Code_rome: z.string().nullable().optional().describe("Code ROME (ex: A1234)"),
  Code_OGR: z.number().int().nonnegative().nullable().optional().describe("Code appellation ROME"),
  Libelle_metier_OGR: z.string().min(1).max(293).describe("Libellé métier OGR (appellation ROME)"),

  // ── Description ─────────────────────────────────────────────────────────────
  Description: z.string().min(1).max(4000).describe("Description"),

  // ── Expérience ──────────────────────────────────────────────────────────────
  Off_experience_duree_min: z.number().int().min(0).max(99).nullable().optional().describe("Durée minimum d'expérience"),
  Off_experience_duree_max: z.number().int().min(0).max(99).nullable().optional().describe("Durée maximum d'expérience"),
  Exp_cle: z.string().max(1).nullable().optional().describe("Code du niveau d'exigence de l'expérience (D = débutant accepté, E = exigée)"),
  Exp_libelle: z.string().max(30).nullable().optional().describe("Niveau d'exigence de l'expérience (libellé)"),
  Dur_cle_experience: z.enum(["JO", "MO", "AN"]).nullable().optional().describe("Code du type de durée d'expérience (JO = jours, MO = mois, AN = années)"),
  Dur_libelle_experience: z.string().max(30).nullable().optional().describe("Unité de l'expérience (libellé)"),
  Off_experience_commentaire: z.string().max(36).nullable().optional().describe("Complément sur l'expérience"),

  // ── Qualification ───────────────────────────────────────────────────────────
  Qua_cle: z.number().int().min(1).max(8).nullable().optional().describe("Code niveau de qualification (clé) — valeur de 1 à 8"),
  Qua_libelle: z.string().max(100).nullable().optional().describe("Niveau de qualification (libellé)"),

  // ── Secteur NAF ─────────────────────────────────────────────────────────────
  SCN_cle: z.string().max(5).nullable().optional().describe("Secteur d'activité NAF (clé, ex: 8520Z)"),
  SCN_libelle: z.string().max(100).nullable().optional().describe("Secteur d'activité NAF (libellé)"),

  // ── Formation 1 ─────────────────────────────────────────────────────────────
  Tfm_cle_1: z.enum(["NV1", "NV2", "NV3", "NV4", "NV5", "C12", "C3A", "CFG", "CP4", "AFS"]).nullable().optional().describe("Code du niveau de formation 1 (clé)"),
  Tfm_libelle_1: z.string().max(100).nullable().optional().describe("Libellé du niveau de formation 1"),
  Dfm_cle_1: z.number().int().min(11001).max(99999).nullable().optional().describe("Domaine de formation 1 (clé)"),
  Dfm_libelle_1: z.string().max(100).nullable().optional().describe("Domaine de formation 1 (libellé)"),
  Dfm_exi_cle_1: z.string().max(1).nullable().optional().describe("Niveau d'exigence de la formation 1 (clé) : E (exigée) ou S (souhaitée)"),
  Dfm_exi_libelle_1: z.string().max(30).nullable().optional().describe("Niveau d'exigence de la formation 1 (libellé)"),

  // ── Formation 2 ─────────────────────────────────────────────────────────────
  Tfm_cle_2: z.enum(["NV1", "NV2", "NV3", "NV4", "NV5", "C12", "C3A", "CFG", "CP4", "AFS"]).nullable().optional().describe("Code du niveau de formation 2 (clé)"),
  Tfm_libelle_2: z.string().max(100).nullable().optional().describe("Libellé du niveau de formation 2"),
  Dfm_cle_2: z.number().int().min(11001).max(99999).nullable().optional().describe("Domaine de formation 2 (clé)"),
  Dfm_libelle_2: z.string().max(100).nullable().optional().describe("Domaine de formation 2 (libellé)"),
  Dfm_exi_cle_2: z.string().max(1).nullable().optional().describe("Niveau d'exigence de la formation 2 (clé) : E (exigée) ou S (souhaitée)"),
  Dfm_exi_libelle_2: z.string().max(30).nullable().optional().describe("Niveau d'exigence de la formation 2 (libellé)"),

  // ── Langue 1 ────────────────────────────────────────────────────────────────
  Lan_cle_1: z.string().length(2).nullable().optional().describe("Langue 1 (clé ISO 639-1, 2 caractères)"),
  Lan_libelle_1: z.string().max(100).nullable().optional().describe("Langue 1 (libellé)"),
  NVL_cle_1: z.number().int().min(1).max(5).nullable().optional().describe("Niveau de maîtrise de la langue 1 (clé) — valeur de 1 à 5"),
  NVL_libelle_1: z.string().max(30).nullable().optional().describe("Niveau de maîtrise de la langue 1 (libellé)"),
  Lan_exi_cle_1: z.string().max(1).nullable().optional().describe("Niveau d'exigence de la langue 1 (clé) : E (exigée) ou S (souhaitée)"),
  Lan_exi_libelle_1: z.string().max(30).nullable().optional().describe("Niveau d'exigence de la langue 1 (libellé)"),

  // ── Langue 2 ────────────────────────────────────────────────────────────────
  Lan_cle_2: z.string().length(2).nullable().optional().describe("Langue 2 (clé ISO 639-1, 2 caractères)"),
  Lan_libelle_2: z.string().max(100).nullable().optional().describe("Langue 2 (libellé)"),
  NVL_cle_2: z.number().int().min(1).max(5).nullable().optional().describe("Niveau de maîtrise de la langue 2 (clé) — valeur de 1 à 5"),
  NVL_libelle_2: z.string().max(30).nullable().optional().describe("Niveau de maîtrise de la langue 2 (libellé)"),
  Lan_exi_cle_2: z.string().max(1).nullable().optional().describe("Niveau d'exigence de la langue 2 (clé) : E (exigée) ou S (souhaitée)"),
  Lan_exi_libelle_2: z.string().max(30).nullable().optional().describe("Niveau d'exigence de la langue 2 (libellé)"),

  // ── Salaire ─────────────────────────────────────────────────────────────────
  TSA_cle: z.string().max(1).nullable().optional().describe("Type salaire (clé)"),
  TSA_libelle: z.string().max(30).nullable().optional().describe("Type salaire (libellé)"),
  Off_salaire_min: z.number().nullable().optional().describe("Salaire minimum"),
  Off_salaire_max: z.number().nullable().optional().describe("Salaire maximum"),
  UMO_cle: z.string().max(3).nullable().optional().describe("Unité monétaire (clé, ex: EUR)"),
  UMO_libelle: z.string().max(100).nullable().optional().describe("Unité monétaire (libellé)"),
  Off_salaire_nb_mois: z.number().nullable().optional().describe("Nombre de mois de salaire"),
  Off_salaire_cpt_commentaire: z.string().max(36).nullable().optional().describe("Complément de salaire"),

  // ── Horaire ─────────────────────────────────────────────────────────────────
  Off_travail_hebdo_nb_hh: z.number().int().nonnegative().nullable().optional().describe("Durée hebdomadaire de travail — heures"),
  Off_travail_hebdo_nb_mi: z.number().int().nonnegative().nullable().optional().describe("Durée hebdomadaire de travail — minutes"),
  THO_cle: z.string().max(3).nullable().optional().describe("Type d'horaire de travail (clé)"),
  THO_libelle: z.string().max(100).nullable().optional().describe("Type d'horaire de travail (libellé)"),
  Off_THO_commentaire: z.string().max(36).nullable().optional().describe("Complément horaire de travail"),

  // ── Contrat ─────────────────────────────────────────────────────────────────
  NTC_cle: z.string().max(2).nullable().optional().describe("Nature du contrat (clé) : E2 (apprentissage), FS (professionnalisation)"),
  NTC_libelle: z.string().max(100).nullable().optional().describe("Nature du contrat (libellé)"),
  TCO_cle: z.string().max(3).nullable().optional().describe("Type du contrat (clé, ex: CDD)"),
  TCO_libelle: z.string().max(100).nullable().optional().describe("Type du contrat (libellé)"),
  Off_contrat_duree_MO: z.number().int().nonnegative().nullable().optional().describe("Durée du contrat en mois"),
  Off_contrat_duree_JO: z.number().int().nonnegative().nullable().optional().describe("Durée du contrat en jours"),

  // ── Lieu de travail ─────────────────────────────────────────────────────────
  Off_adr_id: z.number().int().nonnegative().nullable().optional().describe("Identifiant de l'adresse"),
  Off_adr_norme: z.string().max(50).nullable().optional().describe("Norme de l'adresse"),
  Off_adr_compl_1: z.string().max(26).nullable().optional().describe("Complément d'adresse 1"),
  Off_adr_compl_2: z.string().max(26).nullable().optional().describe("Complément d'adresse 2"),
  Off_adr_no_voie: z.string().max(5).nullable().optional().describe("Numéro de voie"),
  Off_adr_nom_voie: z.string().max(26).nullable().optional().describe("Nom de voie"),
  CPO_cle: z.string().max(5).nullable().optional().describe("Code postal"),
  COM_cle: z.string().max(5).nullish().describe("Commune (clé INSEE)"),
  COM_libelle: z.string().max(100).nullable().optional().describe("Commune (libellé)"),
  DEP_cle: z.string().max(3).nullable().optional().describe("Département (clé)"),
  DEP_libelle: z.string().max(100).nullable().optional().describe("Département (libellé)"),
  REG_cle: z.string().max(2).nullable().optional().describe("Région (clé)"),
  REG_libelle: z.string().max(100).nullable().optional().describe("Région (libellé)"),
  Pay_cle: z.string().max(2).nullable().optional().describe("Pays (clé)"),
  Pay_libelle: z.string().max(100).nullish().describe("Pays (libellé)"),
  CON_cle: z.string().max(2).nullable().optional().describe("Continent (clé)"),
  CON_libelle: z.string().max(100).nullable().optional().describe("Continent (libellé)"),
  Coordonnee_geo_loc_1: z.string().nullable().optional().describe("Latitude"),
  Coordonnee_geo_loc_2: z.string().nullable().optional().describe("Longitude"),

  // ── Permis 1 ────────────────────────────────────────────────────────────────
  PCO_cle_1: z.string().max(4).nullable().optional().describe("Permis de conduire 1 (clé)"),
  PCO_libelle_1: z.string().max(100).nullable().optional().describe("Permis de conduire 1 (libellé)"),
  PCO_exi_cle_1: z.string().max(1).nullable().optional().describe("Exigence du permis de conduire 1 (clé) : E (exigé) ou S (souhaité)"),
  PCO_exi_libelle_1: z.string().max(30).nullable().optional().describe("Exigence du permis de conduire 1 (libellé)"),

  // ── Permis 2 ────────────────────────────────────────────────────────────────
  PCO_cle_2: z.string().max(4).nullable().optional().describe("Permis de conduire 2 (clé)"),
  PCO_libelle_2: z.string().max(100).nullable().optional().describe("Permis de conduire 2 (libellé)"),
  PCO_exi_cle_2: z.string().max(1).nullable().optional().describe("Exigence du permis de conduire 2 (clé) : E (exigé) ou S (souhaité)"),
  PCO_exi_libelle_2: z.string().max(30).nullable().optional().describe("Exigence du permis de conduire 2 (libellé)"),

  // ── Dates (format DD/MM/YYYY) ────────────────────────────────────────────────
  Off_date_creation: z.string().nullable().describe("Date de création de l'offre"),
  Off_date_modification: z.string().nullable().optional().describe("Date de modification de l'offre"),

  // ── Divers ──────────────────────────────────────────────────────────────────
  OST_poste_restant_nb: z.number().int().min(1).max(999).nullable().optional().describe("Nombre de postes restants (1-999)"),

  // ── Entreprise ──────────────────────────────────────────────────────────────
  Off_client_final_siret: z.string().nullable().optional().describe("SIRET de l'entreprise cliente finale (14 chiffres)"),
  Off_client_final_nom: z.string().max(52).nullish().describe("Nom de l'entreprise cliente finale"),
  Off_etab_enseigne: z.string().max(52).nullable().optional().describe("Enseigne de l'établissement ayant déposé l'offre"),

  // ── Collecteur ──────────────────────────────────────────────────────────────
  Col_cle: z.string().max(50).nullable().optional().describe("Collecteur si le partenaire est un agrégateur (clé)"),
  Col_nom: z.string().max(50).nullable().optional().describe("Collecteur si le partenaire est un agrégateur (nom)"),
  Col_URL_offre: z.string().max(300).nullable().optional().describe("URL de l'offre chez le collecteur"),

  // ── Groupe "autres" ─────────────────────────────────────────────────────────
  Version: z.string().max(3).nullable().optional().describe("Version du flux (non utilisé)"),
  Type_mouvement: z.enum(["C", "M", "S"]).nullable().optional().describe("Type de mouvement : C (création), M (modification), S (suppression)"),
  Date_debut_contrat: z.string().nullable().optional().describe("Date de début de contrat (format DD/MM/YYYY, non utilisé)"),
  Motif_suppression: z.string().max(3).nullable().optional().describe("Code D92 — motif de suppression de l'offre (non utilisé)"),
  Description_entreprise: z.string().max(500).nullable().optional().describe("Description de l'entreprise"),
  Off_etab_siret: z.string().nullable().optional().describe("Numéro SIRET de l'établissement ayant déposé l'offre (CFA si offre déléguée)"),
  Id_recruteur: z.string().max(10).nullable().optional().describe("Identifiant du recruteur"),
  Civ_correspondant: z.string().max(1).nullable().optional().describe("Civilité du correspondant établissement pour l'offre"),
  Nom_correspondant: z.string().max(25).nullable().optional().describe("Nom du correspondant établissement pour l'offre"),
  Prenom_correspondant: z.string().max(15).nullable().optional().describe("Prénom du correspondant établissement pour l'offre"),
  Tel_correspondant: z.string().max(15).nullable().optional().describe("N° téléphone du correspondant établissement pour l'offre"),
  Mail_correspondant: z.string().max(55).nullable().optional().describe("Mail du correspondant établissement pour l'offre"),
  Libelle_etab: z.string().max(40).nullable().optional().describe("Libellé de l'établissement de contact"),
  Num_voie_etab: z.string().max(5).nullable().optional().describe("Numéro de voie de l'établissement de contact"),
  Type_voie_etab: z.string().max(3).nullable().optional().describe("Type de voie de l'établissement de contact"),
  Lib_voie_etab: z.string().max(26).nullable().optional().describe("Libellé de voie de l'établissement de contact"),
  Cplt_adresse_1: z.string().max(26).nullish().describe("Complément d'adresse n° 1 de l'établissement de contact"),
  Cplt_adresse_2: z.string().max(26).nullable().optional().describe("Complément d'adresse n° 2 de l'établissement de contact"),
  Code_postal_etab: z.string().max(5).nullish().describe("Code postal de l'établissement de contact"),
  Code_commune_etab: z.string().max(5).nullable().optional().describe("Code commune INSEE de l'établissement de contact"),
  Service: z.enum(["1", "2"]).nullable().optional().describe("Service (non utilisé) : 1 ou 2"),
  Mode_diffusion: z.enum(["N", "O"]).nullable().optional().describe("Consentement à la diffusion : O (oui) ou N (non)"),
  Rappel: z.enum(["1", "2"]).nullable().optional().describe("Rappel (non utilisé) : 1 ou 2"),
  Mode_presentation: z.enum(["TEL", "MEL", "ECV", "PDE", "PEL"]).nullable().optional().describe("Mode de présentation des candidats (non utilisé) : TEL, MEL, ECV, PDE ou PEL"),
  Emploi_metier_isco: z.string().max(4).nullable().optional().describe("Emploi métier ISCO (non utilisé)"),
})

export type FTOffre = z.infer<typeof zFTOffre>
