import { ObjectId } from "bson"

import type { ICacheDiagoriente } from "../models/cache-diagoriente.model.js"

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
