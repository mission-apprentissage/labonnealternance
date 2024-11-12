import { ObjectId } from "mongodb"

import { ICacheRomeo } from "../models/cacheRomeo.model"

export const cacheRomeFixture = (props: Partial<ICacheRomeo> = {}): ICacheRomeo => {
  return {
    _id: new ObjectId(),
    contexte: "1105Z",
    intitule: "Assistant / Assistante documentaliste H/F",
    metiersRome: [cacheRomeResultFixture()],
    ...props,
  }
}

export const cacheRomeResultFixture = (props: Partial<ICacheRomeo["metiersRome"][number]> = {}): ICacheRomeo["metiersRome"][number] => {
  return {
    codeRome: "K1601",
    libelleRome: "Gestion de l'information et de la documentation",
    codeAppellation: "K1601.101",
    libelleAppellation: "Assistant / Assistante documentaliste",
    scorePrediction: 0.8,
    ...props,
  }
}
