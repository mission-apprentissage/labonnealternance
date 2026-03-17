import { ObjectId } from "bson"

import type { IAlgolia } from "../models/algolia.model.js"

export function generateAlgoliaFixture(data: Partial<IAlgolia> = {}): IAlgolia {
  return {
    _id: new ObjectId(),
    objectID: new ObjectId().toString(),
    url_id: "offre-developpeur-web-paris",
    type: "offre",
    type_filter_label: "Offre d'emploi en alternance",
    sub_type: "matcha",
    contract_type: ["Apprentissage"],
    publication_date: new Date("2025-01-15T10:00:00.000Z"),
    smart_apply: false,
    application_count: 3,
    title: "Développeur web",
    description: "Nous recherchons un développeur web en alternance pour rejoindre notre équipe.",
    address: "126 Rue de l'Université, 75007 Paris",
    _geoloc: { lat: 48.8566, lng: 2.3522 },
    location: { type: "Point", coordinates: [2.3522, 48.8566] },
    organization_name: "Entreprise Test",
    level: "6",
    activity_sector: "Informatique",
    keywords: ["javascript", "react", "node"],
    ...data,
  }
}
