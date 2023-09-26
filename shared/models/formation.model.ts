import { z } from "zod"

import { zObjectId } from "./common"

// Define schemas for nested objects
const geoCoordSchema = z.string()

// Define schemas for each interface
const etablissementFormateurSchema = z
  .object({
    etablissement_formateur_id: z.string(),
    etablissement_formateur_siret: z.string(),
    etablissement_formateur_enseigne: z.string(),
    etablissement_formateur_uai: z.string(),
    etablissement_formateur_type: z.string(),
    etablissement_formateur_conventionne: z.string(),
    etablissement_formateur_declare_prefecture: z.string(),
    etablissement_formateur_datadock: z.string(),
    etablissement_formateur_adresse: z.string(),
    etablissement_formateur_code_postal: z.string(),
    etablissement_formateur_code_commune_insee: z.string(),
    etablissement_formateur_localite: z.string(),
    etablissement_formateur_complement_adresse: z.string(),
    etablissement_formateur_cedex: z.string(),
    etablissement_formateur_entreprise_raison_sociale: z.string(),
    geo_coordonnees_etablissement_formateur: geoCoordSchema,
    etablissement_formateur_region: z.string(),
    etablissement_formateur_num_departement: z.string(),
    etablissement_formateur_nom_departement: z.string(),
    etablissement_formateur_nom_academie: z.string(),
    etablissement_formateur_num_academie: z.string(),
    etablissement_formateur_siren: z.string(),
    etablissement_formateur_courriel: z.string(),
    etablissement_formateur_published: z.boolean(),
    etablissement_formateur_catalogue_published: z.boolean(),
    rncp_etablissement_formateur_habilite: z.boolean(),
    etablissement_formateur_date_creation: z.date(),
  })
  .strict()
  .deepPartial()

const etablissementGestionnaireSchema = z
  .object({
    etablissement_gestionnaire_id: z.string(),
    etablissement_gestionnaire_siret: z.string(),
    etablissement_gestionnaire_enseigne: z.string(),
    etablissement_gestionnaire_uai: z.string(),
    etablissement_gestionnaire_type: z.string(),
    etablissement_gestionnaire_conventionne: z.string(),
    etablissement_gestionnaire_declare_prefecture: z.string(),
    etablissement_gestionnaire_datadock: z.string(),
    etablissement_gestionnaire_adresse: z.string(),
    etablissement_gestionnaire_code_postal: z.string(),
    etablissement_gestionnaire_code_commune_insee: z.string(),
    etablissement_gestionnaire_localite: z.string(),
    etablissement_gestionnaire_complement_adresse: z.string(),
    etablissement_gestionnaire_cedex: z.string(),
    etablissement_gestionnaire_entreprise_raison_sociale: z.string(),
    geo_coordonnees_etablissement_gestionnaire: geoCoordSchema,
    etablissement_gestionnaire_region: z.string(),
    etablissement_gestionnaire_num_departement: z.string(),
    etablissement_gestionnaire_nom_departement: z.string(),
    etablissement_gestionnaire_nom_academie: z.string(),
    etablissement_gestionnaire_num_academie: z.string(),
    etablissement_gestionnaire_siren: z.string(),
    etablissement_gestionnaire_courriel: z.string(),
    etablissement_gestionnaire_published: z.boolean(),
    etablissement_gestionnaire_catalogue_published: z.boolean(),
    rncp_etablissement_gestionnaire_habilite: z.boolean(),
    etablissement_gestionnaire_date_creation: z.date(),
  })
  .strict()
  .deepPartial()

const etablissementReferenceSchema = z
  .object({
    etablissement_reference: z.string(),
    etablissement_reference_published: z.boolean(),
    etablissement_reference_habilite_rncp: z.boolean(),
    etablissement_reference_certifie_qualite: z.boolean(),
    etablissement_reference_date_creation: z.date(),
  })
  .strict()
  .deepPartial()

// Define a schema for a single string or an array of strings
const stringOrArraySchema = z.union([z.string(), z.array(z.string())])

// Define the Zod schema for IFormationCatalogue
export const zFormationCatalogueSchema = z
  .object({
    _id: zObjectId,
    cle_ministere_educatif: z.string(),
    cfd: z.string(),
    cfd_specialite: z.record(z.unknown()), // Assuming cfd_specialite is an object
    cfa_outdated: z.boolean(),
    cfd_date_fermeture: z.date(),
    cfd_entree: z.string(),
    mef_10_code: z.string(),
    mefs_10: z.array(z.string()),
    nom_academie: z.string(),
    num_academie: z.string(),
    code_postal: z.string(),
    code_commune_insee: z.string(),
    num_departement: z.string(),
    nom_departement: z.string(),
    region: z.string(),
    localite: z.string(),
    uai_formation: z.string(),
    nom: z.string(),
    intitule_long: z.string(),
    intitule_court: z.string(),
    diplome: z.string(),
    niveau: z.string(),
    onisep_url: z.string(),
    onisep_intitule: z.string(),
    onisep_libelle_poursuite: z.string(),
    onisep_lien_site_onisepfr: z.string(),
    onisep_discipline: z.string(),
    onisep_domaine_sousdomaine: z.string(),
    rncp_code: z.string(),
    rncp_intitule: z.string(),
    rncp_eligible_apprentissage: z.boolean().nullish(),
    rncp_details: z.record(z.unknown()), // Assuming rncp_details is an object
    rome_codes: z.array(z.string()),
    capacite: z.string(),
    duree: z.string(),
    annee: z.string(),
    email: z.string(),
    parcoursup_statut: z.string(),
    parcoursup_error: z.string(),
    parcoursup_statut_history: z.array(z.record(z.unknown())),
    parcoursup_reference: z.boolean(),
    parcoursup_a_charger: z.boolean(),
    parcoursup_id: z.string(),
    affelnet_reference: z.boolean(),
    affelnet_a_charger: z.boolean(),
    affelnet_statut: z.string(),
    affelnet_statut_history: z.array(z.record(z.unknown())),
    source: z.string(),
    commentaires: z.string(),
    opcos: z.array(z.string()),
    info_opcos: z.number(),
    info_opcos_intitule: z.string(),
    published: z.boolean(),
    rco_published: z.boolean(),
    draft: z.boolean(),
    created_at: z.date(),
    updates_history: z.array(z.record(z.unknown())),
    last_update_at: z.date(),
    last_update_who: z.string(),
    to_update: z.boolean(),
    update_error: z.string(),
    lieu_formation_geo_coordonnees: z.string(),
    lieu_formation_adresse: z.string(),
    lieu_formation_adresse_computed: z.string(),
    lieu_formation_siret: z.string(),
    id_rco_formation: z.string(),
    id_formation: z.string(),
    id_action: z.string(),
    ids_action: z.array(z.string()),
    id_certifinfo: z.string(),
    tags: z.array(z.string()),
    libelle_court: stringOrArraySchema,
    niveau_formation_diplome: z.string(),
    affelnet_infos_offre: z.string(),
    affelnet_code_nature: z.string(),
    affelnet_secteur: z.string(),
    affelnet_raison_depublication: z.string(),
    bcn_mefs_10: z.array(z.record(z.unknown())), // Assuming bcn_mefs_10 is an object array
    editedFields: z.record(z.unknown()), // Assuming editedFields is an object
    parcoursup_raison_depublication: z.string(),
    distance_lieu_formation_etablissement_formateur: z.number(),
    niveau_entree_obligatoire: z.number(),
    entierement_a_distance: z.boolean(),
    catalogue_published: z.boolean(),
    contenu: z.string(),
    objectif: z.string(),
    date_debut: z.array(z.date()),
    date_fin: z.array(z.date()),
    modalites_entrees_sorties: z.array(z.boolean()),
  })
  .extend(etablissementFormateurSchema.shape)
  .extend(etablissementGestionnaireSchema.shape)
  .extend(etablissementReferenceSchema.shape)

export type IFormationCatalogue = z.output<typeof zFormationCatalogueSchema>
