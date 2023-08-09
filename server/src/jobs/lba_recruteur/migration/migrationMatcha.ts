// @ts-nocheck
import { logger } from "../../../common/logger.js"
import { mongooseInstance } from "../../../db/mongodb.js"
import { runScript } from "../../scriptWrapper.js"
import { createOffreCollection } from "../seed/createOffre.js"

const migrateUserRecruteurCollection = async (db) => {
  logger.info("———— [UserRecruteur] Remove obsolete fields")
  let res

  res = await db.collection("userrecruteurs").updateMany(
    {},
    {
      $unset: {
        isAdmin: "",
        password: "",
      },
    }
  )
  logger.info(`Fin suppression champs de la collection userRecruteur (${res.result.nModified} items mis à jour)`)
  const halo = await db.collection("userrecruteurs").updateMany({}, { $rename: { opco_label: "opco" } })
  logger.info("———— [UserRecruteur] Renaming")
  res = await db.collection("userrecruteurs").updateMany(
    {},
    {
      $rename: {
        nom: "last_name",
        prenom: "first_name",
        opco: "opco",
        raison_sociale: "establishment_raison_sociale",
        enseigne: "establishment_enseigne",
        siret: "establishment_siret",
        adresse_detail: "address_detail",
        adresse: "address",
        geo_coordonnees: "geo_coordinates",
        telephone: "phone",
        email_valide: "is_email_checked",
        id_form: "establishment_id",
        origine: "origin",
        etat_utilisateur: "status",
        qualiopi: "is_qualiopi",
      },
    }
  )

  logger.info(`Fin renommage champs de la collection userRecruteur (${res.result.nModified} items mis à jour)`)

  logger.info("———— [UserRecruteur - Validation State] Renaming")
  db.collection("userrecruteurs").updateMany({ status: { $exists: true } }, [
    {
      $set: {
        status: {
          $map: {
            input: "$status",
            as: "elem",
            in: {
              reason: "$$elem.motif",
              status: "$$elem.statut",
              date: "$$elem.date",
              validation_type: "$$elem.validation_type",
              user: "$$elem.user",
            },
          },
        },
      },
    },
  ])
  logger.info(`Fin renommage champs de la collection userRecruteur, tableau des états utilisateur: status (${res.result.nModified} items mis à jour)`)
}

const migrateFormulaireCollection = async (db) => {
  logger.info("Renaming Formulaire collection to Recruiter")
  await db.dropCollection("recruiters")
  await db.collection("formulaires").rename("recruiters")

  let res

  logger.info("[Recruiter] Renaming")
  res = await db.collection("recruiters").updateMany(
    {},
    {
      $rename: {
        id_form: "establishment_id",
        raison_sociale: "establishment_raison_sociale",
        enseigne: "establishment_enseigne",
        siret: "establishment_siret",
        adresse_detail: "address_detail",
        adresse: "address",
        geo_coordonnees: "geo_coordinates",
        mandataire: "is_delegated",
        gestionnaire: "cfa_delegated_siret",
        nom: "last_name",
        prenom: "first_name",
        telephone: "phone",
        offres: "jobs",
        origine: "origin",
        statut: "status",
        code_naf: "naf_code",
        libelle_naf: "naf_label",
        tranche_effectif: "establishment_size",
        date_creation_etablissement: "establishment_creation_date",
      },
    }
  )
  logger.info(`Fin renommage champs de la collection recruiter (${res.result.nModified} items mis à jour)`)

  logger.info("[formulaire - Validation State] Renaming")
  res = await db.collection("recruiters").updateMany({ jobs: { $exists: true, $not: { $size: 0 } } }, [
    {
      $set: {
        jobs: {
          $map: {
            input: "$jobs",
            as: "elem",
            in: {
              delegations: {
                $map: {
                  input: "$$elem.delegations",
                  as: "sub",
                  in: {
                    siret_code: "$$sub.siret",
                    email: "$$sub.email",
                    cfa_read_company_detail_at: "$$sub.cfa_read_company_detail_at",
                  },
                },
              },
              relance_mail_sent: "$$REMOVE",
              rome_label: "$$elem.libelle",
              rome_appellation_label: "$$elem.rome_appellation_label",
              job_level_label: "$$elem.niveau",
              job_start_date: "$$elem.date_debut_apprentissage",
              job_description: "$$elem.description",
              rome_code: "$$elem.romes",
              job_creation_date: "$$elem.date_creation",
              job_expiration_date: "$$elem.date_expiration",
              job_update_date: "$$elem.date_mise_a_jour",
              job_last_prolongation_date: "$$elem.date_derniere_prolongation",
              job_prolongation_count: "$$elem.nombre_prolongation",
              job_status: "$$elem.statut",
              job_status_comment: "$$elem.raison_statut",
              job_type: "$$elem.type",
              is_multi_published: "$$elem.multi_diffuser",
              is_delegated: "$$elem.delegate",
              job_delegation_count: "$$elem.number_of_delegations",
              is_disabled_elligible: "$$elem.elligible_handicap",
              job_count: "$$elem.quantite",
              job_duration: "$$elem.duree_contrat",
              job_rythm: "$$elem.rythme_alternance",
              custom_address: "$$elem.custom_adress",
              custom_geo_coordinates: "$$elem.custom_gps_coordinates",
              _id: "$$elem._id",
              rome_detail: "$$elem.rome_detail",
            },
          },
        },
      },
    },
  ])
  logger.info(`Fin renommage champs de la collection recruiter, tableau des jobs (${res.result.nModified} items mis à jour)`)
}

const migrationMatcha = async () => {
  logger.info(`#migrationMatcha start.`)
  const db = mongooseInstance.connection

  await migrateUserRecruteurCollection(db)
  await migrateFormulaireCollection(db)
  await createOffreCollection()

  logger.info(`#migrationMatcha end.`)
}

runScript(async () => await migrationMatcha())
