import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { ZPointGeometry } from "./address.model.js"
import { IModelDescriptor, zObjectId } from "./common.js"

// Define schemas for nested objects
const geoCoordSchema = z.string()

// Define schemas for each interface
const etablissementFormateurSchema = z
  .object({
    etablissement_formateur_id: z.string().nullish(),
    etablissement_formateur_siret: extensions.siret.nullish(),
    etablissement_formateur_enseigne: z.string().nullish(),
    etablissement_formateur_uai: z.string().nullish(),
    etablissement_formateur_type: z.string().nullish(),
    etablissement_formateur_conventionne: z.string().nullish(),
    etablissement_formateur_declare_prefecture: z.string().nullish(),
    etablissement_formateur_datadock: z.string().nullish(),
    etablissement_formateur_adresse: z.string().nullish(),
    etablissement_formateur_code_postal: z.string().nullish(),
    etablissement_formateur_code_commune_insee: z.string().nullish(),
    etablissement_formateur_localite: z.string().nullish(),
    etablissement_formateur_complement_adresse: z.string().nullish(),
    etablissement_formateur_cedex: z.string().nullish(),
    etablissement_formateur_entreprise_raison_sociale: z.string().nullish(),
    geo_coordonnees_etablissement_formateur: geoCoordSchema.nullish(),
    etablissement_formateur_region: z.string().nullish(),
    etablissement_formateur_num_departement: z.string().nullish(),
    etablissement_formateur_nom_departement: z.string().nullish(),
    etablissement_formateur_nom_academie: z.string().nullish(),
    etablissement_formateur_num_academie: z.string().nullish(),
    etablissement_formateur_siren: z.string().nullish(),
    etablissement_formateur_courriel: z.string().nullish(),
    etablissement_formateur_published: z.boolean().nullish(),
    etablissement_formateur_catalogue_published: z.boolean().nullish(),
    rncp_etablissement_formateur_habilite: z.boolean().nullish(),
    etablissement_formateur_date_creation: z.date().nullish(),
  })
  .strict()
  .deepPartial()

const etablissementGestionnaireSchema = z
  .object({
    etablissement_gestionnaire_id: z.string().nullish(),
    etablissement_gestionnaire_siret: extensions.siret.nullish(),
    etablissement_gestionnaire_enseigne: z.string().nullish(),
    etablissement_gestionnaire_uai: z.string().nullish(),
    etablissement_gestionnaire_type: z.string().nullish(),
    etablissement_gestionnaire_conventionne: z.string().nullish(),
    etablissement_gestionnaire_declare_prefecture: z.string().nullish(),
    etablissement_gestionnaire_datadock: z.string().nullish(),
    etablissement_gestionnaire_adresse: z.string().nullish(),
    etablissement_gestionnaire_code_postal: z.string().nullish(),
    etablissement_gestionnaire_code_commune_insee: z.string().nullish(),
    etablissement_gestionnaire_localite: z.string().nullish(),
    etablissement_gestionnaire_complement_adresse: z.string().nullish(),
    etablissement_gestionnaire_cedex: z.string().nullish(),
    etablissement_gestionnaire_entreprise_raison_sociale: z.string().nullish(),
    geo_coordonnees_etablissement_gestionnaire: geoCoordSchema.nullish(),
    etablissement_gestionnaire_region: z.string().nullish(),
    etablissement_gestionnaire_num_departement: z.string().nullish(),
    etablissement_gestionnaire_nom_departement: z.string().nullish(),
    etablissement_gestionnaire_nom_academie: z.string().nullish(),
    etablissement_gestionnaire_num_academie: z.string().nullish(),
    etablissement_gestionnaire_siren: z.string().nullish(),
    etablissement_gestionnaire_courriel: z.string().nullish(),
    etablissement_gestionnaire_published: z.boolean().nullish(),
    etablissement_gestionnaire_catalogue_published: z.boolean().nullish(),
    rncp_etablissement_gestionnaire_habilite: z.boolean().nullish(),
    etablissement_gestionnaire_date_creation: z.date().nullish(),
  })
  .strict()
  .deepPartial()

const etablissementReferenceSchema = z
  .object({
    etablissement_reference: z.string().nullish(),
    etablissement_reference_published: z.boolean().nullish(),
    etablissement_reference_habilite_rncp: z.boolean().nullish(),
    etablissement_reference_certifie_qualite: z.boolean().nullish(),
    etablissement_reference_date_creation: z.date().nullish(),
  })
  .strict()
  .deepPartial()

// Define a schema for a single string or an array of strings
const stringOrArraySchema = z.union([z.string(), z.array(z.string())])

const collectionName = "formationcatalogues" as const

// Define the Zod schema for IFormationCatalogue
export const zFormationCatalogueSchema = z
  .object({
    _id: zObjectId,
    cle_ministere_educatif: z.string().nullish(),
    cfd: z.string(),
    cfd_specialite: z.string().nullish(),
    cfd_outdated: z.boolean().nullish(),
    cfd_date_fermeture: z.date().nullish(),
    cfd_entree: z.string().nullish(),
    mef_10_code: z.string().nullish(),
    mefs_10: z.array(z.string()).nullish(),
    nom_academie: z.string().nullish(),
    num_academie: z.string().nullish(),
    code_postal: z.string().nullish(),
    code_commune_insee: z.string().nullish(),
    num_departement: z.string().nullish(),
    nom_departement: z.string().nullish(),
    region: z.string().nullish(),
    localite: z.string().nullish(),
    uai_formation: z.string().nullish(),
    nom: z.string().nullish(),
    intitule_long: z.string().nullish(),
    intitule_court: z.string().nullish(),
    intitule_rco: z.string().nullish(),
    diplome: z.string().nullish(),
    niveau: z.string().nullish(),
    onisep_url: z.string().nullish(),
    onisep_intitule: z.string().nullish(),
    onisep_libelle_poursuite: z.string().nullish(),
    onisep_lien_site_onisepfr: z.string().nullish(),
    onisep_discipline: z.string().nullish(),
    onisep_domaine_sousdomaine: z.string().nullish(),
    rncp_code: z.string().nullish(),
    rncp_intitule: z.string().nullish(),
    rncp_eligible_apprentissage: z.boolean().nullish().nullish(),
    rncp_details: z.record(z.unknown()).nullish(),
    rome_codes: z.array(z.string()).nullish(),
    capacite: z.string().nullish(),
    duree: z.string().nullish(),
    annee: z.string().nullish(),
    email: z.string().nullish(),
    parcoursup_statut: z.string().nullish(),
    parcoursup_error: z.string().nullish(),
    parcoursup_statut_history: z.array(z.record(z.unknown())).nullish(),
    parcoursup_reference: z.boolean().nullish(),
    parcoursup_a_charger: z.boolean().nullish(),
    parcoursup_id: z.string().nullish(),
    parcoursup_visible: z.boolean().nullish(),
    affelnet_reference: z.boolean().nullish(),
    affelnet_a_charger: z.boolean().nullish(),
    affelnet_statut: z.string().nullish(),
    affelnet_statut_history: z.array(z.record(z.unknown())).nullish(),
    affelnet_visible: z.boolean().nullish(),
    source: z.string().nullish(),
    commentaires: z.string().nullish(),
    opcos: z.array(z.string()).nullish(),
    info_opcos: z.number().nullish(),
    info_opcos_intitule: z.string().nullish(),
    published: z.boolean().nullish(),
    rco_published: z.boolean().nullish(),
    draft: z.boolean().nullish(),
    created_at: z.string().nullish(),
    updates_history: z.array(z.record(z.unknown())).nullish(),
    last_update_at: z.string().nullish(),
    last_update_who: z.string().nullish(),
    to_update: z.boolean().nullish(),
    update_error: z.string().nullish(),
    lieu_formation_geo_coordonnees: z.string().nullish(),
    lieu_formation_geopoint: ZPointGeometry.nullish(),
    lieu_formation_adresse: z.string().nullish(),
    lieu_formation_adresse_computed: z.string().nullish(),
    lieu_formation_siret: extensions.siret.nullish(),
    id_rco_formation: z.string().nullish(),
    id_formation: z.string().nullish(),
    id_action: z.string().nullish(),
    ids_action: z.array(z.string()).nullish(),
    id_certifinfo: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    libelle_court: stringOrArraySchema.nullish(),
    niveau_formation_diplome: z.string().nullish(),
    affelnet_infos_offre: z.string().nullish(),
    affelnet_code_nature: z.string().nullish(),
    affelnet_secteur: z.string().nullish(),
    affelnet_raison_depublication: z.string().nullish(),
    bcn_mefs_10: z.array(z.record(z.unknown())).nullish(),
    editedFields: z.record(z.unknown()).nullish(),
    parcoursup_raison_depublication: z.string().nullish(),
    distance_lieu_formation_etablissement_formateur: z.number().nullish(),
    niveau_entree_obligatoire: z.number().nullish(),
    entierement_a_distance: z.boolean().nullish(),
    catalogue_published: z.boolean().nullish(),
    contenu: z.string().nullish(),
    objectif: z.string().nullish(),
    date_debut: z.array(z.string()).nullish(),
    date_fin: z.array(z.string()).nullish(),
    modalites_entrees_sorties: z.array(z.boolean()).nullish(),
    num_tel: z.string().nullable().describe("Numéro de téléphone de contact"),
    distance: z.number().nullish(),
  })
  .strict()
  .extend(etablissementFormateurSchema.shape)
  .extend(etablissementGestionnaireSchema.shape)
  .extend(etablissementReferenceSchema.shape)
  .openapi("FormationCatalogue")

export const zFormationCatalogueSchemaNew = zFormationCatalogueSchema.omit({ _id: true })

export type IFormationCatalogue = z.output<typeof zFormationCatalogueSchema>

export default {
  zod: zFormationCatalogueSchema,
  indexes: [
    [{ lieu_formation_geopoint: "2dsphere", rome_codes: 1, diploma: 1 }, {}],
    [{ cle_ministere_educatif: 1 }, {}],
    [{ rome_codes: 1 }, {}],
    [{ rncp_code: 1 }, {}],
    [{ niveau: 1 }, {}],
    [{ catalogue_published: 1 }, {}],
    [{ cfd: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
