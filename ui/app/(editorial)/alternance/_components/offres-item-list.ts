import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

// Forme minimale d'une carte d'offre nécessaire au schéma ItemList (compatible donnée brute comme donnée sérialisée par l'API).
type OffreCard = {
  partner_label?: string | null
  offer_title?: string | null
  workplace_naf_label?: string | null
  workplace_name?: string | null
  lba_url?: string | null
}

// Retire les balises HTML éventuelles d'un intitulé. On boucle jusqu'à stabilisation pour éviter
// les contournements d'un simple `replace` global (ex. `<scr<script>ipt>` qui laisserait `<script`).
function stripHtmlTags(input: string): string {
  let current = input
  let previous: string
  do {
    previous = current
    current = current.replace(/<[^>]*>/g, "")
  } while (current !== previous)
  return current.trim()
}

// Nom lisible pour le schéma. Pour une candidature spontanée (RECRUTEURS_LBA), il n'y a pas d'intitulé
// de poste : on retombe sur le secteur/l'entreprise, comme la carte affichée à l'utilisateur.
function cardName(card: OffreCard): string {
  const raw = card.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? card.workplace_naf_label || card.workplace_name : card.offer_title
  return stripHtmlTags(raw ?? "")
}

// Construit les entrées ItemList (schema.org) à partir des cartes d'offres d'une page landing.
// On ne conserve que les cartes disposant d'une URL et d'un intitulé exploitable.
export function buildOffresItemList(cards: OffreCard[]): { name: string; url: string }[] {
  return cards.map((card) => ({ name: cardName(card), url: card.lba_url })).filter((entry): entry is { name: string; url: string } => Boolean(entry.name && entry.url))
}
