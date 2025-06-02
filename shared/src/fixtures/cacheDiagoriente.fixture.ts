import { ObjectId } from "bson"

import { ICacheDiagoriente } from "../models/cacheDiagoriente.model.js"

export const cacheDiagorienteFixture = (props: Partial<ICacheDiagoriente> = {}): ICacheDiagoriente => {
  return {
    _id: new ObjectId(),
    title: "Assistant / Assistante documentaliste H/F",
    sector: "Commerce de détail d'habillement en magasin spécialisé",
    code_rome: "K1601",
    intitule_rome: "Gestion de l'information et de la documentation",
    ...props,
  }
}
