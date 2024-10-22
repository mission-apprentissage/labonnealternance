import { ObjectId } from "bson"

import { IReferentielOnisep } from "../../models"

export function generateReferentielOnisepFixture(data: Partial<IReferentielOnisep>): IReferentielOnisep {
  return {
    _id: new ObjectId(),
    id_action_ideo2: "AF.56380",
    cle_ministere_educatif: "088281P01313885594860007038855948600070-67118#L01", // see generateEligibleTrainingFixture, linked to the default eligible training
    created_at: new Date(),
    ...data,
  }
}
