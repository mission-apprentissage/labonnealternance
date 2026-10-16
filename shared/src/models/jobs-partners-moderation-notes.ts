import type { IJobsPartnersModerationFinding, IModerationCategory, IModerationField } from "./jobs-partners-moderation.model.js"
import { MODERATION_FIELDS } from "./jobs-partners-moderation.model.js"

/** Libellé court d'une catégorie, affiché aux modérateurs dans la note de l'agent. */
export const MODERATION_CATEGORY_LABELS: Record<IModerationCategory, string> = {
  discrimination: "Critère discriminatoire",
  remuneration: "Rémunération",
  subordination: "Conditions de travail",
  taches_illegales: "Missions",
  mineurs: "Travail des mineurs",
  contact_bypass: "Coordonnées déguisées",
  candidature_hors_plateforme: "Candidature hors de La bonne alternance",
  experience_exigee: "Expérience exigée",
  teletravail_integral: "Télétravail intégral",
  melange_contrats: "Mélange de contrats",
  poste_salarie: "Responsabilités de salarié confirmé",
  intermediaire: "Offre sans entreprise d’accueil identifiable",
}

/** Texte de la note de l'agent envoyé au recruteur dans l'e-mail de refus, un par catégorie. Rédaction validée par la modération (#5499). */
export const MODERATION_CATEGORY_NOTES: Record<IModerationCategory, string> = {
  discrimination:
    "Un recrutement ne peut pas reposer sur l’âge, le sexe, l’apparence physique, l’origine, la situation de famille, l’état de santé, le handicap ou le lieu de résidence du candidat (Code du travail, art. L1132-1). Une offre ne peut notamment pas fixer de limite d’âge (art. L5331-2) ni s’adresser à un seul sexe (art. L1142-1). Décrivez plutôt les missions et les compétences attendues, et ouvrez le poste à toutes et à tous (par exemple « apprenti(e) » ou « H/F »).",
  remuneration:
    "Le salaire d’un alternant ne peut pas être remplacé par des pourboires, des primes ou un avantage en nature. Il ne peut pas non plus être inférieur au minimum légal, qui dépend de l’âge et, selon le contrat, de l’année d’apprentissage ou du niveau de qualification. Les primes et avantages peuvent s’ajouter au salaire, pas le remplacer.",
  subordination:
    "Une disponibilité permanente ou des horaires sans aucun cadre ne sont pas compatibles avec un contrat en alternance, qui respecte la durée légale du travail et les temps de formation. Précisez les horaires ou leur organisation.",
  taches_illegales:
    "Les missions d’un alternant doivent être licites et liées au diplôme qu’il prépare. Une activité interdite, non déclarée ou relevant de la vie privée de l’employeur ne peut pas lui être confiée.",
  mineurs:
    "L’apprentissage est ouvert dès 16 ans (15 ans en sortie de 3ᵉ). Pour un apprenti mineur, le travail de nuit et certaines activités (travaux dangereux, service d’alcool) sont encadrés. Ne réservez pas l’offre aux majeurs : décrivez plutôt les horaires et les contraintes du poste. Les conditions propres aux mineurs sont vérifiées à la signature du contrat.",
  contact_bypass:
    "Pour la sécurité des candidats, les coordonnées personnelles ne sont pas affichées sur les offres. Une adresse ou un numéro écrit de façon détournée pour échapper à ce masquage n’est pas accepté. Les candidats vous contactent directement depuis l’offre.",
  candidature_hors_plateforme:
    "Les candidats postulent directement depuis l’offre. Évitez de demander un envoi par un autre canal (e-mail, téléphone, site de l’entreprise). Les candidatures reçues sur La bonne alternance sont centralisées et vous pouvez y répondre directement, ce qui facilite votre suivi.",
  experience_exigee:
    "Un alternant se forme pendant son contrat : exiger une expérience professionnelle préalable écarte la plupart des candidats. Présentez-la plutôt comme un plus que comme une condition.",
  teletravail_integral:
    "L’alternance repose sur l’apprentissage du métier au contact de l’équipe et d’un tuteur, ce qu’un poste entièrement en télétravail ne permet pas. Précisez le rythme de présence dans l’entreprise.",
  melange_contrats:
    "La bonne alternance ne diffuse que des offres en contrat d’apprentissage ou de professionnalisation, à durée déterminée ou indéterminée. Retirez les mentions de stage ou d’emploi salarié classique, et précisez le type de contrat en alternance proposé.",
  poste_salarie:
    "Un alternant apprend le métier aux côtés d’un tuteur. Lui confier seul une fonction complète, le management d’une équipe ou un rôle de décision correspond à un poste de salarié confirmé. Décrivez les missions qu’il assurera en appui et ce qu’il apprendra.",
  intermediaire:
    "Un candidat doit pouvoir se projeter dans son alternance. Même sans nommer l’entreprise, l’offre doit décrire son activité, l’environnement de travail, le rythme d’alternance et les missions concrètes. Une offre générique sans aucune de ces informations, qui présente surtout la formation, ou qui demande des frais au candidat, ne peut pas être conservée en l’état.",
}

export const MODERATION_FIELD_LABELS: Record<IModerationField, string> = {
  job_description: "La description de l’offre",
  job_employer_description: "La description de l’entreprise",
}

const FIELDS_IN_SENTENCE: Record<IModerationField, string> = {
  job_description: "la description de l’offre",
  job_employer_description: "la description de l’entreprise",
}

const joinWithEt = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`)

type IAgentNoteFinding = Pick<IJobsPartnersModerationFinding, "champ" | "category" | "verbatim">

/**
 * Note de l'agent de l'e-mail de refus : un paragraphe par catégorie, dans l'ordre des constats. Les extraits d'une même
 * catégorie sont regroupés par champ et son texte n'apparaît qu'une fois. Un extrait purgé laisse le texte seul.
 */
export const buildAgentNoteParagraphs = (findings: IAgentNoteFinding[]): string[] => {
  const extractsByCategory = new Map<IModerationCategory, Map<IModerationField, string[]>>()
  for (const { category, champ, verbatim } of findings) {
    const extractsByField = extractsByCategory.get(category) ?? new Map<IModerationField, string[]>()
    extractsByCategory.set(category, extractsByField)
    const extracts = extractsByField.get(champ) ?? []
    extractsByField.set(champ, extracts)
    const extract = verbatim?.trim()
    if (extract && !extracts.includes(extract)) extracts.push(extract)
  }
  return [...extractsByCategory].map(([category, extractsByField]) => {
    const sentences = MODERATION_FIELDS.flatMap((field) => {
      const extracts = extractsByField.get(field) ?? []
      return extracts.length ? [`Dans ${FIELDS_IN_SENTENCE[field]}, vous avez écrit ${joinWithEt(extracts.map((extract) => `“${extract}”`))}.`] : []
    })
    return [...sentences, MODERATION_CATEGORY_NOTES[category]].join(" ")
  })
}
