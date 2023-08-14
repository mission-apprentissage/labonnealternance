// @ts-nocheck
import fs from "fs"
import { runScript } from "../scriptWrapper.js"
import { Appointment } from "../../common/model/index.js"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import { URL } from "url"

const lbaDomain = "https://labonnealternance.apprentissage.beta.gouv.fr"
const utmData = "&utm_source=lba&utm_medium=email&utm_campaign=promotion-emploi-jeunes-rdva-ps"

const aggregateQuery = [
  {
    $match: {
      appointment_origin: "PARCOURSUP",
      created_at: {
        $gt: new Date("Tue, 17 Jan 2023 00:00:00 GMT"),
      },
    },
  },
  {
    $sort: {
      applicant_id: 1,
      created_at: -1,
    },
  },
  {
    $group: {
      _id: "$applicant_id",
      created_at: {
        $first: "$created_at",
      },
      cfa_formateur_siret: {
        $first: "$cfa_formateur_siret",
      },
      applicant_id: {
        $first: "$applicant_id",
      },
      cle_ministere_educatif: {
        $first: "$cle_ministere_educatif",
      },
    },
  },
  {
    $lookup: {
      from: "users",
      let: {
        applicantId: {
          $toObjectId: "$applicant_id",
        },
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$_id", "$$applicantId"],
            },
          },
        },
      ],
      as: "candidat",
    },
  },
  {
    $unwind: {
      path: "$candidat",
    },
  },
  {
    $lookup: {
      from: "etablissements",
      localField: "cfa_formateur_siret",
      foreignField: "formateur_siret",
      as: "etablissement",
    },
  },
  {
    $unwind: {
      path: "$etablissement",
    },
  },
  {
    $lookup: {
      from: "formationcatalogues",
      localField: "cle_ministere_educatif",
      foreignField: "cle_ministere_educatif",
      as: "formationcatalogues",
    },
  },
  {
    $unwind: {
      path: "$formationcatalogues",
    },
  },
  {
    $project: {
      prenom: "$candidat.firstname",
      nom: "$candidat.lastname",
      email: "$candidat.email",
      etablissement: "$etablissement.raison_sociale",
      ville: "$etablissement.formateur_city",
      clef_me: "$cle_ministere_educatif",
      lieu_formation_geo_coordonnees: "$formationcatalogues.lieu_formation_geo_coordonnees",
      rome_codes: "$formationcatalogues.rome_codes",
    },
  },
]

const filePath = "voeux_parcoursup_lien_lbac.csv"

function formatCsvLine(obj) {
  return Object.values(obj).join("\t")
}

const buildLien = (voeu) => {
  const latLon = voeu.lieu_formation_geo_coordonnees.split(",")
  return new URL(`${lbaDomain}/recherche-emploi?&romes=${voeu.rome_codes}&lat=${latLon[0]}&lon=${latLon[1]}&radius=60${utmData}`).toString()
}

const header = "lien\tapplicant_id\tprenom\tnom\temail\tvoeu_etablissement_raison_sociale\tvoeu_etablissement_ville\tclef_ministere_educatif\tlatlon\tcodes_romes\n"

/**
 * Construit un fichier csv contenant une proposition de recherche pour chaque candidat ayant pris au moins un RDV depuis PARCOURSUP
 */
runScript(async () => {
  const voeux = await Appointment.aggregate(aggregateQuery)

  const voeuxAvecLiens = []
  await asyncForEach(voeux, async (voeu) => {
    await voeuxAvecLiens.push(formatCsvLine({ lien: buildLien(voeu), ...voeu }))
  })

  const csvContent = header + voeuxAvecLiens.join("\n")

  fs.writeFile(filePath, csvContent, (err) => {
    if (err) {
      console.error("Une erreur est survenue lors de l'écriture du fichier :", err)
    } else {
      console.info("Le fichier a été écrit avec succès.")
    }
  })
})
