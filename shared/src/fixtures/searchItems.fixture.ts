import { ObjectId } from "bson"

import type { ISearchItem } from "../models/searchItems.model.js"

export function generateSearchItemFixture(data: Partial<ISearchItem> = {}): ISearchItem {
  return {
    _id: new ObjectId(),
    url_id: "offre-developpeur-web-paris",
    type: "offre",
    type_filter_label: "Offre d'emploi en alternance",
    sub_type: "matcha",
    contract_type: ["Apprentissage"],
    publication_date: new Date("2025-01-15T10:00:00.000Z"),
    is_disabled_elligible: false,
    start_date: null,
    start_type: null,
    is_start_flexible: null,
    is_algo_company: false,
    smart_apply: false,
    application_count: 3,
    title: "Développeur web",
    description: "Nous recherchons un développeur web en alternance pour rejoindre notre équipe.",
    address: "126 Rue de l'Université, 75007 Paris",
    location: { type: "Point", coordinates: [2.3522, 48.8566] },
    organization_name: "Entreprise Test",
    level: "6",
    activity_sector: "Informatique",
    keywords: ["javascript", "react", "node"],
    rome_labels: ["Développement informatique et télécommunication"],
    ...data,
  }
}
