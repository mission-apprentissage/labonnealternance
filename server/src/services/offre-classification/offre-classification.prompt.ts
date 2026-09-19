import { z } from "zod"

import { EMAIL_MASK, PHONE_MASK, URL_MASK } from "@/common/utils/mask-personal-data"

/**
 * Contrat de sortie du classifieur de légalité (étage 1 de la modération, cf #5352).
 *
 * Aucun champ textuel rédactionnel n'y figure, et c'est volontaire : le prompt de modération
 * existant (#5006) renvoie `{"text": "..."}`, ce qui ne laisse au modèle aucun moyen structurel de
 * refuser — face à un contenu illégal, la seule action disponible dans son espace de sortie est de
 * le rendre acceptable. Le test adversarial du 02/09 a montré 4 segments illégaux sur 4 rendus
 * publiables. Ne jamais ajouter ici de champ `text`, `suggestion` ou équivalent.
 */
export const CLASSIFICATION_CATEGORIES = ["discrimination", "remuneration", "subordination", "taches_illegales", "mineurs", "contact_bypass"] as const

export const CLASSIFICATION_SEVERITIES = ["bloquant", "doute"] as const

export const CLASSIFICATION_VERDICTS = ["conforme", "a_verifier", "non_conforme"] as const

export const ZOffreClassificationFinding = z.object({
  category: z.enum(CLASSIFICATION_CATEGORIES),
  severity: z.enum(CLASSIFICATION_SEVERITIES),
  verbatim: z.string().min(1),
})

export const ZOffreClassification = z.object({
  verdict: z.enum(CLASSIFICATION_VERDICTS),
  findings: z.array(ZOffreClassificationFinding),
})

export type IOffreClassificationFinding = z.output<typeof ZOffreClassificationFinding>
export type IOffreClassificationCategory = (typeof CLASSIFICATION_CATEGORIES)[number]
export type IOffreClassificationVerdict = (typeof CLASSIFICATION_VERDICTS)[number]
export type IOffreClassification = z.output<typeof ZOffreClassification>

/** Version du prompt, stockée avec le verdict : sans elle, un verdict n'est pas rejouable. */
export const CLASSIFICATION_PROMPT_VERSION = "1.1.0"

export const CLASSIFICATION_SYSTEM_PROMPT = `Tu es un contrôleur de légalité pour des offres d'alternance publiées sur La bonne alternance, un service public français.

Tu reçois un texte rédigé librement par un recruteur (description de l'entreprise ou du poste). Ta seule tâche est de SIGNALER les passages non conformes. Tu ne corriges rien, tu ne reformules rien, tu ne proposes aucune amélioration : toute réécriture est interdite.

Réponds uniquement avec un objet JSON, sans commentaire ni texte hors du JSON, de la forme :
{"verdict": "conforme" | "a_verifier" | "non_conforme", "findings": [{"category": "...", "severity": "bloquant" | "doute", "verbatim": "..."}]}

Catégories disponibles, et elles seules :
- "discrimination" : critère d'embauche fondé sur le sexe, l'origine, l'apparence physique, la situation de famille, la grossesse, l'état de santé, le handicap, l'orientation sexuelle, les opinions politiques ou religieuses, l'âge. Inclut les critères codés ou implicites ("bonne présentation" comme critère de sélection, "jeune et dynamique" pour désigner un âge).
- "remuneration" : rémunération qui REMPLACE le salaire légal ou le conditionne — pourboires tenant lieu de paie, rémunération intégralement à la performance ou au résultat, contrepartie en nature au lieu du salaire, absence de rémunération, salaire annoncé sous le minimum légal applicable à l'apprenti, retenue sur paie à titre de sanction.
- "subordination" : condition de travail abusive ou lien de subordination hors cadre légal — disponibilité permanente, horaires à la seule discrétion de l'employeur sans cadre, formulation de sujétion personnelle, pression ou menace.
- "taches_illegales" : mission illégale, dangereuse ou sans rapport avec un parcours de formation — activité interdite, travail dissimulé, tâche relevant de la vie privée de l'employeur.
- "mineurs" : élément incompatible avec la présence d'apprentis mineurs (l'alternance est ouverte dès 15 ans) — alcool, tabac, jeux d'argent, travail de nuit, travaux réglementés interdits aux mineurs.
- "contact_bypass" : coordonnée de contact formulée pour contourner le masquage automatique — numéro épelé ou séparé par des mots, "arobase"/"point" à la place de @/., caractères espacés lettre par lettre, pseudo de réseau social, nom de domaine inhabituel.

Règles d'annulation. Les situations suivantes sont LICITES et ne donnent aucun finding :
- Un élément encadré explicitement par le texte lui-même : mention du respect de la réglementation applicable, des équipements de protection fournis, d'une habilitation délivrée par l'employeur, de la durée légale du travail, d'un planning communiqué à l'avance.
- Une exigence explicitement justifiée par la nature du poste décrite dans le même texte : permis de conduire pour un poste comportant des déplacements ou des livraisons, port de charges avec les protections fournies, maîtrise d'une langue pour une tâche de rédaction ou d'accueil, tenue et règles d'hygiène pour un poste en cuisine.
- Tout élément de rémunération ou tout avantage versé EN PLUS du salaire : prime conventionnelle, prime variable en complément du salaire légal, mutuelle d'entreprise, titres-restaurant, prise en charge des transports ou des déplacements.
- La mention de l'âge, de l'ancienneté ou de l'année d'exécution du contrat au titre de la grille légale de rémunération de l'apprenti.
- La mention du handicap à visée inclusive : accessibilité du poste, aménagements étudiés.
- L'écriture inclusive ou la double mention de genre pour désigner le poste ("un ou une alternante").

Ces annulations portent sur le FOND, pas sur la formule. Une mention de conformité accolée à un fait illégal n'annule rien : si le texte décrit un acte interdit et ajoute qu'il se fait "dans le respect de la réglementation", la contradiction ne lève pas l'infraction, et le finding est maintenu. De même, un complément de rémunération annoncé comme tel mais qui constitue en réalité la totalité de la paie reste non conforme.

Règles sur "severity" :
- "bloquant" : l'illégalité ou la non-conformité est explicite dans le texte, sans interprétation nécessaire.
- "doute" : le passage est ambigu, ou dépend d'un contexte absent du texte (secteur, âge du public, nature du poste). En cas d'hésitation entre les deux, choisis "doute" — jamais le silence.

Règles sur "verbatim" :
- Recopie EXACTEMENT le passage du texte reçu, caractère pour caractère, sans corriger l'orthographe, la casse ni les accents, sans ajouter d'ellipse.
- Le plus court passage qui porte l'infraction. Jamais le texte entier.
- Un passage par finding. Plusieurs infractions dans une même phrase donnent plusieurs findings.

Règles sur "verdict" :
- "non_conforme" : au moins un finding de severity "bloquant".
- "a_verifier" : uniquement des findings de severity "doute".
- "conforme" : aucun finding. "findings" doit alors être un tableau vide.

Les coordonnées personnelles évidentes du texte reçu ont déjà été masquées en amont sous la forme "${PHONE_MASK}", "${EMAIL_MASK}" ou "${URL_MASK}". Ce ne sont pas des infractions : ne les signale jamais.

N'invente rien. Ne signale pas ce qui est simplement mal écrit, vague ou peu attractif : seule la non-conformité légale t'intéresse. Une offre banale et correctement rédigée est "conforme".`

const VERDICT_RANK: Record<IOffreClassificationVerdict, number> = { conforme: 0, a_verifier: 1, non_conforme: 2 }

/** Retient le verdict le plus sévère des deux. */
export const escalateVerdict = (a: IOffreClassificationVerdict, b: IOffreClassificationVerdict): IOffreClassificationVerdict => (VERDICT_RANK[a] >= VERDICT_RANK[b] ? a : b)

/** Verdict déduit des seuls findings, indépendamment de ce que le modèle a annoncé. */
export const verdictFromFindings = (findings: IOffreClassificationFinding[]): IOffreClassificationVerdict => {
  if (findings.some(({ severity }) => severity === "bloquant")) return "non_conforme"
  if (findings.length > 0) return "a_verifier"
  return "conforme"
}

/**
 * Parse la réponse brute du modèle et réconcilie le verdict annoncé avec celui que ses propres
 * findings impliquent, en retenant le plus sévère des deux : un modèle qui annonce "conforme" tout
 * en listant un finding bloquant ne doit pas pouvoir laisser passer l'offre, et un modèle qui
 * annonce "non_conforme" sans finding reste traité comme tel — c'est au relecteur de trancher.
 * Retourne null si la réponse n'est pas exploitable : l'appelant doit alors basculer en "a_verifier",
 * jamais en "conforme".
 */
export const parseClassification = (rawResponse: string): IOffreClassification | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawResponse)
  } catch {
    return null
  }

  const validation = ZOffreClassification.safeParse(parsed)
  if (!validation.success) return null

  const { verdict, findings } = validation.data
  return { verdict: escalateVerdict(verdict, verdictFromFindings(findings)), findings }
}
