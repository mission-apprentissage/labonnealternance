import { logger } from "./logger.js"

interface IDepartmentsRegionAndAcademieCode {
  nom: string
  code: string
  uaiCode: string
  region: {
    code: string
    nom: string
  }
  academie: {
    code: string
    nom: string
  }
}

const departmentsRegionAndAcademieCode: IDepartmentsRegionAndAcademieCode[] = [
  {
    nom: "Ain",
    code: "01",
    uaiCode: "01",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Aisne",
    code: "02",
    uaiCode: "02",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Allier",
    code: "03",
    uaiCode: "03",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Alpes-de-Haute-Provence",
    code: "04",
    uaiCode: "04",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Hautes-Alpes",
    code: "05",
    uaiCode: "05",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Alpes-Maritimes",
    code: "06",
    uaiCode: "06",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "23",
      nom: "Nice",
    },
  },
  {
    nom: "Ardèche",
    code: "07",
    uaiCode: "07",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Ardennes",
    code: "08",
    uaiCode: "08",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Ariège",
    code: "09",
    uaiCode: "09",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Aube",
    code: "10",
    uaiCode: "10",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Aude",
    code: "11",
    uaiCode: "11",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Aveyron",
    code: "12",
    uaiCode: "12",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Bouches-du-Rhône",
    code: "13",
    uaiCode: "13",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Calvados",
    code: "14",
    uaiCode: "14",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Cantal",
    code: "15",
    uaiCode: "15",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Charente",
    code: "16",
    uaiCode: "16",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Charente-Maritime",
    code: "17",
    uaiCode: "17",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Cher",
    code: "18",
    uaiCode: "18",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Corrèze",
    code: "19",
    uaiCode: "19",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Côte-d'Or",
    code: "21",
    uaiCode: "21",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Côtes-d'Armor",
    code: "22",
    uaiCode: "22",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Creuse",
    code: "23",
    uaiCode: "23",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Dordogne",
    code: "24",
    uaiCode: "24",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Doubs",
    code: "25",
    uaiCode: "25",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Drôme",
    code: "26",
    uaiCode: "26",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Eure",
    code: "27",
    uaiCode: "27",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Eure-et-Loir",
    code: "28",
    uaiCode: "28",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Finistère",
    code: "29",
    uaiCode: "29",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Corse-du-Sud",
    code: "2A",
    uaiCode: "620",
    region: {
      code: "94",
      nom: "Corse",
    },
    academie: {
      code: "27",
      nom: "Corse",
    },
  },
  {
    nom: "Haute-Corse",
    code: "2B",
    uaiCode: "720",
    region: {
      code: "94",
      nom: "Corse",
    },
    academie: {
      code: "27",
      nom: "Corse",
    },
  },
  {
    nom: "Gard",
    code: "30",
    uaiCode: "30",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Haute-Garonne",
    code: "31",
    uaiCode: "31",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Gers",
    code: "32",
    uaiCode: "32",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Gironde",
    code: "33",
    uaiCode: "33",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Hérault",
    code: "34",
    uaiCode: "34",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Ille-et-Vilaine",
    code: "35",
    uaiCode: "35",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Indre",
    code: "36",
    uaiCode: "36",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Indre-et-Loire",
    code: "37",
    uaiCode: "37",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Isère",
    code: "38",
    uaiCode: "38",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Jura",
    code: "39",
    uaiCode: "39",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Landes",
    code: "40",
    uaiCode: "40",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Loir-et-Cher",
    code: "41",
    uaiCode: "41",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Loire",
    code: "42",
    uaiCode: "42",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Haute-Loire",
    code: "43",
    uaiCode: "43",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Loire-Atlantique",
    code: "44",
    uaiCode: "44",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Loiret",
    code: "45",
    uaiCode: "45",
    region: {
      code: "24",
      nom: "Centre-Val de Loire",
    },
    academie: {
      code: "18",
      nom: "Orléans-Tours",
    },
  },
  {
    nom: "Lot",
    code: "46",
    uaiCode: "46",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Lot-et-Garonne",
    code: "47",
    uaiCode: "47",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Lozère",
    code: "48",
    uaiCode: "48",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Maine-et-Loire",
    code: "49",
    uaiCode: "49",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Manche",
    code: "50",
    uaiCode: "50",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Marne",
    code: "51",
    uaiCode: "51",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Haute-Marne",
    code: "52",
    uaiCode: "52",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "19",
      nom: "Reims",
    },
  },
  {
    nom: "Mayenne",
    code: "53",
    uaiCode: "53",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Meurthe-et-Moselle",
    code: "54",
    uaiCode: "54",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Meuse",
    code: "55",
    uaiCode: "55",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Morbihan",
    code: "56",
    uaiCode: "56",
    region: {
      code: "53",
      nom: "Bretagne",
    },
    academie: {
      code: "14",
      nom: "Rennes",
    },
  },
  {
    nom: "Moselle",
    code: "57",
    uaiCode: "57",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Nièvre",
    code: "58",
    uaiCode: "58",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Nord",
    code: "59",
    uaiCode: "59",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "9",
      nom: "Lille",
    },
  },
  {
    nom: "Oise",
    code: "60",
    uaiCode: "60",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Orne",
    code: "61",
    uaiCode: "61",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Pas-de-Calais",
    code: "62",
    uaiCode: "62",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "9",
      nom: "Lille",
    },
  },
  {
    nom: "Puy-de-Dôme",
    code: "63",
    uaiCode: "63",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "6",
      nom: "Clermont-Ferrand",
    },
  },
  {
    nom: "Pyrénées-Atlantiques",
    code: "64",
    uaiCode: "64",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "4",
      nom: "Bordeaux",
    },
  },
  {
    nom: "Hautes-Pyrénées",
    code: "65",
    uaiCode: "65",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Pyrénées-Orientales",
    code: "66",
    uaiCode: "66",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "11",
      nom: "Montpellier",
    },
  },
  {
    nom: "Bas-Rhin",
    code: "67",
    uaiCode: "67",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "15",
      nom: "Strasbourg",
    },
  },
  {
    nom: "Haut-Rhin",
    code: "68",
    uaiCode: "68",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "15",
      nom: "Strasbourg",
    },
  },
  {
    nom: "Rhône",
    code: "69",
    uaiCode: "69",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "10",
      nom: "Lyon",
    },
  },
  {
    nom: "Haute-Saône",
    code: "70",
    uaiCode: "70",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Saône-et-Loire",
    code: "71",
    uaiCode: "71",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Sarthe",
    code: "72",
    uaiCode: "72",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Savoie",
    code: "73",
    uaiCode: "73",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Haute-Savoie",
    code: "74",
    uaiCode: "74",
    region: {
      code: "84",
      nom: "Auvergne-Rhône-Alpes",
    },
    academie: {
      code: "8",
      nom: "Grenoble",
    },
  },
  {
    nom: "Paris",
    code: "75",
    uaiCode: "75",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "1",
      nom: "Paris",
    },
  },
  {
    nom: "Seine-Maritime",
    code: "76",
    uaiCode: "76",
    region: {
      code: "28",
      nom: "Normandie",
    },
    academie: {
      code: "70",
      nom: "Normandie",
    },
  },
  {
    nom: "Seine-et-Marne",
    code: "77",
    uaiCode: "77",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Yvelines",
    code: "78",
    uaiCode: "78",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Deux-Sèvres",
    code: "79",
    uaiCode: "79",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Somme",
    code: "80",
    uaiCode: "80",
    region: {
      code: "32",
      nom: "Hauts-de-France",
    },
    academie: {
      code: "20",
      nom: "Amiens",
    },
  },
  {
    nom: "Tarn",
    code: "81",
    uaiCode: "81",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Tarn-et-Garonne",
    code: "82",
    uaiCode: "82",
    region: {
      code: "76",
      nom: "Occitanie",
    },
    academie: {
      code: "16",
      nom: "Toulouse",
    },
  },
  {
    nom: "Var",
    code: "83",
    uaiCode: "83",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "23",
      nom: "Nice",
    },
  },
  {
    nom: "Vaucluse",
    code: "84",
    uaiCode: "84",
    region: {
      code: "93",
      nom: "Provence-Alpes-Côte d'Azur",
    },
    academie: {
      code: "2",
      nom: "Aix-Marseille",
    },
  },
  {
    nom: "Vendée",
    code: "85",
    uaiCode: "85",
    region: {
      code: "52",
      nom: "Pays de la Loire",
    },
    academie: {
      code: "17",
      nom: "Nantes",
    },
  },
  {
    nom: "Vienne",
    code: "86",
    uaiCode: "86",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "13",
      nom: "Poitiers",
    },
  },
  {
    nom: "Haute-Vienne",
    code: "87",
    uaiCode: "87",
    region: {
      code: "75",
      nom: "Nouvelle-Aquitaine",
    },
    academie: {
      code: "22",
      nom: "Limoges",
    },
  },
  {
    nom: "Vosges",
    code: "88",
    uaiCode: "88",
    region: {
      code: "44",
      nom: "Grand Est",
    },
    academie: {
      code: "12",
      nom: "Nancy-Metz",
    },
  },
  {
    nom: "Yonne",
    code: "89",
    uaiCode: "89",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "7",
      nom: "Dijon",
    },
  },
  {
    nom: "Territoire de Belfort",
    code: "90",
    uaiCode: "90",
    region: {
      code: "27",
      nom: "Bourgogne-Franche-Comté",
    },
    academie: {
      code: "3",
      nom: "Besançon",
    },
  },
  {
    nom: "Essonne",
    code: "91",
    uaiCode: "91",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Hauts-de-Seine",
    code: "92",
    uaiCode: "92",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Seine-Saint-Denis",
    code: "93",
    uaiCode: "93",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Val-de-Marne",
    code: "94",
    uaiCode: "94",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "24",
      nom: "Créteil",
    },
  },
  {
    nom: "Val-d'Oise",
    code: "95",
    uaiCode: "95",
    region: {
      code: "11",
      nom: "Île-de-France",
    },
    academie: {
      code: "25",
      nom: "Versailles",
    },
  },
  {
    nom: "Guadeloupe",
    code: "971",
    uaiCode: "971",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Martinique",
    code: "972",
    uaiCode: "972",
    region: {
      code: "02",
      nom: "Martinique",
    },
    academie: {
      code: "31",
      nom: "Martinique",
    },
  },
  {
    nom: "Guyane",
    code: "973",
    uaiCode: "973",
    region: {
      code: "03",
      nom: "Guyane",
    },
    academie: {
      code: "33",
      nom: "Guyane",
    },
  },
  {
    nom: "La Réunion",
    code: "974",
    uaiCode: "974",
    region: {
      code: "04",
      nom: "La Réunion",
    },
    academie: {
      code: "28",
      nom: "La Réunion",
    },
  },
  {
    nom: "Mayotte",
    code: "976",
    uaiCode: "976",
    region: {
      code: "06",
      nom: "Mayotte",
    },
    academie: {
      code: "43",
      nom: "Mayotte",
    },
  },
  {
    nom: "Saint-Barthelemy",
    code: "977",
    uaiCode: "977",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Saint-Martin",
    code: "978",
    uaiCode: "978",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Terres australes et antarctique",
    code: "984",
    uaiCode: "984",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Wallis et Futuna",
    code: "986",
    uaiCode: "986",
    region: {
      code: "02",
      nom: "Martinique",
    },
    academie: {
      code: "31",
      nom: "Martinique",
    },
  },
  {
    nom: "Polynésie française",
    code: "987",
    uaiCode: "987",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Nouvelle Calédonie",
    code: "988",
    uaiCode: "988",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
  {
    nom: "Ile de Clipperton",
    code: "989",
    uaiCode: "989",
    region: {
      code: "01",
      nom: "Guadeloupe",
    },
    academie: {
      code: "32",
      nom: "Guadeloupe",
    },
  },
]

/**
 * @description Returns related "departmentsRegionAndAcademieCode" from its zip code (based on "three firsts digits").
 * @param {string} zipCode - Zip code (ex: "972" or "750").
 * @return {IDepartmentsRegionAndAcademieCode | undefined}
 */
const getDepartmentByZipCode = (zipCode: string): IDepartmentsRegionAndAcademieCode | undefined => {
  let result = departmentsRegionAndAcademieCode.find((departement) => departement.code === zipCode.slice(0, 2))

  // If not department found, with two firsts digits, try with three firsts digits
  if (!result) {
    result = departmentsRegionAndAcademieCode.find((departement) => departement.code === zipCode.slice(0, 3))
  }

  if (!result) {
    logger.error("Unable to return department from zip code", { zipCode })
    return undefined
  }

  return result
}

export { getDepartmentByZipCode }
export type { IDepartmentsRegionAndAcademieCode }
