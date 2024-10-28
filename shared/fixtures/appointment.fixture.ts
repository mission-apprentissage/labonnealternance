import { ObjectId } from "bson"

import { referrers } from "../constants/referers"
import { IEligibleTrainingsForAppointment, IEtablissement } from "../models"

export function generateEligibleTrainingFixture(data: Partial<IEligibleTrainingsForAppointment>): IEligibleTrainingsForAppointment {
  return {
    _id: new ObjectId(),
    training_id_catalogue: "67086eb49c8e4b8d5154f821",
    training_intitule_long: "ASSISTANCE TECHNIQUE D'INGENIEUR (BTS)",
    etablissement_formateur_zip_code: "93290",
    training_code_formation_diplome: "32025001",
    lieu_formation_email: "email-formation-eligible-training@mail.fr",
    is_lieu_formation_email_customized: null,
    referrers: Object.keys(referrers), // all referrers by default for ease purpose
    rco_formation_id: "14_AF_0000013390|14_SE_0000805767##14_SE_0000974476|18817",
    is_catalogue_published: true,
    parcoursup_id: "10013",
    cle_ministere_educatif: "088281P01313885594860007038855948600070-67118#L01",
    etablissement_formateur_raison_sociale: "AFORP FORMATION",
    etablissement_formateur_street: "64 AVENUE DE LA PLAINE DE FRANCE",
    departement_etablissement_formateur: "Seine-Saint-Denis",
    etablissement_formateur_city: "TREMBLAY-EN-FRANCE",
    lieu_formation_street: "64 Avenue de la Plaine de France",
    lieu_formation_city: "Tremblay-en-France",
    lieu_formation_zip_code: "93290",
    etablissement_formateur_siret: "77572845400205", // linked to the default establishment
    etablissement_gestionnaire_siret: "77572845400205",
    last_catalogue_sync_date: new Date("2021-01-28T15:00:00.000Z"),
    created_at: new Date("2021-01-28T15:00:00.000Z"),
    affelnet_visible: true, // normally, training cannot be affelnet_visible and parcoursup_visible true.
    parcoursup_visible: true,
    ...data,
  }
}

export function generateEligibleTrainingEstablishmentFixture(data: Partial<IEtablissement>): IEtablissement {
  return {
    _id: new ObjectId(),
    raison_sociale: "AFORP FORMATION",
    formateur_address: "64 AVENUE DE LA PLAINE DE FRANCE",
    formateur_city: "TREMBLAY-EN-FRANCE",
    formateur_siret: "77572845400205", // linked to the default eligible training
    formateur_zip_code: "93290",
    gestionnaire_email: "email-etablissement@mail.fr",
    gestionnaire_siret: "77572845400205",
    last_catalogue_sync_date: new Date("2024-10-11T00:52:36.447Z"),
    optout_activation_date: new Date("2022-01-20T14:10:00.816Z"),
    optout_activation_scheduled_date: new Date("2022-01-20T14:07:06.000Z"),
    optout_invitation_date: new Date("2022-01-05T14:07:06.798Z"),
    premium_invitation_date: new Date("2022-03-23T19:04:01.731Z"),
    premium_affelnet_invitation_date: new Date("2023-04-26T08:04:34.020Z"),
    premium_affelnet_activation_date: new Date("2023-05-10T08:25:52.895Z"),
    premium_refusal_date: null,
    premium_affelnet_refusal_date: null,
    premium_follow_up_date: new Date("2024-02-29T08:37:38.383Z"),
    ...data,
  }
}
