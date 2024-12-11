import { ObjectId } from "bson"

import { IReferentielRome } from "../models"

export function generateReferentielRome(data: Partial<IReferentielRome> = {}): IReferentielRome {
  return {
    _id: new ObjectId(),
    numero: "512",
    rome: {
      code_rome: "M1602",
      intitule: "Opérations administratives",
      code_ogr: "475",
    },
    definition:
      "Exécute des travaux administratifs courants (vérification de documents, frappe et mise en forme de courriers pré-établis, suivi de dossier administratifs, ...) selon l'organisation de la structure ou du service. Peut être en charge d'activités de reprographie et d'archivage. Peut réaliser l'accueil de la structure.",
    acces_metier:
      "Ce métier est accessible avec un diplôme de fin d'études secondaires (brevet des collèges) à Bac (professionnel, Brevet Professionnel, ...) dans le secteur tertiaire. Il est également accessible avec une expérience professionnelle sans diplôme particulier. La maîtrise de l'outil bureautique (traitement de texte, tableur, ...) peut être requise.",
    couple_appellation_rome: [],
    competences: {
      savoir_faire: [
        {
          libelle: "Production, Fabrication",
          items: [
            {
              libelle: "Procéder à l'enregistrement, au tri, à l'affranchissement du courrier",
              code_ogr: "101622",
              coeur_metier: "Principale",
            },
            {
              libelle: "Réaliser des travaux de reprographie",
              code_ogr: "113818",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Gestion des stocks",
          items: [
            {
              libelle: "Contrôler l'état des stocks",
              code_ogr: "116932",
              coeur_metier: null,
            },
            {
              libelle: "Définir des besoins en approvisionnement",
              code_ogr: "125971",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Logistique",
          items: [
            {
              libelle: "Organiser le traitement des commandes",
              code_ogr: "300280",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Relation client",
          items: [
            {
              libelle: "Accueillir, orienter, informer une personne",
              code_ogr: "300361",
              coeur_metier: "Principale",
            },
          ],
        },
        {
          libelle: "Organisation",
          items: [
            {
              libelle: "Contrôler la conformité des données ou des documents",
              code_ogr: "300253",
              coeur_metier: null,
            },
            {
              libelle: "Corriger et mettre en forme un document",
              code_ogr: "300407",
              coeur_metier: null,
            },
            {
              libelle: "Numériser des documents, médias ou supports techniques",
              code_ogr: "300424",
              coeur_metier: null,
            },
            {
              libelle: "Utiliser les outils bureautiques",
              code_ogr: "300426",
              coeur_metier: "Principale",
            },
            {
              libelle: "Établir, mettre à jour un dossier, une base de données",
              code_ogr: "300431",
              coeur_metier: "Principale",
            },
          ],
        },
      ],
      savoir_etre_professionnel: [
        {
          libelle: "Faire preuve de rigueur et de précision",
          code_ogr: "300490",
          coeur_metier: null,
        },
        {
          libelle: "Organiser son travail selon les priorités et les objectifs",
          code_ogr: "300483",
          coeur_metier: null,
        },
        {
          libelle: "Être à l'écoute, faire preuve d'empathie",
          code_ogr: "300412",
          coeur_metier: null,
        },
      ],
      savoirs: [
        {
          libelle: "Domaines d'expertise",
          items: [
            {
              libelle: "Gestion administrative du courrier",
              code_ogr: "120992",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Normes et procédés",
          items: [
            {
              libelle: "Méthode de classement et d'archivage",
              code_ogr: "121411",
              coeur_metier: null,
            },
          ],
        },
        {
          libelle: "Techniques professionnelles",
          items: [
            {
              libelle: "Techniques de numérisation",
              code_ogr: "109659",
              coeur_metier: null,
            },
          ],
        },
      ],
    },
    appellations: [
      {
        libelle: "Agent administratif / Agente administrative",
        libelle_court: "Agent administratif / Agente administrative",
        code_ogr: "10349",
      },
      {
        libelle: "Auxiliaire de bureau",
        libelle_court: "Auxiliaire de bureau",
        code_ogr: "11445",
      },
      {
        libelle: "Employé / Employée aux archives",
        libelle_court: "Employé / Employée aux archives",
        code_ogr: "14751",
      },
      {
        libelle: "Employé / Employée de bureau",
        libelle_court: "Employé / Employée de bureau",
        code_ogr: "14757",
      },
      {
        libelle: "Employé administratif / Employée administrative",
        libelle_court: "Employé administratif / Employée administrative",
        code_ogr: "14748",
      },
    ],
    contextes_travail: [
      {
        libelle: "Conditions de travail et risques professionnels",
        items: [
          {
            libelle: "Déplacements professionnels",
            code_ogr: "300779",
          },
        ],
      },
      {
        libelle: "Types de structures",
        items: [
          {
            libelle: "Association",
            code_ogr: "300849",
          },
        ],
      },
    ],
    mobilites: [
      {
        rome_cible: "M1606 - Saisie de données",
        code_org_rome_cible: "479",
        ordre_mobilite: "1",
      },
      {
        rome_cible: "M1601 - Accueil et renseignements",
        code_org_rome_cible: "474",
        ordre_mobilite: "2",
      },
      {
        rome_cible: "M1608 - Secrétariat comptable",
        code_org_rome_cible: "481",
        ordre_mobilite: "3",
      },
      {
        rome_cible: "M1609 - Secrétariat et assistanat médical ou médico-social",
        code_org_rome_cible: "482",
        ordre_mobilite: "4",
      },
      {
        rome_cible: "E1307 - Reprographie",
        code_org_rome_cible: "138",
        ordre_mobilite: "5",
      },
      {
        rome_cible: "M1607 - Secrétariat",
        code_org_rome_cible: "480",
        ordre_mobilite: "6",
      },
      {
        rome_cible: "C1401 - Gestion en banque et assurance",
        code_org_rome_cible: "75",
        ordre_mobilite: "7",
      },
      {
        rome_cible: "M1604 - Assistanat de direction",
        code_org_rome_cible: "477",
        ordre_mobilite: "8",
      },
      {
        rome_cible: "M1605 - Assistanat technique et administratif",
        code_org_rome_cible: "478",
        ordre_mobilite: "9",
      },
      {
        rome_cible: "G1303 - Vente de voyages",
        code_org_rome_cible: "190",
        ordre_mobilite: "10",
      },
    ],
    ...data,
  }
}
