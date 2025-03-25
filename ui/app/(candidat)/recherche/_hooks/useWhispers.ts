import { hashKey } from "@tanstack/react-query"
import { shuffle } from "lodash-es"
import MersenneTwister from "mersenne-twister"
import { useMemo } from "react"

import type { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export type IWisper = {
  ideaType: "whisper"
  message: string
  lien: string | null
}

export const WHISPERS: IWisper[] = [
  {
    ideaType: "whisper",
    message: "Vous avez besoin de passer le permis ? Bénéficiez d'au moins 500€ d'aides dès maintenant.",
    lien: "https://mes-aides.francetravail.fr/",
  },
  {
    ideaType: "whisper",
    message: "Certaines communes mettent à disposition des logements pour l'hébergement des alternants.",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Après la candidature, l'entretien ! Préparez-vous à l'aide de ce module !",
    lien: "https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac",
  },
  {
    ideaType: "whisper",
    message:
      "Vous allez avoir besoin de matériel pour votre apprentissage (couteaux de cuisine, ciseaux de coiffure, ...) ? Il existe des aides financières au premier équipement !",
    lien: "https://www.service-public.fr/particuliers/vosdroits/F32915",
  },
  {
    ideaType: "whisper",
    message: "Vous devez quitter le domicile familial pour vos études ? Action Logement vous aide à vous installer.",
    lien: "https://www.actionlogement.fr/aide-logement-apprentis",
  },
  {
    ideaType: "whisper",
    message: "La plupart des régions aident au financement des abonnements en transport en commun pour les alternants : renseignez-vous !",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "De nombreuses aides existent pour les jeunes : pour les connaître, faites une simulation sur 1 jeune 1 solution !",
    lien: "https://www.1jeune1solution.gouv.fr/mes-aides",
  },
  {
    ideaType: "whisper",
    message: "Un mentor peut vous épauler tout au long de votre parcours et suivant vos besoins !",
    lien: "https://www.mentorat-apprentissage.fr/",
  },
  {
    ideaType: "whisper",
    message: "Entre 4 et 7 employeurs sur 10 recrutent sans déposer d'offre d'emploi : optimisez vos chances en adressant aussi des candidatures spontanées !",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Besoin d'aide pour concevoir un beau CV ? Vous pouvez le faire gratuitement sur CVdesignr.",
    lien: "https://cvdesignr.com/fr",
  },
  {
    ideaType: "whisper",
    message: "Besoin d'aide pour construire un CV à partir de vos expériences ? Inscrivez-vous gratuitement sur Diagoriente.",
    lien: "https://web-app.diagoriente.beta.gouv.fr/#/inscription?utm_source=lba&utm_campaign=lba-dec2021",
  },
  {
    ideaType: "whisper",
    message:
      "Les employeurs qui embauchent des alternants reçoivent des aides : c'est un bon argument pour convaincre une entreprise qui ne connaît pas l'alternance de vous embaucher !",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "La loi « Avenir professionnel » a étendu les possibilités de faire un contrat en alternance à l’étranger, dans ou hors de l’Union européenne.",
    lien: "https://ec.europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&positionOfferingCodes=apprenticeship",
  },
  {
    ideaType: "whisper",
    message: "Le secteur public (mairies, ministères, départements, régions, ...) recrute aussi des alternants, pensez-y !",
    lien: "https://www.pass.fonction-publique.gouv.fr/",
  },
  {
    ideaType: "whisper",
    message: "Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous !",
    lien: "https://www.letudiant.fr/etudes/salons.html",
  },
  {
    ideaType: "whisper",
    message: "Tout au long de l'année, il existe des salons de recrutement (physiques ou virtuels) spécialisés pour l'alternance : renseignez-vous !",
    lien: "https://www.studyrama.com/salons",
  },
  {
    ideaType: "whisper",
    message:
      "Les recruteurs font attention à de petits détails ! Professionnalisez vos candidatures en utilisant une adresse email adaptée aux contacts professionnels (par exemple : nom.prenom@email.fr)",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Motivation, Dynamisme et Présentation soignée : 3 qualités recherchées par les employeurs de jeunes candidats. Mettez-les en avant dans votre candidature !",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Quel sera votre salaire en alternance ? Faites une simulation sur le portail de l’alternance.",
    lien: "https://www.alternance.emploi.gouv.fr/simulateur-alternant/etape-1",
  },
  {
    ideaType: "whisper",
    message: "Se former en alternance est gratuit ! Votre employeur prend en charge le financement de votre formation.",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Bénéficiez d'un coaching individuel afin d'optimiser votre candidature !",
    lien: "https://autourdesapprentis.fr/pages/inscription-profil",
  },
  {
    ideaType: "whisper",
    message: "Certains établissements de formation obtiennent des labels d'excellence, c'est par exemple le cas des CMQ (Campus des Métiers et Qualifications d'excellence).",
    lien: "https://www.education.gouv.fr/les-campus-des-metiers-et-des-qualifications-5075",
  },
  {
    ideaType: "whisper",
    message: "La plupart des organismes de formations font des journées portes ouvertes : vous avez l'occasion d'échanger avec des alternants !",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Combien de personnes ont trouvé un emploi dans les 6 mois après avoir obtenu le diplôme que vous souhaitez préparer ? La réponse ici !",
    lien: "https://www.inserjeunes.education.gouv.fr/diffusion/accueil",
  },
  {
    ideaType: "whisper",
    message: "En situation de handicap ? Vous pouvez vous former en alternance ! Le référent handicap de votre formation est là pour vous aider.",
    lien: null,
  },
  {
    ideaType: "whisper",
    message: "Identifiez les métiers qui vous correspondent avec Diagoriente ! Inscrivez-vous gratuitement.",
    lien: "https://web-app.diagoriente.beta.gouv.fr/#/inscription?utm_campaign=lba-jan2022-orientation",
  },
  {
    ideaType: "whisper",
    message: "Vous manquez d'inspiration pour votre CV ? Découvrez vos savoir-être en jouant avec le service Pass to work",
    lien: "https://www.monkey-tie.com/la-bonne-alternance/",
  },
  {
    ideaType: "whisper",
    message: "L'ANAF (Association Nationale des Apprentis de France) peut vous aider à tout moment de votre parcours et pour toute question que vous vous posez !",
    lien: "http://www.anaf.fr/",
  },
  {
    ideaType: "whisper",
    message: "Vous hésitez dans le choix d'un métier ? Faites le point avec Diagoriente, un service qui vous accompagne dans la construction de votre orientation professionnelle.",
    lien: "https://diagoriente.beta.gouv.fr/",
  },
  {
    ideaType: "whisper",
    message: "Des doutes sur votre orientation ? Pensez à la Prépa-apprentissage : un dispositif qui vous permet de découvrir un ou plusieurs métiers !",
    lien: "https://travail-emploi.gouv.fr/le-ministere-en-action/pic/prepa-apprentissage-pic",
  },
  {
    ideaType: "whisper",
    message: "Découvrez le quotidien et les métiers des apprentis en vidéo.",
    lien: "https://www.filmetonjob.com/videos",
  },
]

function generateSeed(query: IRecherchePageParams): number {
  const key = hashKey([query])

  let seed = 0
  for (let i = 0; i < key.length; i++) {
    seed = seed + key.charCodeAt(i)
  }

  return seed
}

export function useWhispers(query: IRecherchePageParams): Map<number, IWisper> {
  // Generate stable seed for the whispers to prevent hydration mismatch
  const seed = generateSeed(query)

  // Add one whisper every 20 elements in average
  // First whisper must be within the first 10 elements
  return useMemo(() => {
    const randomizer = new MersenneTwister(seed)
    const availableWhispers = shuffle(WHISPERS)

    const result: Map<number, IWisper> = new Map()
    for (let i = 0; i < availableWhispers.length; i++) {
      const { message, lien } = availableWhispers.pop()
      result.set(1 + Math.floor(randomizer.random() * 10) + i * 20, { message, lien, ideaType: "whisper" })
    }

    return result
  }, [seed])
}
