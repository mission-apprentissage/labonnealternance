import { IAPIEtablissement, IEtablissementGouv } from "@/services/etablissement.service.types"

function generateEtablissementGouv(data: Partial<IEtablissementGouv> = {}): IEtablissementGouv {
  return {
    siret: "13002526500013",
    siege_social: true,
    etat_administratif: "A",
    date_fermeture: null,
    enseigne: null,
    activite_principale: {
      code: "84.11Z",
      nomenclature: "NAFRev2",
      libelle: "Administration publique générale",
    },
    tranche_effectif_salarie: {
      de: 100,
      a: 199,
      code: "22",
      date_reference: "2021",
      intitule: "100 à 199 salariés",
    },
    diffusable_commercialement: true,
    status_diffusion: "diffusible",
    date_creation: 1495576800,
    unite_legale: {
      siren: "130025265",
      rna: null,
      siret_siege_social: "13002526500013",
      type: "personne_morale",
      personne_morale_attributs: {
        raison_sociale: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
        sigle: "DINUM",
      },
      personne_physique_attributs: {
        pseudonyme: null,
        prenom_usuel: null,
        prenom_1: null,
        prenom_2: null,
        prenom_3: null,
        prenom_4: null,
        nom_usage: null,
        nom_naissance: null,
        sexe: null,
      },
      categorie_entreprise: "PME",
      status_diffusion: "diffusible",
      diffusable_commercialement: true,
      forme_juridique: {
        code: "7120",
        libelle: "Service central d'un ministère",
      },
      activite_principale: {
        code: "84.11Z",
        nomenclature: "NAFRev2",
        libelle: "Administration publique générale",
      },
      tranche_effectif_salarie: {
        de: 100,
        a: 199,
        code: "22",
        date_reference: "2021",
        intitule: "100 à 199 salariés",
      },
      economie_sociale_et_solidaire: false,
      date_creation: 1495576800,
      etat_administratif: "A",
    },
    adresse: {
      status_diffusion: "diffusible",
      complement_adresse: null,
      numero_voie: "20",
      indice_repetition_voie: null,
      type_voie: "AVENUE",
      libelle_voie: "DE SEGUR",
      code_postal: "75007",
      libelle_commune: "PARIS",
      libelle_commune_etranger: null,
      distribution_speciale: null,
      code_commune: "75107",
      code_cedex: null,
      libelle_cedex: null,
      code_pays_etranger: null,
      libelle_pays_etranger: null,
      acheminement_postal: {
        l1: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
        l2: "",
        l3: "",
        l4: "20 AVENUE DE SEGUR",
        l5: "",
        l6: "75007 PARIS",
        l7: "FRANCE",
      },
    },
    ...data,
  }
}

type IAPIEtablissementInput = Partial<Omit<IAPIEtablissement, "data">> & { data?: Partial<IEtablissementGouv> }

export function generateAPIEtablissementFixture(data: IAPIEtablissementInput): IAPIEtablissement {
  return {
    links: {
      unite_legale: "https://entreprise.api.gouv.fr/v3/insee/sirene/unites_legales/130025265",
    },
    meta: {
      date_derniere_mise_a_jour: 1711753200,
      redirect_from_siret: null,
    },
    data: generateEtablissementGouv(data?.data),
  }
}

export const apiEntrepriseEtablissementFixture = {
  dinum: {
    links: {
      unite_legale: "https://entreprise.api.gouv.fr/v3/insee/sirene/unites_legales/130025265",
    },
    meta: {
      date_derniere_mise_a_jour: 1711753200,
      redirect_from_siret: null,
    },
    data: {
      siret: "13002526500013",
      siege_social: true,
      etat_administratif: "A",
      date_fermeture: null,
      enseigne: null,
      activite_principale: {
        code: "84.11Z",
        nomenclature: "NAFRev2",
        libelle: "Administration publique générale",
      },
      tranche_effectif_salarie: {
        de: 100,
        a: 199,
        code: "22",
        date_reference: "2021",
        intitule: "100 à 199 salariés",
      },
      diffusable_commercialement: true,
      status_diffusion: "diffusible",
      date_creation: 1495576800,
      unite_legale: {
        siren: "130025265",
        rna: null,
        siret_siege_social: "13002526500013",
        type: "personne_morale",
        personne_morale_attributs: {
          raison_sociale: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
          sigle: "DINUM",
        },
        personne_physique_attributs: {
          pseudonyme: null,
          prenom_usuel: null,
          prenom_1: null,
          prenom_2: null,
          prenom_3: null,
          prenom_4: null,
          nom_usage: null,
          nom_naissance: null,
          sexe: null,
        },
        categorie_entreprise: "PME",
        status_diffusion: "diffusible",
        diffusable_commercialement: true,
        forme_juridique: {
          code: "7120",
          libelle: "Service central d'un ministère",
        },
        activite_principale: {
          code: "84.11Z",
          nomenclature: "NAFRev2",
          libelle: "Administration publique générale",
        },
        tranche_effectif_salarie: {
          de: 100,
          a: 199,
          code: "22",
          date_reference: "2021",
          intitule: "100 à 199 salariés",
        },
        economie_sociale_et_solidaire: false,
        date_creation: 1495576800,
        etat_administratif: "A",
      },
      adresse: {
        status_diffusion: "diffusible",
        complement_adresse: null,
        numero_voie: "20",
        indice_repetition_voie: null,
        type_voie: "AVENUE",
        libelle_voie: "DE SEGUR",
        code_postal: "75007",
        libelle_commune: "PARIS",
        libelle_commune_etranger: null,
        distribution_speciale: null,
        code_commune: "75107",
        code_cedex: null,
        libelle_cedex: null,
        code_pays_etranger: null,
        libelle_pays_etranger: null,
        acheminement_postal: {
          l1: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
          l2: "",
          l3: "",
          l4: "20 AVENUE DE SEGUR",
          l5: "",
          l6: "75007 PARIS",
          l7: "FRANCE",
        },
      },
    },
  },
} as const satisfies Record<string, IAPIEtablissement>