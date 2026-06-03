/**
 * Mapping en dur des libellés `type_filter_label` vers leur sous-groupe
 * d'affichage (Formation / Offre d'emploi). Les facettes renvoyées par
 * `/v1/search` sont plates : ce mapping permet de les regrouper dans le
 * filtre Type. Tout libellé inconnu retombe sur « Offre d'emploi ».
 */
export const TYPE_GROUP_FORMATION = "Formation"
export const TYPE_GROUP_EMPLOI = "Offre d'emploi"

const TYPE_FILTER_GROUPS: Record<string, string> = {
  "Formation en présentiel": TYPE_GROUP_FORMATION,
  "Formation à distance": TYPE_GROUP_FORMATION,
  "Candidatures spontannées": TYPE_GROUP_EMPLOI,
  "Offres d'emploi partenaires": TYPE_GROUP_EMPLOI,
  "Offres d'emploi postées par des écoles": TYPE_GROUP_EMPLOI,
  "Offres d'emploi La bonne alternance": TYPE_GROUP_EMPLOI,
}

function getTypeGroup(label: string): string {
  return TYPE_FILTER_GROUPS[label] ?? TYPE_GROUP_EMPLOI
}

export interface TypeOption {
  value: string
  label: string
  count?: number
}

export interface TypeGroup {
  label: string
  options: TypeOption[]
}

/**
 * Répartit les options `type_filter_label` en deux sous-groupes ordonnés
 * (Formation puis Offre d'emploi). Un sous-groupe vide est omis.
 */
export function buildTypeGroups(options: TypeOption[]): TypeGroup[] {
  const groups: TypeGroup[] = [
    { label: TYPE_GROUP_FORMATION, options: [] },
    { label: TYPE_GROUP_EMPLOI, options: [] },
  ]

  for (const option of options) {
    const group = getTypeGroup(option.value)
    const target = groups.find((g) => g.label === group)
    target?.options.push(option)
  }

  return groups.filter((g) => g.options.length > 0)
}
