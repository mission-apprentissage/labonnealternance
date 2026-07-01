export enum ApplicationIntention {
  ENTRETIEN = "entretien",
  REFUS = "refus",
}

export const ApplicationIntentionDefaultText: Record<ApplicationIntention, string> = {
  [ApplicationIntention.ENTRETIEN]:
    "Bonjour, \r\n\r\nNous avons bien reçu votre candidature et vous en remercions. \r\n\r\nVotre candidature a retenu notre attention. \r\n\r\nNous examinons l'ensemble des candidatures reçues, et reviendrons vers vous prochainement. \r\n\r\nSans réponse de notre part d’ici 30 jours, veuillez considérer que votre candidature n’a pas été retenue.\r\n\r\nCordialement,",
  [ApplicationIntention.REFUS]:
    "Bonjour, \r\n\r\nMerci pour l'intérêt que vous portez à notre établissement. Nous avons étudié votre candidature avec attention. Nous ne sommes malheureusement pas en mesure de lui donner une suite favorable. \r\n\r\nNous vous souhaitons bonne chance dans vos recherches. \r\n\r\nBonne continuation",
}

export enum RefusalReasons {
  COMPETENCE = "Compétences insuffisantes ou non adaptées",
  CANDIDATURE_NON_PERSONNALISEE = "Manque de personnalisation de la candidature",
  ECOLE = "Avis négatif sur l’école/la formation",
  CONTRAT_INADAPTE = "Type de contrat inadapté",
  METIER_RECHERCHE = "Notre entreprise ne recrute pas sur le métier recherché",
}

export enum HELLOWORK_STATUS {
  CONTACTED = "CONTACTED",
  REJECTED = "REJECTED",
  JOB_CLOSED = "JOB_CLOSED",
}
