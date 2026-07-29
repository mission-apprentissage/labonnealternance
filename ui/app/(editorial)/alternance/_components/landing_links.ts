import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"

// Normalise un libellé (ville ou métier) en slug comparable : minuscules, sans accents, séparateurs -> "-".
// Sert à savoir si une page landing sœur existe pour tisser le maillage interne, avec repli /recherche sinon.
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const villeSlugByLabel = new Map(villeData.map((ville) => [normalize(ville.ville), ville.slug]))
const metierSlugByLabel = new Map(metierData.map((metier) => [normalize(metier.metier), metier.slug]))

// Renvoie le slug de la page ville correspondante si elle existe, sinon null.
export function findVilleLandingSlug(nom: string): string | null {
  return villeSlugByLabel.get(normalize(nom)) ?? null
}

// Renvoie le slug de la page métier correspondante si elle existe, sinon null.
export function findMetierLandingSlug(nom: string): string | null {
  return metierSlugByLabel.get(normalize(nom)) ?? null
}
