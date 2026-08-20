import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { buildRecherchePageParams, deserializeItemReferences, IRechercheMode, parseRecherchePageParams, serializeItemReferences } from "./recherche.route.utils"

/**
 * Ce module a perdu ses schémas zod (le type `IRecherchePageParams` est désormais explicite et
 * `z.enum().parse` est remplacé par `parseEnum`) : ces tests remplacent la validation qui était
 * jusqu'ici portée par zod. Les cas qui doivent répondre *faux* passent en premier — c'est là
 * que la réécriture peut régresser sans que rien ne le signale.
 */
describe("deserializeItemReferences", () => {
  describe("entrées rejetées", () => {
    it("rejette un type inconnu", () => {
      expect(deserializeItemReferences("unknown:123")).toEqual([])
    })

    it("rejette une chaîne vide", () => {
      expect(deserializeItemReferences("")).toEqual([])
    })

    // Comportement préexistant (identique avant la sortie de zod, vérifié) : un item sans
    // séparateur ou sans id produit une référence à `id` vide plutôt qu'un rejet. Inoffensif
    // aujourd'hui (aucune occurrence en prod) mais `getResultItemUrl` en ferait une URL de
    // fiche sans identifiant — à durcir séparément si on veut l'interdire.
    it("accepte un item sans séparateur en laissant l'id vide", () => {
      expect(deserializeItemReferences("partnerJob")).toEqual([{ ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB, id: "" }])
    })

    it("ne garde que les items valides d'une liste mixte", () => {
      expect(deserializeItemReferences("partnerJob:abc,unknown:def")).toEqual([{ ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB, id: "abc" }])
    })
  })

  describe("casse", () => {
    // `parseEnum` est insensible à la casse, contrairement au `z.enum().parse` d'avant.
    // Élargissement assumé et mesuré (0 occurrence non canonique sur 24 h de trafic prod) :
    // ce test est là pour qu'un changement de `parseEnum` ne passe pas inaperçu.
    it("normalise une casse non canonique sur la valeur canonique", () => {
      expect(deserializeItemReferences("PARTNERJOB:abc")).toEqual([{ ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB, id: "abc" }])
      expect(deserializeItemReferences("pejob:abc")).toEqual([{ ideaType: LBA_ITEM_TYPE_OLD.PEJOB, id: "abc" }])
    })
  })

  describe("round-trip", () => {
    it.each([LBA_ITEM_TYPE_OLD.PARTNER_JOB, LBA_ITEM_TYPE_OLD.FORMATION, LBA_ITEM_TYPE_OLD.LBA, LBA_ITEM_TYPE_OLD.MATCHA])("préserve %s", (ideaType) => {
      const refs = [{ id: "6a4d82cedea3d72", ideaType }]
      expect(deserializeItemReferences(serializeItemReferences(refs))).toEqual(refs)
    })

    it("préserve plusieurs items", () => {
      const refs = [
        { id: "6a4d82cedea3d72", ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB },
        { id: "120394P012113002", ideaType: LBA_ITEM_TYPE_OLD.FORMATION },
      ]
      expect(deserializeItemReferences(serializeItemReferences(refs))).toEqual(refs)
    })

    it("accepte la forme double-encodée servie en production (activeItems=lba%253A…)", () => {
      // `serializeItemReferences` encode `type:id`, puis URLSearchParams réencode le `%` :
      // l'URL réelle porte `%253A`. Après le décodage de URLSearchParams on retrouve `%3A`.
      const fromUrl = new URLSearchParams("activeItems=lba%253A31988334404216").get("activeItems")
      expect(deserializeItemReferences(fromUrl ?? "")).toEqual([{ ideaType: LBA_ITEM_TYPE_OLD.LBA, id: "31988334404216" }])
    })
  })
})

describe("parseRecherchePageParams", () => {
  it("retourne null sans searchParams", () => {
    expect(parseRecherchePageParams(null, IRechercheMode.DEFAULT)).toBeNull()
  })

  it("applique les valeurs par défaut sur une URL nue", () => {
    const params = parseRecherchePageParams(new URLSearchParams(""), IRechercheMode.DEFAULT)
    expect(params).toMatchObject({
      romes: [],
      geo: null,
      radius: 30,
      diploma: null,
      typesEmploi: [],
      activeItems: [],
      displayEntreprises: true,
      displayFormations: true,
      displayFilters: true,
    })
  })

  it("ignore une géo incomplète (address seule, sans lat/lon)", () => {
    const params = parseRecherchePageParams(new URLSearchParams("address=Lyon"), IRechercheMode.DEFAULT)
    expect(params.geo).toBeNull()
  })

  it("rejette un diploma hors référentiel", () => {
    expect(parseRecherchePageParams(new URLSearchParams("diploma=42+(Inexistant)"), IRechercheMode.DEFAULT).diploma).toBeNull()
  })

  it("filtre les typesEmploi inconnus", () => {
    const params = parseRecherchePageParams(new URLSearchParams("typesEmploi=Candidatures spontanées,inconnu"), IRechercheMode.DEFAULT)
    expect(params.typesEmploi).toEqual(["Candidatures spontanées"])
  })

  it("force les toggles d'affichage en mode formations-only", () => {
    const params = parseRecherchePageParams(new URLSearchParams("displayEntreprises=true&displayFilters=true"), IRechercheMode.FORMATIONS_ONLY)
    expect(params).toMatchObject({ displayEntreprises: false, displayFormations: true, displayFilters: false })
  })

  it("fait un round-trip avec buildRecherchePageParams", () => {
    const query = buildRecherchePageParams(
      {
        romes: ["M1805"],
        geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
        radius: 60,
        job_name: "Data analyst",
        activeItems: [{ id: "6a4d82cedea3d72", ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB }],
      },
      IRechercheMode.DEFAULT
    )
    expect(parseRecherchePageParams(new URLSearchParams(query), IRechercheMode.DEFAULT)).toMatchObject({
      romes: ["M1805"],
      geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 },
      radius: 60,
      job_name: "Data analyst",
      activeItems: [{ id: "6a4d82cedea3d72", ideaType: LBA_ITEM_TYPE_OLD.PARTNER_JOB }],
    })
  })
})
