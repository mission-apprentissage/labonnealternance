import { StaticImageData } from "next/image"

import opco2i from "@/public/images/logosPartenaires/partenaire-opco-2i.webp"
import opcoafdas from "@/public/images/logosPartenaires/partenaire-opco-afdas.webp"
import opcoakto from "@/public/images/logosPartenaires/partenaire-opco-akto.webp"
import opcoatlas from "@/public/images/logosPartenaires/partenaire-opco-atlas.webp"
import opcommerce from "@/public/images/logosPartenaires/partenaire-opco-commerce.webp"
import opcoconstructys from "@/public/images/logosPartenaires/partenaire-opco-constructys.webp"
import opcoep from "@/public/images/logosPartenaires/partenaire-opco-ep.webp"
import opcomobilite from "@/public/images/logosPartenaires/partenaire-opco-mobilite.webp"
import ocapiat from "@/public/images/logosPartenaires/partenaire-opco-ocapiat.webp"
import opcosante from "@/public/images/logosPartenaires/partenaire-opco-sante.webp"
import opcouniformation from "@/public/images/logosPartenaires/partenaire-opco-uniformation.webp"

export type InfosOpco = {
  nom: string
  description: string
  image: StaticImageData
}

export const infosOpcos: InfosOpco[] = [
  {
    nom: "AFDAS",
    description:
      "Afdas est l’opérateur de compétences des entreprises des secteurs de la culture, des industries créatives, des médias, de la communication, des télécommunications, du sport, du tourisme, des loisirs et du divertissement. Il regroupe également le périmètre des intermittents du spectacle et des artistes-auteurs.",
    image: opcoafdas,
  },
  {
    nom: "AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre",
    description: "AKTO est l’opérateur de compétences des services à forte intensité de main-d’œuvre, dont la restauration, l’entretien, et la manutention par exemple.",
    image: opcoakto,
  },
  {
    nom: "ATLAS",
    description: "Atlas est l’opérateur de compétences des entreprises  exerçant dans le champ des assurances, des services financiers et du conseil.",
    image: opcoatlas,
  },
  {
    nom: "OPCO 2i",
    description:
      "OPCO 2i est l’opérateur de compétences interindustriel et accompagnent notamment les entreprises exerçant dans les champs de l’énergie, de la métallurgie, des matériaux, de l’ameublement et des industries créatives et techniques.",
    image: opco2i,
  },
  {
    nom: "OCAPIAT",
    description: "Ocapiat est l’opérateur de Compétences pour la Coopération agricole, l’Agriculture, la Pêche, l’Industrie Agroalimentaire et les Territoires.",
    image: ocapiat,
  },
  {
    nom: "Opco entreprises de proximité",
    description: "OPCO EP est l’opérateur de compétences des métiers de proximité : artisanat, professions libérales et services de proximité.",
    image: opcoep,
  },
  {
    nom: "L'Opcommerce",
    description: "Opcommerce est l’opérateur de compétences des entreprises exerçant de le champ du commerce.",
    image: opcommerce,
  },
  {
    nom: "Opco Mobilités",
    description: "OPCO mobilités est l’opérateur de compétences des entreprises exerçant dans le champ des secteurs du transport routier, maritime, services de l’automobile.",
    image: opcomobilite,
  },
  {
    nom: "Constructys",
    description:
      "Constructys est l’opérateur de compétences des entreprises exerçant dans le champ du bâtiment, des travaux publics, du négoce des matériaux de construction et de bois.",
    image: opcoconstructys,
  },
  {
    nom: "Opco Santé",
    description:
      "OPCO Santé est l'opérateur de compétences du secteur privé de la santé et couvre les secteurs suivants : le sanitaire, médico-social et social privé à but non lucratif; les services de santé au travail interentreprises; l’hospitalisation privée, et le thermalisme.",
    image: opcosante,
  },
  {
    nom: "Uniformation, l'Opco de la Cohésion sociale",
    description:
      "Uniformation est l’opérateur de compétences des entreprises exerçant dans le champ de la cohésion sociale : champ social, services aux personnes, insertion, sport, enseignement et formation.",
    image: opcouniformation,
  },
]
