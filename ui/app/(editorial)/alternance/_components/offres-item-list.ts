// Forme minimale d'une carte d'offre nécessaire au schéma ItemList (compatible donnée brute comme donnée sérialisée par l'API).
type OffreCard = { offer_title?: string | null; lba_url?: string | null }

// Construit les entrées ItemList (schema.org) à partir des cartes d'offres d'une page landing.
// On ne conserve que les cartes disposant d'une URL et d'un intitulé, et on retire le HTML éventuel du titre.
export function buildOffresItemList(cards: OffreCard[]): { name: string; url: string }[] {
  return cards
    .filter((card) => card.lba_url && card.offer_title)
    .map((card) => ({
      name: (card.offer_title as string).replace(/<[^>]*>/g, "").trim(),
      url: card.lba_url as string,
    }))
}
