import { readFileSync } from "fs"

import iconv from "iconv-lite"
import * as xml2j from "xml2js"

import { logger } from "@/common/logger.js"

import __dirname from "../../../common/dirname.js"
import { ReferentielRome } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"

const formatRawData = ({ appellations, competences, contextes_travail, mobilites, numero, rome, definition, acces_metier }) => {
  console.log("Appellations", appellations)

  return {
    numero,
    rome,
    definition,
    acces_metier,
    appellations: appellations ? (appellations.appellation instanceof Array ? appellations.appellation.map((x) => x) : appellations.appellation) : null,
    competences: {
      savoir_faire: competences?.savoir_faire?.enjeux
        ? competences.savoir_faire.enjeux.enjeu instanceof Array
          ? competences.savoir_faire.enjeux.enjeu.map((x) => x).type_contexte
          : competences.savoir_faire.enjeux.enjeu
        : null,
      savoir_etre_professionnel: competences?.savoir_etre_professionnel?.enjeux
        ? competences.savoir_etre_professionnel.enjeux?.enjeu?.items?.item instanceof Array
          ? competences.savoir_etre_professionnel.enjeux.enjeu.items.item.map((x) => x)
          : competences.savoir_etre_professionnel.enjeux.enjeu
        : null,
      savoirs: competences?.savoirs?.categories
        ? competences.savoirs.categories?.categorie instanceof Array
          ? competences.savoirs.categories.categorie.map((x) => x)
          : competences.savoirs.categories.categorie
        : null,
    },
    contextes_travail: contextes_travail?.type_contexte
      ? contextes_travail.type_contexte instanceof Array
        ? contextes_travail.type_contexte.map((x) => x)
        : contextes_travail.type_contexte
      : null,
    mobilites: {
      proche: mobilites?.proche && mobilites?.proche?.mobilite,
      si_evolution: mobilites?.si_evolution
        ? mobilites.si_evolution?.mobilite instanceof Array
          ? mobilites.si_evolution.mobilite.map((x) => x)
          : mobilites.si_evolution.mobilite
        : null,
    },
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

    await asyncForEach(data.fiches_metier.fiche_metier, async (ficheMetier) => {
      const fiche = formatRawData(ficheMetier)
      await ReferentielRome.create(fiche)
    })
  } else {
    logger.info("Liste des ROMEs anormalement petite. Processus interrompu.")
  }
}
