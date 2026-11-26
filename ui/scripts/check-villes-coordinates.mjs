#!/usr/bin/env node
/**
 * Compare les coordonnées de `ui/config/villes.txt` à la mairie de chaque commune donnée par
 * geo.api.gouv.fr (code INSEE de la ligne). Appelle le réseau : à lancer à la main après une
 * modification du fichier, hors CI. Le test `ui/utils/get-static-data.test.ts` ne vérifie que le
 * territoire.
 *
 * Sorties : 0 si toutes les villes sont à moins du seuil ; 1 si une ville le dépasse ; 2 si une
 * commune n'a pas pu être interrogée (un contrôle incomplet ne sort jamais en succès).
 *
 * Usage : node ui/scripts/check-villes-coordinates.mjs [--seuil-km=5] [fichier]
 */
import { readFileSync } from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const seuilKm = Number(args.find((a) => a.startsWith("--seuil-km="))?.split("=")[1] ?? 5)
const fichier = args.find((a) => !a.startsWith("--")) ?? path.join(import.meta.dirname, "../config/villes.txt")

const distanceKm = ([lon1, lat1], [lon2, lat2]) => {
  const rad = (d) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

const mairie = async (insee) => {
  let erreur = ""
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes/${insee}?fields=nom,mairie`, { signal: AbortSignal.timeout(15_000) })
      if (res.ok) return { coordonnees: (await res.json()).mairie.coordinates }
      erreur = `HTTP ${res.status}`
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e)
    }
    await new Promise((r) => setTimeout(r, 1000 * essai))
  }
  return { erreur }
}

const lignes = readFileSync(fichier, "utf8").split(/\r?\n/).filter(Boolean)
const ecarts = []
const injoignables = []
for (const ligne of lignes) {
  const [nom, , insee, , lon, lat] = ligne.split("/")
  const { coordonnees: reference, erreur } = await mairie(insee)
  if (!reference) {
    injoignables.push(`${nom} (${insee}) : ${erreur}`)
    continue
  }
  const km = distanceKm([Number(lon), Number(lat)], reference)
  if (km > seuilKm) ecarts.push(`${nom} (${insee}) : ${km.toFixed(1)} km de la mairie [${reference.join(", ")}], fichier [${lon}, ${lat}]`)
}

console.log(`${lignes.length} villes contrôlées, seuil ${seuilKm} km`)
for (const e of ecarts) console.error(`ÉCART ${e}`)
for (const i of injoignables) console.error(`NON CONTRÔLÉE ${i}`)
process.exit(injoignables.length > 0 ? 2 : ecarts.length > 0 ? 1 : 0)
