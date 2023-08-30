import { RECRUITER_STATUS } from "../services/constant.service.js"
import { ILbaJobEsResult } from "../services/lbajob.service.types.js"

const matchaMockMandataire: ILbaJobEsResult = {
  //_index: "formulaires",
  //_type: "_doc",
  _id: "id-matcha-test2",
  //_score: null,
  sort: [131.72962325921603],
  _source: {
    _id: "id-matcha-test2",
    establishment_raison_sociale: "OGEC NANTES ERDRE",
    establishment_siret: "48792847500010",
    address: "27 Rue du Ballet",
    geo_coordinates: "47.135965,-1.533265",
    is_delegated: true,
    last_name: "MOREAU",
    first_name: "Claudine",
    phone: "0742424242",
    email: "labonnealternance@apprentissage.beta.gouv.fr",
    origin: "cfa-72vnr",
    status: RECRUITER_STATUS.ACTIF,
    cfa_delegated_siret: "33940141600047",
    naf_code: "7830Z",
    naf_label: "Autre mise à disposition de ressources humaines",
    establishment_size: "20 à 49 salariés",
    establishment_creation_date: "1970-01-14T03:34:30.000Z",
    establishment_id: "_k5X_bClnWGazgpWny6sI",
    jobs: [
      /*{
        libelle: "Conduite d'équipement et de conditionnement",
        niveau: "BTS, DEUST, autres formations niveau (Bac+2)",
        date_debut_apprentissage: "2022-09-12T00:00:00.000Z",
        romes: ["H3301"],
        date_creation: "2022-06-30T00:00:00.000Z",
        date_expiration: "2022-07-30T00:00:00.000Z",
        nombre_prolongation: 0,
        relance_mail_sent: false,
        statut: "Active",
        type: ["Apprentissage"],
        multi_diffuser: null,
        _id: "62bda757812f6400289afe68",
        rome_detail: {
          definition:
            "Conditionne des produits au moyen d'une machine automatisée d'emballage, d'embouteillage, de palettisation selon les règles d'hygiène, de sécurité et les impératifs de production (délais, quantités, qualité). Applique des mesures correctives en cas de dysfonctionnement des équipements et de non-conformité du conditionnement des produits.\\nPeut effectuer le réglage, l'entretien des équipements et réaliser des opérations de marquage, de stockage, d'étiquetage, ...\\nPeut coordonner une équipe (manutentionnaires, opérateurs, ...).",
          competencesDeBase: [
            {
              code: "123601",
              libelle: "Contrôler la sécurité d'une installation",
            },
            {
              code: "123564",
              libelle: "Contrôler le fonctionnement d'un outil ou équipement",
            },
          ],
        },
        elligible_handicap: false,
        quantite: 1,
        duree_contrat: 2,
        rythme_alternance: "2 semaines / 3 semaines",
        date_mise_a_jour: "2022-06-30T13:38:31.979Z",
      },*/
    ],
    createdAt: new Date("2022-06-30T13:36:43.141Z"),
    updatedAt: new Date("2022-06-30T13:38:31.977Z"),
    //__v: 0,
    address_detail: {
      localite: "44840 LES",
      l1: null,
      l2: null,
      l3: null,
      l4: null,
      l5: null,
      l6: null,
      l7: null,
      numero_voie: null,
      type_voie: null,
      nom_voie: null,
      complement_adresse: null,
      code_postal: null,
      code_insee_localite: null,
      cedex: null,
    },
  },
}

const matchaMock: ILbaJobEsResult = {
  //_index: "formulaires",
  //_type: "_doc",
  _id: "id-matcha-test",
  //_score: null,
  _source: {
    _id: "id-matcha-test",
    establishment_raison_sociale: "PIRATE DUMMY",
    establishment_siret: "79823411234513",
    address: "MOULIN DE NULLE PART 24160 SAINT MEDARD D'AILLEURS",
    geo_coordinates: "45.325591,1.092823",
    is_delegated: false,
    last_name: "Pirate",
    first_name: "Jeanne",
    phone: "0606060606",
    email: "labonnealternance@apprentissage.beta.gouv.fr",
    jobs: [
      /*{
        libelle: "Etudes et développement informatique",
        niveau: "Licence, autres formations niveau (Bac+3)",
        date_debut_apprentissage: "2022-09-01T00:00:00.000Z",
        romes: ["M1805"],
        rome_detail: {
          definition:
            "Matcha test ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
          competencesDeBase: [
            {
              code: "106394",
              libelle: "Vérifier et maintenir l'état de propreté des équipements (machines de remplissage, ensachage, étiquetage, ...) et du matériel",
              noeudCompetence: {
                code: "00168",
                libelle: "Maintenance d'équipements de production ou collectifs",
                racineCompetence: {
                  code: "00030",
                  libelle: "Maintenance - entretien technique",
                },
              },
              typeCompetence: "SavoirFaire",
              riasecMineur: "R",
              riasecMajeur: "R",
            },
            {
              code: "123601",
              libelle: "Contrôler la sécurité d'une installation",
              noeudCompetence: {
                code: "00254",
                libelle: "Prévention des risques",
                racineCompetence: {
                  code: "00036",
                  libelle: "Prévention et gestion des risques",
                },
              },
              typeCompetence: "SavoirFaire",
              riasecMineur: "R",
              riasecMajeur: "C",
            },
          ],
        },
        date_creation: "2022-07-09T00:00:00.000Z",
        date_expiration: "2022-08-09T00:00:00.000Z",
        date_mise_a_jour: "2022-07-09T19:08:13.911Z",
        nombre_prolongation: 0,
        relance_mail_sent: false,
        statut: "Active",
        type: ["Apprentissage"],
        multi_diffuser: null,
        elligible_handicap: true,
        quantite: 1,
        duree_contrat: 1,
        _id: "id-matcha-test",
      },*/
    ],
    origin: "matcha",
    opco: "ATLAS",
    idcc: "1486",
    status: RECRUITER_STATUS.ACTIF,
    naf_code: "6201Z",
    naf_label: "Programmation informatique",
    establishment_size: "1 ou 2 salariés",
    establishment_creation_date: "1970-01-17T00:14:20.400Z",
    updatedAt: new Date("2022-07-09T19:12:50.593Z"),
    createdAt: new Date("2022-07-09T18:58:05.497Z"),
  },
  sort: [132.72962325921603],
}

const matchasMock = [matchaMock, matchaMockMandataire]

export { matchasMock, matchaMock, matchaMockMandataire }
