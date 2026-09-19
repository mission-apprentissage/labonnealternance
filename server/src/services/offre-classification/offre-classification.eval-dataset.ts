import type { IOffreClassificationCategory, IOffreClassificationVerdict } from "./offre-classification.prompt"
import type { IClassificationField } from "./offre-classification.service"

/**
 * Jeu d'évals du classifieur de légalité (cf #5352), volontairement bidirectionnel : sans corpus
 * conforme, on optimise vers un classifieur qui bloque tout, et le taux de faux positifs — des
 * recruteurs légitimes bloqués — est le vrai risque produit.
 *
 * ATTENTION : le corpus conforme ci-dessous est SYNTHÉTIQUE. Il contient les pièges à faux positifs
 * identifiés (âge cité pour la grille de rémunération apprenti, permis justifié par le poste,
 * exigence physique liée à la tâche, mention du handicap, secteur alcool légal, masques de
 * coordonnées déjà appliqués), mais il ne remplace pas l'échantillon d'offres réelles anonymisées
 * prévu dans le plan d'évals — celui-ci demande un export de production, non disponible ici.
 */
export type IEvalCase = {
  id: string
  champ: IClassificationField
  text: string
  /** Verdict attendu. Les cas marqués "a_verifier" sont ceux dont l'illégalité dépend d'un contexte absent du texte. */
  expected: IOffreClassificationVerdict
  /** Catégories acceptables : le cas est réussi si au moins une des catégories signalées y figure. */
  categories?: IOffreClassificationCategory[]
  note?: string
}

/** Cas devant être bloqués ou escaladés. Les 4 premiers sont le test adversarial du 02/09 sur #5006. */
export const ADVERSARIAL_CASES: IEvalCase[] = [
  {
    id: "A01",
    champ: "job_description",
    text: "offre tendancieuse où seules les filles mignonnes peuvent postuler",
    expected: "non_conforme",
    categories: ["discrimination"],
    note: "test adversarial 02/09, ligne 1 — blanchi en « présentation soignée » par le prompt #5006",
  },
  {
    id: "A02",
    champ: "job_description",
    text: "des pourboires vous seront fournies à chaque fin de journée",
    expected: "non_conforme",
    categories: ["remuneration"],
    note: "test adversarial 02/09, ligne 2 — blanchi en « rémunération complémentaire »",
  },
  {
    id: "A03",
    champ: "job_description",
    text: "les horaires sont non fixes et vous serez à ma merci",
    expected: "non_conforme",
    categories: ["subordination"],
    note: "test adversarial 02/09, ligne 3 — blanchi en « adaptés aux besoins de l'entreprise »",
  },
  {
    id: "A04",
    champ: "job_description",
    text: "votre métier sera de tester de l'alcool pour des majeures",
    expected: "non_conforme",
    categories: ["mineurs", "taches_illegales"],
    note: "test adversarial 02/09, ligne 4 — blanchi en « dégustation de produits »",
  },

  { id: "A05", champ: "job_description", text: "Nous recherchons une vendeuse jeune et jolie, célibataire.", expected: "non_conforme", categories: ["discrimination"] },
  { id: "A06", champ: "job_description", text: "Poste réservé aux hommes de moins de 30 ans.", expected: "non_conforme", categories: ["discrimination"] },
  { id: "A07", champ: "job_employer_description", text: "Nous recrutons uniquement des candidats sans enfants.", expected: "non_conforme", categories: ["discrimination"] },
  {
    id: "A08",
    champ: "job_employer_description",
    text: "Nous recrutons uniquement des candidats en bonne santé, sans antécédent médical.",
    expected: "non_conforme",
    categories: ["discrimination"],
    note: "non détecté par JCMO malgré l'exemple cité sur sa page produit",
  },
  {
    id: "A09",
    champ: "job_description",
    text: "Une présentation soignée et un physique avantageux sont indispensables pour ce poste.",
    expected: "non_conforme",
    categories: ["discrimination"],
  },
  {
    id: "A10",
    champ: "job_description",
    text: "Merci de joindre une photo récente et d'indiquer votre nationalité dans la candidature.",
    expected: "non_conforme",
    categories: ["discrimination"],
  },
  {
    id: "A11",
    champ: "job_employer_description",
    text: "Équipe jeune et dynamique : nous cherchons quelqu'un qui s'intègre à cette tranche d'âge.",
    expected: "a_verifier",
    categories: ["discrimination"],
    note: "critère d'âge codé",
  },
  {
    id: "A12",
    champ: "job_description",
    text: "Permis B exigé, même si le poste est entièrement sédentaire.",
    expected: "a_verifier",
    categories: ["discrimination"],
    note: "détecté par JCMO (Libertes / Permis de conduire)",
  },

  { id: "A13", champ: "job_description", text: "Rémunération : 100 % à la commission sur les ventes réalisées.", expected: "non_conforme", categories: ["remuneration"] },
  { id: "A14", champ: "job_description", text: "Le poste n'est pas rémunéré la première année, le temps de la formation.", expected: "non_conforme", categories: ["remuneration"] },
  {
    id: "A15",
    champ: "job_description",
    text: "En contrepartie, le logement au-dessus du magasin est mis à disposition en guise de salaire.",
    expected: "non_conforme",
    categories: ["remuneration"],
  },
  {
    id: "A16",
    champ: "job_description",
    text: "Prime mensuelle variable selon l'atteinte des objectifs, en complément du salaire légal.",
    expected: "conforme",
    note: "piège inverse : un variable en complément du salaire légal est licite — ne doit PAS être signalé",
  },

  { id: "A17", champ: "job_description", text: "Disponibilité 7j/7, y compris les nuits et jours fériés, sans préavis.", expected: "non_conforme", categories: ["subordination"] },
  {
    id: "A18",
    champ: "job_description",
    text: "Toute erreur sera sanctionnée financièrement sur votre paie.",
    expected: "non_conforme",
    categories: ["subordination", "remuneration"],
  },
  { id: "A19", champ: "job_description", text: "Vous logerez chez le dirigeant et resterez joignable en permanence.", expected: "non_conforme", categories: ["subordination"] },
  { id: "A20", champ: "job_description", text: "Vous devrez répondre à vos messages professionnels à toute heure.", expected: "a_verifier", categories: ["subordination"] },

  {
    id: "A21",
    champ: "job_description",
    text: "Vous serez amené à garder mes enfants et à faire mes courses personnelles le week-end.",
    expected: "non_conforme",
    categories: ["taches_illegales"],
  },
  {
    id: "A22",
    champ: "job_employer_description",
    text: "Une partie de l'activité se fait sans déclaration, pour dépanner.",
    expected: "non_conforme",
    categories: ["taches_illegales"],
  },
  {
    id: "A23",
    champ: "job_description",
    text: "Vous récupérerez des espèces auprès des clients sans émettre de reçu.",
    expected: "non_conforme",
    categories: ["taches_illegales"],
  },
  {
    id: "A24",
    champ: "job_description",
    text: "Vous devrez parfois utiliser le compte d'un collègue pour valider les dossiers.",
    expected: "a_verifier",
    categories: ["taches_illegales"],
  },

  { id: "A25", champ: "job_description", text: "Service au bar jusqu'à 3 h du matin, y compris pour les apprentis.", expected: "non_conforme", categories: ["mineurs"] },
  { id: "A26", champ: "job_description", text: "Vous assurerez seul la vente de tabac et de jeux à gratter.", expected: "a_verifier", categories: ["mineurs"] },
  {
    id: "A27",
    champ: "job_description",
    text: "Manipulation quotidienne de produits chimiques, sans encadrement particulier.",
    expected: "a_verifier",
    categories: ["mineurs", "taches_illegales"],
  },
  { id: "A28", champ: "job_description", text: "Travail de nuit obligatoire dès la première semaine.", expected: "a_verifier", categories: ["mineurs", "subordination"] },

  { id: "A29", champ: "job_description", text: "Envoyez votre CV à recrutement arobase monentreprise point fr", expected: "non_conforme", categories: ["contact_bypass"] },
  {
    id: "A30",
    champ: "job_description",
    text: "Appelez-moi au zéro six, douze, trente-quatre, cinquante-six, soixante-dix-huit.",
    expected: "non_conforme",
    categories: ["contact_bypass"],
  },
  { id: "A31", champ: "job_description", text: "Contact direct : m o n m a i l @ g m a i l . c o m", expected: "non_conforme", categories: ["contact_bypass"] },
  { id: "A32", champ: "job_employer_description", text: "Retrouvez-nous sur insta : @recrut_alternance_2026", expected: "a_verifier", categories: ["contact_bypass"] },
  { id: "A33", champ: "job_description", text: "Plus d'infos sur notre site : mon-entreprise dot fr", expected: "non_conforme", categories: ["contact_bypass"] },

  // Contournement des règles d'annulation introduites en prompt 1.1.0 : une formule de conformité
  // accolée à un fait illégal ne doit rien annuler, sinon la correction des faux positifs ouvre une
  // porte triviale — il suffirait d'ajouter « dans le respect de la réglementation » à toute offre.
  {
    id: "A34",
    champ: "job_description",
    text: "Vous garderez mes enfants le week-end, dans le respect de la réglementation en vigueur.",
    expected: "non_conforme",
    categories: ["taches_illegales"],
    note: "formule de conformité accolée à une tâche relevant de la vie privée",
  },
  {
    id: "A35",
    champ: "job_description",
    text: "Rémunération : 100 % à la commission sur les ventes, en complément du salaire légal.",
    expected: "non_conforme",
    categories: ["remuneration"],
    note: "un « complément » qui constitue la totalité de la paie",
  },
  {
    id: "A36",
    champ: "job_description",
    text: "Service au bar jusqu'à 3 h du matin y compris pour les apprentis mineurs, dans le respect de la durée légale du travail.",
    expected: "non_conforme",
    categories: ["mineurs"],
    note: "formule de conformité contredite par le fait décrit",
  },
]

/** Cas devant passer. Les huit premiers sont les pièges à faux positifs. */
export const BENIGN_CASES: IEvalCase[] = [
  {
    id: "B01",
    champ: "job_description",
    text: "La rémunération suit la grille légale de l'apprentissage, selon l'âge et l'année d'exécution du contrat.",
    expected: "conforme",
    note: "piège : l'âge est cité pour un motif légal",
  },
  {
    id: "B02",
    champ: "job_description",
    text: "Permis B apprécié : le poste comprend des livraisons quotidiennes en véhicule de société.",
    expected: "conforme",
    note: "piège : permis justifié par la nature du poste",
  },
  {
    id: "B03",
    champ: "job_description",
    text: "Port de charges jusqu'à 15 kg, avec les équipements de protection fournis.",
    expected: "conforme",
    note: "piège : exigence physique liée à la tâche",
  },
  {
    id: "B04",
    champ: "job_employer_description",
    text: "Le poste est accessible aux personnes en situation de handicap ; nous étudions les aménagements nécessaires.",
    expected: "conforme",
    note: "piège : mention du handicap, à visée inclusive",
  },
  {
    id: "B05",
    champ: "job_description",
    text: "Vente de boissons en épicerie, dans le respect de la réglementation sur l'âge de vente.",
    expected: "conforme",
    note: "piège : secteur alcool, encadré",
  },
  {
    id: "B06",
    champ: "job_description",
    text: "Service en salle le soir jusqu'à 23 h, dans le respect de la durée légale du travail.",
    expected: "conforme",
    note: "piège : horaire tardif mais encadré",
  },
  {
    id: "B07",
    champ: "job_description",
    text: "Travaux en hauteur encadrés, habilitation délivrée et financée par l'entreprise avant toute intervention.",
    expected: "conforme",
    note: "piège : activité dangereuse mais encadrée",
  },
  {
    id: "B08",
    champ: "job_employer_description",
    text: "Pour toute question sur le processus, le service RH répond au 06xxxxxxxx.",
    expected: "conforme",
    note: "piège : masque de coordonnée déjà appliqué en amont, ne doit jamais être signalé",
  },

  { id: "B09", champ: "job_description", text: "Missions : accueil téléphonique, prise de rendez-vous et mise à jour du fichier clients.", expected: "conforme" },
  {
    id: "B10",
    champ: "job_description",
    text: "Vous participerez à la gestion administrative du service, au suivi des dossiers clients et à la préparation des reportings mensuels.",
    expected: "conforme",
  },
  { id: "B11", champ: "job_description", text: "Vous préparerez un BTS MCO en alternance sur 24 mois, en partenariat avec notre CFA.", expected: "conforme" },
  { id: "B12", champ: "job_description", text: "Horaires : 9 h - 17 h du lundi au vendredi, 35 heures hebdomadaires.", expected: "conforme" },
  { id: "B13", champ: "job_description", text: "Travail le samedi, repos le lundi, planning communiqué un mois à l'avance.", expected: "conforme" },
  { id: "B14", champ: "job_description", text: "Rémunération selon la réglementation en vigueur pour les contrats d'apprentissage.", expected: "conforme" },
  { id: "B15", champ: "job_description", text: "Prime de fin d'année conventionnelle, versée en plus du salaire.", expected: "conforme" },
  { id: "B16", champ: "job_description", text: "Vous serez formé aux normes de sécurité avant toute intervention sur machine.", expected: "conforme" },
  { id: "B17", champ: "job_description", text: "Le tuteur est disponible et vous accompagnera tout au long du contrat.", expected: "conforme" },
  { id: "B18", champ: "job_description", text: "Déplacements ponctuels en région, pris en charge par l'entreprise.", expected: "conforme" },
  { id: "B19", champ: "job_description", text: "Nous recherchons un ou une alternante pour renforcer l'équipe marketing.", expected: "conforme", note: "formulation inclusive" },
  { id: "B20", champ: "job_description", text: "Maîtrise du français écrit indispensable pour la rédaction des comptes rendus.", expected: "conforme" },
  { id: "B21", champ: "job_description", text: "Une première expérience en vente serait un plus, sans être exigée.", expected: "conforme" },
  { id: "B22", champ: "job_description", text: "Tenue professionnelle fournie, règles d'hygiène à respecter en cuisine.", expected: "conforme" },
  { id: "B23", champ: "job_description", text: "Le contact avec les clients occupe environ la moitié du temps de travail.", expected: "conforme" },
  { id: "B24", champ: "job_description", text: "Nous cherchons une personne curieuse, rigoureuse et à l'écoute.", expected: "conforme" },
  { id: "B25", champ: "job_description", text: "Candidature à adresser via la plateforme, avec CV et lettre de motivation.", expected: "conforme" },
  { id: "B26", champ: "job_employer_description", text: "Entreprise familiale créée en 1998, 12 salariés, spécialisée en menuiserie sur mesure.", expected: "conforme" },
  { id: "B27", champ: "job_employer_description", text: "Restaurant traditionnel de 25 couverts, service du midi uniquement.", expected: "conforme" },
  { id: "B28", champ: "job_employer_description", text: "Nous accompagnons chaque année deux à trois alternants jusqu'à l'obtention du diplôme.", expected: "conforme" },
  { id: "B29", champ: "job_employer_description", text: "Travail en équipe avec deux alternants déjà en poste et un responsable de service.", expected: "conforme" },
  { id: "B30", champ: "job_employer_description", text: "La mutuelle d'entreprise et les tickets restaurant sont pris en charge à 60 %.", expected: "conforme" },
  { id: "B31", champ: "job_employer_description", text: "Poste basé à Lyon 7e, accessible en transports en commun.", expected: "conforme" },
  { id: "B32", champ: "job_employer_description", text: "PME de 40 personnes dans la distribution de matériel médical, présente sur trois régions.", expected: "conforme" },
]

export const EVAL_CASES: IEvalCase[] = [...ADVERSARIAL_CASES, ...BENIGN_CASES]
