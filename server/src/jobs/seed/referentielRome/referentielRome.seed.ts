import { readFileSync } from "fs"

import iconv from "iconv-lite"
import { isArray, isNull, isObject } from "lodash-es"
import * as xml2j from "xml2js"

import __dirname from "../../../common/dirname"
import { ReferentielRome } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { runScript } from "../../scriptWrapper"

const formatRawData = ({ appellations, competences, contextes_travail, mobilites, ...data }) => {
  return {
    ...data,
    appellations: isNull(appellations) ? null : isArray(appellations.appellation) ? appellations.appellation.map((x) => x) : appellations.appellation,
    competences: {
      savoir_faire: isNull(competences.savoir_faire.enjeux)
        ? null
        : isArray(competences.savoir_faire.enjeux.enjeu)
        ? competences.savoir_faire.enjeux.enjeu.map((x) => x)
        : competences.savoir_faire.enjeux.enjeu,
      savoir_etre_professionnel: isNull(competences.savoir_etre_professionnel.enjeux)
        ? null
        : isObject(competences.savoir_etre_professionnel.enjeux.enjeu)
        ? isArray(competences.savoir_etre_professionnel.enjeux.enjeu.items.item)
          ? competences.savoir_etre_professionnel?.enjeux?.enjeu?.items?.item?.map((x) => x)
          : competences.savoir_etre_professionnel.enjeux.enjeu
        : null,
      savoirs: isNull(competences.savoirs.categories)
        ? null
        : isArray(competences.savoirs.categories.categorie)
        ? competences.savoirs.categories && competences.savoirs.categories.categorie.map((x) => x)
        : competences.savoirs.categories.categorie,
    },
    contextes_travail: isNull(contextes_travail)
      ? null
      : isArray(contextes_travail.type_contexte)
      ? contextes_travail.type_contexte.map((x) => x)
      : contextes_travail.type_contexte,
    mobilites: {
      proche: mobilites.proche && mobilites.proche.mobilite,
      si_evolution: isNull(mobilites.si_evolution)
        ? null
        : isArray(mobilites.si_evolution?.mobilite)
        ? mobilites.si_evolution.mobilite.map((x) => x)
        : mobilites.si_evolution.mobilite,
    },
  }
}

runScript(async () => {
  const parser = new xml2j.Parser({ explicitArray: false, emptyTag: null })

  const filePath = `${__dirname(import.meta.url)}/unix_fiche_emploi_metier_v450_iso8859-15.xml`

  const xmlBuffer = readFileSync(filePath)
  const xml = iconv.decode(xmlBuffer, "iso8859-15")

  const data = await parser.parseStringPromise(xml)

  await ReferentielRome.deleteMany({})

  await asyncForEach(data.fiches_metier.fiche_metier, async (ficheMetier: any) => {
    const fiche = formatRawData(ficheMetier)
    await ReferentielRome.create(fiche)
  })
})
