import { readFileSync } from "fs"

import iconv from "iconv-lite"
import * as xml2j from "xml2js"

import { logger } from "@/common/logger.js"

import __dirname from "../../../common/dirname.js"
import { ReferentielRome } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"

const getGenericItem = (genericItem: { libelle: string; items: { item: any | any[] } }) => {
  const tempsItems = !(genericItem.items.item instanceof Array) ? [genericItem.items.item] : genericItem.items.item
  return tempsItems.map((x) => x)
}

const getContextesTravail = (contextesTravail) => {
  /*
  {
  type_contexte: [
    {
      libelle: 'Conditions de travail et risques professionnels',
      items: [Object]
    },
    { libelle: 'Horaires et durée du travail', items: [Object] },
    { libelle: 'Types de structures', items: [Object] }
  ]
}
  */

  if (!contextesTravail?.type_contexte) {
    return null
  }

  const tempContextes = contextesTravail.type_contexte instanceof Array ? contextesTravail.type_contexte : [contextesTravail.type_contexte]

  const tempContextesWithItems = tempContextes.map((contexte) => {
    const items = getGenericItem(contexte)
    return {
      libelle: contexte.libelle,
      items,
    }
  })

  return tempContextesWithItems
}

const getSavoirs = (savoirs) => {
  if (!(savoirs instanceof Array)) {
    return [{ libelle: savoirs.libelle, items: getGenericItem(savoirs) }]
  }

  const listeSavoirs = savoirs.map((savoir) => {
    const items = getGenericItem(savoir)
    return {
      libelle: savoir.libelle,
      items,
    }
  })
  return listeSavoirs
}

const getSavoirEtre = (savoirEtre) => {
  if (!savoirEtre?.enjeux) {
    return null
  }

  return getGenericItem(savoirEtre.enjeux.enjeu)
}

const getCompetences = (competences) => {
  return {
    savoir_faire: getSavoirs(competences.savoir_faire.enjeux.enjeu),
    savoir_etre_professionnel: getSavoirEtre(competences.savoir_etre_professionnel),
    savoirs: getSavoirs(competences.savoirs.categories.categorie),
  }
}

const formatRawData = ({
  appellations,
  competences,
  contextes_travail,
  mobilites,
  numero,
  rome,
  definition,
  acces_metier,
}: {
  numero: string
  rome: string
  definition: string
  acces_metier: string
  appellations?: any
  competences?: any
  contextes_travail?: any
  mobilites?: any
}) => {
  return {
    numero,
    rome,
    definition,
    acces_metier,
    appellations: appellations.appellation instanceof Array ? appellations.appellation.map((x) => x) : [appellations.appellation],
    mobilites: mobilites && mobilites?.mobilite ? (mobilites.mobilite instanceof Array ? mobilites.mobilite.map((x) => x) : [mobilites.mobilite]) : null,
    contextes_travail: getContextesTravail(contextes_travail),
    competences: getCompetences(competences),
  }
}

export const importReferentielRome = async () => {
  logger.info("Ouverture fichier XML du référentiel")
  const parser = new xml2j.Parser({ explicitArray: false, emptyTag: null })

  const filePath = `${__dirname(import.meta.url)}/assets/unix_fiche_emploi_metier_v455_iso8859-15.xml`

  const xmlBuffer = readFileSync(filePath)
  const xml = iconv.decode(xmlBuffer, "iso8859-15")

  logger.info("Parsing du fichier")

  const data = await parser.parseStringPromise(xml)

  logger.info(`Fichier parsé. ${data.fiches_metier.fiche_metier.length} ROMEs trouvés`)

  if (data.fiches_metier.fiche_metier.length > 500) {
    logger.info("Suppression du référentiel courant")
    await ReferentielRome.deleteMany({})

    await asyncForEach(data.fiches_metier.fiche_metier, async (ficheMetier: any) => {
      const fiche = formatRawData(ficheMetier)
      await ReferentielRome.create(fiche)
    })
  } else {
    logger.info("Liste des ROMEs anormalement petite. Processus interrompu.")
  }
}
