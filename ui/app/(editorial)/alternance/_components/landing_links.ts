import { stringNormaliser } from "shared"
import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"

const villeSlugByLabel = new Map(villeData.map((ville) => [stringNormaliser(ville.ville), ville.slug]))
const metierSlugByLabel = new Map(metierData.map((metier) => [stringNormaliser(metier.metier), metier.slug]))

// Renvoie le slug de la page ville correspondante si elle existe, sinon null.
export function findVilleLandingSlug(nom: string): string | null {
  return villeSlugByLabel.get(stringNormaliser(nom)) ?? null
}

// Renvoie le slug de la page métier correspondante si elle existe, sinon null.
export function findMetierLandingSlug(nom: string): string | null {
  return metierSlugByLabel.get(stringNormaliser(nom)) ?? null
}
