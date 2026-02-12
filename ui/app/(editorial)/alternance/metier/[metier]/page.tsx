import { Box } from "@mui/material"
import { redirect } from "next/navigation"

import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

export async function generateMetadata({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  console.log(metier)
  //const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

  const data = {
    metier: "Chargé de recrutement",
    slug: "charge-de-recrutement",
    romes: ["M1502"],

    description:
      "Le chargé de recrutement identifie et sélectionne les meilleurs candidats pour répondre aux besoins en personnel des entreprises. Il gère l'ensemble du processus de recrutement, de la rédaction d'annonces aux entretiens d'embauche. En alternance, il développe des compétences en ressources humaines tout en participant activement aux recrutements de l'entreprise.",

    job_count: 30,
    company_count: 25,
    applicant_count: 200,
    salaire: {
      salaire_brut_moyen: 1200,
      salaire_1ere_annee: 1000,
      salaire_2eme_annee: 1300,
      salaire_median: 24000,
    },
    entreprises: [
      { nom: "Entreprise A", job_count: 5 },
      { nom: "Entreprise B", job_count: 3 },
      { nom: "Entreprise C", job_count: 2 },
      { nom: "Entreprise D", job_count: 4 },
      { nom: "Entreprise E", job_count: 1 },
      { nom: "Entreprise F", job_count: 6 },
    ],
    formations: [
      {
        title: "Formation A",
        description: "Description de la formation A pour le métier de chargé de recrutement en alternance.",
        count: 50,
        competences: ["Compétence 1", "Compétence 2", "Compétence 3"],
      },
      {
        title: "Formation B",
        description: "Description de la formation B pour le métier de chargé de recrutement en alternance.",
        count: 30,
        competences: ["Compétence 4", "Compétence 5", "Compétence 6"],
      },
      {
        title: "Formation C",
        description: "Description de la formation C pour le métier de chargé de recrutement en alternance.",
        count: 20,
        competences: ["Compétence 7", "Compétence 8", "Compétence 9"],
      },
    ],
    villes: [
      {
        nom: "Paris",
        job_count: 10,
        geopoint: { lat: 48.8566, long: 2.3522 },
      },
      {
        nom: "Lyon",
        job_count: 8,
        geopoint: { lat: 45.764, long: 4.8357 },
      },
      { nom: "Marseille", job_count: 5, geopoint: { lat: 43.2965, long: 5.3698 } },
    ],
    cards: [],
    missions: [
      {
        title: "Rédaction et diffusion d'annonces",
        description: "Création d'offres d'emploi attractives et publication sur différents canaux",
      },
      {
        title: "Sourcing de candidats",
        description: "Recherche active de profils qualifiés sur les jobboards et réseaux sociaux",
      },
      {
        title: "Présélection de candidatures",
        description: "Analyse des CV et lettres de motivation selon les critères définis",
      },
      {
        title: "Conduite d'entretiens",
        description: "Organisation et réalisation d'entretiens de recrutement en présentiel ou visio",
      },
      {
        title: "Gestion de la relation candidat",
        description: "Accompagnement des candidats tout au long du processus de recrutement",
      },
      {
        title: "Reporting et suivi",
        description: "Mise à jour des tableaux de bord et indicateurs de recrutement",
      },
    ],
    competences: [
      {
        title: "Techniques d'entretien",
        description: "Maîtrise des méthodes d'évaluation et de questionnement des candidats",
      },
      {
        title: "Communication interpersonnelle",
        description: "Capacité à échanger efficacement avec candidats et managers",
      },
      {
        title: "Outils de recrutement",
        description: "Utilisation d'ATS, jobboards et réseaux sociaux professionnels comme LinkedIn",
      },
      {
        title: "Analyse de profils",
        description: "Évaluation des compétences et adéquation candidat-poste",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion simultanée de plusieurs processus de recrutement",
      },
      {
        title: "Droit du travail",
        description: "Connaissance des réglementations en matière de recrutement et d'embauche",
      },
    ],
  }

  if (!data) {
    return {
      title: "Métiers en alternance | La bonne alternance",
      description: "Trouvez votre contrat d'apprentissage",
    }
  }

  return {
    title: `Alternance en ${data.metier} : ${0} Offres | Salaires & Formations ${new Date().getFullYear()} | La bonne alternance`,
    description: `${0} offres d'alternance en ${data.metier}. .`,
  }
}

export default async function Metier({ params }: { params: Promise<{ metier: string }> }) {
  const { metier } = await params
  console.log(metier)
  //const data = await apiGet("/_private/seo/metier/:metier", { params: { metier } })

  const data = {
    metier: "Chargé de recrutement",
    slug: "charge-de-recrutement",
    romes: ["M1502"],

    description:
      "Le chargé de recrutement identifie et sélectionne les meilleurs candidats pour répondre aux besoins en personnel des entreprises. Il gère l'ensemble du processus de recrutement, de la rédaction d'annonces aux entretiens d'embauche. En alternance, il développe des compétences en ressources humaines tout en participant activement aux recrutements de l'entreprise.",

    job_count: 30,
    company_count: 25,
    applicant_count: 200,
    salaire: {
      salaire_brut_moyen: 1200,
      salaire_1ere_annee: 1000,
      salaire_2eme_annee: 1300,
      salaire_median: 24000,
    },
    entreprises: [
      { nom: "Entreprise A", job_count: 5 },
      { nom: "Entreprise B", job_count: 3 },
      { nom: "Entreprise C", job_count: 2 },
      { nom: "Entreprise D", job_count: 4 },
      { nom: "Entreprise E", job_count: 1 },
      { nom: "Entreprise F", job_count: 6 },
    ],
    formations: [
      {
        title: "Formation A",
        description: "Description de la formation A pour le métier de chargé de recrutement en alternance.",
        count: 50,
        competences: ["Compétence 1", "Compétence 2", "Compétence 3"],
      },
      {
        title: "Formation B",
        description: "Description de la formation B pour le métier de chargé de recrutement en alternance.",
        count: 30,
        competences: ["Compétence 4", "Compétence 5", "Compétence 6"],
      },
      {
        title: "Formation C",
        description: "Description de la formation C pour le métier de chargé de recrutement en alternance.",
        count: 20,
        competences: ["Compétence 7", "Compétence 8", "Compétence 9"],
      },
    ],
    villes: [
      {
        nom: "Paris",
        job_count: 10,
        geopoint: { lat: 48.8566, long: 2.3522 },
      },
      {
        nom: "Lyon",
        job_count: 8,
        geopoint: { lat: 45.764, long: 4.8357 },
      },
      { nom: "Marseille", job_count: 5, geopoint: { lat: 43.2965, long: 5.3698 } },
    ],
    cards: [],
    missions: [
      {
        title: "Rédaction et diffusion d'annonces",
        description: "Création d'offres d'emploi attractives et publication sur différents canaux",
      },
      {
        title: "Sourcing de candidats",
        description: "Recherche active de profils qualifiés sur les jobboards et réseaux sociaux",
      },
      {
        title: "Présélection de candidatures",
        description: "Analyse des CV et lettres de motivation selon les critères définis",
      },
      {
        title: "Conduite d'entretiens",
        description: "Organisation et réalisation d'entretiens de recrutement en présentiel ou visio",
      },
      {
        title: "Gestion de la relation candidat",
        description: "Accompagnement des candidats tout au long du processus de recrutement",
      },
      {
        title: "Reporting et suivi",
        description: "Mise à jour des tableaux de bord et indicateurs de recrutement",
      },
    ],
    competences: [
      {
        title: "Techniques d'entretien",
        description: "Maîtrise des méthodes d'évaluation et de questionnement des candidats",
      },
      {
        title: "Communication interpersonnelle",
        description: "Capacité à échanger efficacement avec candidats et managers",
      },
      {
        title: "Outils de recrutement",
        description: "Utilisation d'ATS, jobboards et réseaux sociaux professionnels comme LinkedIn",
      },
      {
        title: "Analyse de profils",
        description: "Évaluation des compétences et adéquation candidat-poste",
      },
      {
        title: "Organisation et rigueur",
        description: "Gestion simultanée de plusieurs processus de recrutement",
      },
      {
        title: "Droit du travail",
        description: "Connaissance des réglementations en matière de recrutement et d'embauche",
      },
    ],
  }

  //const utmParams = "utm_source=lba&utm_medium=website&utm_campaign=lba_seo-prog-metiers"

  if (!data) {
    redirect("/404")
  }

  return (
    <Box>
      <DefaultContainer sx={{ px: 0 }}></DefaultContainer>
    </Box>
  )
}
