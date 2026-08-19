import { z } from "../zod-with-open-api.js"

/**
 * Primitives zod SANS dépendance lourde, importables depuis le code client.
 *
 * `zod-primitives.ts` construit en eager les schémas `siret` et `telephone`, qui
 * importent statiquement les validateurs Luhn et libphonenumber-js (~39 ko gzip) :
 * tout module client qui importe `extensions` embarque libphonenumber dans son
 * bundle, même pour un simple `buildEnum`. Les helpers ci-dessous sont extraits
 * ici pour que les chaînes d'import côté navigateur (params de recherche, modèle
 * d'adresse) restent légères. `zod-primitives.ts` les ré-exporte dans `extensions`
 * pour ne rien casser côté serveur.
 */

export const buildEnum = <EnumValue extends string>(enumObject: Record<string, EnumValue>) => {
  const values = Object.values(enumObject)
  if (!values.length) {
    throw new Error("inattendu : enum vide")
  }
  return z.enum([values[0], ...values.slice(1)])
}

export const latitude = ({ coerce }: { coerce: boolean }) => {
  const base = coerce ? z.coerce.number<number>() : z.number()
  return base.min(-90, "Latitude doit être comprise entre -90 et 90").max(90, "Latitude doit être comprise entre -90 et 90")
}

export const longitude = ({ coerce }: { coerce: boolean }) => {
  const base = coerce ? z.coerce.number<number>() : z.number()
  return base.min(-180, "Longitude doit être comprise entre -180 et 180").max(180, "Longitude doit être comprise entre -180 et 180")
}
