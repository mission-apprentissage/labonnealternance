// Forme minimale d'une carte d'offre nécessaire au schéma ItemList (compatible donnée brute comme donnée sérialisée par l'API).
type OffreCard = { offer_title?: string | null; lba_url?: string | null }

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

// Construit les entrées ItemList (schema.org) à partir des cartes d'offres d'une page landing.
// On ne conserve que les cartes disposant d'une URL et d'un intitulé, et on retire le HTML éventuel du titre.
export function buildOffresItemList(cards: OffreCard[]): { name: string; url: string }[] {
  return cards
    .filter((card) => card.lba_url && card.offer_title)
    .map((card) => ({
      name: stripHtmlTags(card.offer_title as string),
      url: card.lba_url as string,
    }))
}
