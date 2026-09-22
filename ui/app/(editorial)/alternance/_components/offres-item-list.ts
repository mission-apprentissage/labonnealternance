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
// Sert aussi de nom accessible au lien de la carte (RGAA 6.1.4) : le titre affiché passe par
// dangerouslySetInnerHTML, il doit être débarrassé de son balisage avant d'entrer dans un aria-label.
export function cardName(card: OffreCard): string {
  const raw = card.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? card.workplace_naf_label || card.workplace_name : card.offer_title
  return stripHtmlTags(raw ?? "")
}

export function buildOffresItemList(cards: OffreCard[]): { name: string; url: string }[] {
  return cards.map((card) => ({ name: cardName(card), url: card.lba_url })).filter((entry): entry is { name: string; url: string } => Boolean(entry.name && entry.url))
}
