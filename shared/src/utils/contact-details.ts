/**
 * Retire les coordonnées transmises en clair par les partenaires dans les descriptions d'offres
 * (issue #5227), pour garder le candidat dans le tunnel de candidature LBA.
 *
 * Volontairement des regex simples appliquées sur la seule sous-chaîne détectée, et non
 * `detectUrlAndEmails` (shared/utils/detect-url-and-emails) qui sert à INTERDIRE les urls et
 * emails dans les offres saisies côté espace-pro : celui-ci renvoie l'empan du mot entier délimité
 * par des espaces, ce qui emporterait ici les balises HTML voisines — `<p>contact@acme.fr</p>`
 * deviendrait vide — alors que workplace_description et offer_description conservent leur mise en
 * forme (sanitizeTextField avec keepFormat).
 */

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

/**
 * Numéros français à 10 chiffres, avec séparateurs espace / point / tiret optionnels, sous forme
 * nationale (0X XX XX XX XX) ou internationale (+33X…, 0033X…, +33 (0)X…).
 *
 * Les lookarounds `(?<!\d)` / `(?!\d)` empêchent de mordre dans une suite de chiffres plus longue
 * (SIRET, identifiant partenaire). Limite connue : les découpages en groupes de trois chiffres
 * (« 0 800 123 456 ») ne sont pas reconnus.
 */
const FRENCH_PHONE_REGEX = /(?<!\d)(?:(?:\+|00)33[\s.-]?(?:\(0\)[\s.-]?)?|0)[1-9](?:[\s.-]?\d{2}){4}(?!\d)/g

export const removeContactDetailsFromText = (text: string | null | undefined): string => {
  if (!text) return ""
  const stripped = text.replace(EMAIL_REGEX, "").replace(FRENCH_PHONE_REGEX, "")
  // Rien retiré : on rend le texte verbatim. Le nettoyage ci-dessous ne répare que les blancs
  // que la suppression vient de créer, il n'a pas à reformater la ponctuation et l'indentation
  // de tout le corpus — la très grande majorité des descriptions ne contient aucune coordonnée.
  if (stripped === text) return text

  return (
    stripped
      // `[^\S\r\n]` = un blanc horizontal (espace, tabulation, insécable), pour ne jamais
      // toucher aux retours à la ligne
      .replace(/[^\S\r\n]{2,}/g, " ")
      // espace orphelin devant une ponctuation basse — jamais correct en français, contrairement
      // au « : » ou au « ! » qui gardent leur espace insécable
      .replace(/[^\S\r\n]+([.,;])/g, "$1")
      .replace(/[^\S\r\n]*(\r?\n)[^\S\r\n]*/g, "$1")
      .trim()
  )
}
