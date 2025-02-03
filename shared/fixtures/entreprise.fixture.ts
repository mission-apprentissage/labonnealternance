import { ObjectId } from "bson"

import { VALIDATION_UTILISATEUR } from "../constants/recruteur.js"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "../models/entreprise.model.js"

export function generateEntrepriseFixture(data: Partial<IEntreprise> = {}): IEntreprise {
  const now = new Date()
  return {
    _id: new ObjectId(),
    address: "3 rue du poulet 75001 Paris",
    enseigne: "enseigne OVH",
    status: [generateEntrepriseEventFixture()],
    raison_sociale: "OVH",
    siret: "42476141900045",
    opco: null,
    idcc: null,
    createdAt: now,
    updatedAt: now,
    ...data,
  }
}

export function generateEntrepriseEventFixture(data: Partial<IEntrepriseStatusEvent> = {}): IEntrepriseStatusEvent {
  return {
    date: new Date(),
    reason: "reason",
    status: EntrepriseStatus.VALIDE,
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    ...data,
  }
}
