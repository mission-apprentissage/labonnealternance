import { describe, expect, it } from "vitest"

import { buildRechercheMetadata } from "./recherche.metadata.utils"

const withJobAndCity = { job_name: "Data analyst", geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 } }
const withJobOnly = { job_name: "Data analyst", geo: null }
const empty = { job_name: null, geo: null }

describe("buildRechercheMetadata", () => {
  describe("default (offres + formations)", () => {
    it("met le métier et la ville en tête du title", () => {
      const { title } = buildRechercheMetadata(withJobAndCity, "default")
      expect(title).toBe("Alternance Data analyst à Lyon : offres et formations | La bonne alternance")
    })

    it("gère le métier seul (France entière) dans la description", () => {
      const { title, description } = buildRechercheMetadata(withJobOnly, "default")
      expect(title).toBe("Alternance Data analyst : offres et formations | La bonne alternance")
      expect(description).toBe("Toutes les offres et formations en alternance Data analyst en France. Postulez gratuitement sur le service public de l'alternance.")
    })

    it("retombe sur un title générique sans métier", () => {
      const { title } = buildRechercheMetadata(empty, "default")
      expect(title).toBe("Offres et formations en alternance | La bonne alternance")
    })

    it("traite un job_name vide comme une absence de métier", () => {
      const { title } = buildRechercheMetadata({ job_name: "  ", geo: null }, "default")
      expect(title).toBe("Offres et formations en alternance | La bonne alternance")
    })

    it("gère des params null", () => {
      const { title } = buildRechercheMetadata(null, "default")
      expect(title).toBe("Offres et formations en alternance | La bonne alternance")
    })
  })

  describe("emploi (offres d'emploi uniquement)", () => {
    it("cible les offres d'emploi avec un CTA dans la description", () => {
      const { title, description } = buildRechercheMetadata(withJobAndCity, "emploi")
      expect(title).toBe("Alternance Data analyst à Lyon : offres d'emploi | La bonne alternance")
      expect(description).toBe("Toutes les offres d'emploi en alternance Data analyst à Lyon. Postulez gratuitement sur le service public de l'alternance.")
    })
  })

  describe("formation (formations uniquement)", () => {
    it("cible les formations", () => {
      const { title, description } = buildRechercheMetadata(withJobAndCity, "formation")
      expect(title).toBe("Formations en alternance Data analyst à Lyon | La bonne alternance")
      expect(description).toBe(
        "Toutes les formations en apprentissage Data analyst à Lyon. Comparez les programmes et postulez gratuitement sur le service public de l'alternance."
      )
    })
  })

  describe("recherche géo-restreinte sans libellé d'adresse (lat/lon sans address)", () => {
    const geoSansAdresse = { job_name: "Data analyst", geo: { address: null, latitude: 45.75, longitude: 4.85 } }

    it("n'ajoute pas de lieu au title et n'écrit pas « en France » dans la description", () => {
      const { title, description } = buildRechercheMetadata(geoSansAdresse, "default")
      expect(title).toBe("Alternance Data analyst : offres et formations | La bonne alternance")
      expect(description).toBe("Toutes les offres et formations en alternance Data analyst. Postulez gratuitement sur le service public de l'alternance.")
    })
  })

  describe("canonical (déduplication des paramètres parasites)", () => {
    it("métier + ville : garde job_name + lat/lon + address pour reproduire fidèlement la SERP géo", () => {
      expect(buildRechercheMetadata(withJobAndCity, "default").alternates?.canonical).toBe("/recherche?job_name=Data+analyst&lat=45.75&lon=4.85&address=Lyon")
    })

    it("inclut romes + job_name dans un ordre stable", () => {
      const params = { job_name: "Data analyst", romes: ["M1403"], geo: null }
      expect(buildRechercheMetadata(params, "default").alternates?.canonical).toBe("/recherche?romes=M1403&job_name=Data+analyst")
    })

    it("droppe la géo sans libellé (recherche par rayon lat/lon sans address)", () => {
      const geoSansAdresse = { job_name: "Data analyst", geo: { address: null, latitude: 45.75, longitude: 4.85 } }
      expect(buildRechercheMetadata(geoSansAdresse, "default").alternates?.canonical).toBe("/recherche?job_name=Data+analyst")
    })

    it("ville seule (sans métier) : consolide vers le chemin nu (évite dup-title et cannibalisation des pages ville)", () => {
      const villeSeule = { job_name: null, geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 } }
      expect(buildRechercheMetadata(villeSeule, "default").alternates?.canonical).toBe("/recherche")
    })

    it("pointe vers le bon chemin selon le mode", () => {
      expect(buildRechercheMetadata(withJobOnly, "emploi").alternates?.canonical).toBe("/recherche-emploi?job_name=Data+analyst")
      expect(buildRechercheMetadata(withJobOnly, "formation").alternates?.canonical).toBe("/recherche-formation?job_name=Data+analyst")
    })

    it("retombe sur le chemin nu sans critère de recherche", () => {
      expect(buildRechercheMetadata(empty, "default").alternates?.canonical).toBe("/recherche")
    })
  })
})
