import type { IDiplomeSeoData } from "shared/models/seoDiplome.model"

export const mockDiplomeData: IDiplomeSeoData = {
  slug: "bts-mco",
  titre: "BTS MCO en alternance",
  intituleLongFormation: "BTS MCO",
  sousTitre: "Management Commercial Opérationnel",
  kpis: { duration: "2 ans", entreprise: "890", salaire: "1120€-1300€" },
  description: {
    text: "Le BTS Management Commercial Opérationnel forme des professionnels capables de prendre la responsabilité opérationnelle de tout ou partie d'une unité commerciale. Cette formation en alternance permet d'acquérir des compétences en gestion, animation et dynamisation de l'offre commerciale, tout en développant la relation client et le management d'équipe.",
    objectifs: [
      "Maîtriser la gestion opérationnelle d'une unité commerciale.",
      "Développer la relation client et la vente conseil.",
      "Animer et dynamiser l'offre commerciale.",
      "Assurer la gestion d'une équipe commerciale.",
    ],
  },
  programme: {
    text: "Le programme du BTS MCO en alternance couvre un large éventail de compétences commerciales et managériales, alliant enseignements théoriques et pratique professionnelle.",
    sections: {
      enseignements_generaux: ["Culture générale et expression.", "Langue vivante étrangère.", "Culture économique, juridique et managériale."],
      enseignements_professionnels: [
        "Développement de la relation client et vente conseil.",
        "Animation et dynamisation de l'offre commerciale.",
        "Gestion opérationnelle.",
        "Management de l'équipe commerciale.",
      ],
      competences_developpees: [
        "Techniques de vente et merchandising.",
        "Gestion des stocks.",
        "Management d'équipe.",
        "Analyse de données commerciales.",
        "Communication professionnelle.",
      ],
    },
  },

  ecoles: [
    { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "FORM HIGH TECH (METZ)", lieu: "57000 Metz", href: "/recherche-formation" },
    { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "LYCEE POLYVALENT REGIONAL AUDIBERTI (ANTIBES)", lieu: "06600 Antibes", href: "/recherche-formation" },
    { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "INSTITUT DE MANAGEMENT COMMERCIAL (METZ)", lieu: "57000 Metz", href: "/recherche-formation" },
    { formationTitle: "BOULANGER (CAP)", etablissement: "CFA COMMERCE PARIS", lieu: "75003 Paris", href: "/recherche-formation" },
    { formationTitle: "VENDEUR CONSEIL (TP)", etablissement: "AFIPE ILE-DE-FRANCE", lieu: "92100 Boulogne-Billancourt", href: "/recherche-formation" },
    { formationTitle: "MANAGER D'UNITE MARCHANDE (TP)", etablissement: "PIGIER PERFORMANCE", lieu: "69002 Lyon", href: "/recherche-formation" },
    { formationTitle: "CONSEILLER DE VENTE (TP)", etablissement: "TALIS BUSINESS SCHOOL", lieu: "33000 Bordeaux", href: "/recherche-formation" },
    { formationTitle: "ASSISTANT COMMERCIAL (TP)", etablissement: "ESUP RENNES", lieu: "35000 Rennes", href: "/recherche-formation" },
    { formationTitle: "RESPONSABLE DE RAYON (TP)", etablissement: "GROUPE IGS", lieu: "75010 Paris", href: "/recherche-formation" },
  ],
  salaire: [
    { age: "16-17 ans", premiereAnnee: "471€", deuxiemeAnnee: "689€" },
    { age: "18-20 ans", premiereAnnee: "751€", deuxiemeAnnee: "891€" },
    { age: "21-25 ans", premiereAnnee: "849€", deuxiemeAnnee: "980€" },
    { age: "26 ans et +", premiereAnnee: "1 767€", deuxiemeAnnee: "1 767€" },
  ],
  metiers: {
    text: "Le BTS MCO ouvre les portes de nombreux métiers dans le commerce et la distribution.",
    liste: [
      { icon: "fr-icon-briefcase-line", title: "Assistant administratif et commercial", offres: "145 offres en alternance sur toute la France", href: "/recherche-emploi" },
      { icon: "fr-icon-briefcase-line", title: "Service Clients", offres: "89 offres en alternance sur toute la France", href: "/recherche-emploi" },
      { icon: "fr-icon-briefcase-line", title: "Chargé(e) de Fidélisation Client", offres: "67 offres en alternance sur toute la France", href: "/recherche-emploi" },
    ],
  },
}
