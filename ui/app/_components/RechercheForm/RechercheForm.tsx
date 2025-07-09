"use client"

import { Box } from "@mui/material"
import { Formik, FormikErrors } from "formik"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { z } from "zod"

import { IRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export enum UserItemTypes {
  EMPLOI = "Emplois",
  FORMATIONS = "Formations",
}

const ZRechercheForm = z.object({
  metier: z.object({
    type: z.string(),
    label: z.string(),
    romes: z.array(z.string()),
  }),
  lieu: z
    .object({
      label: z.string(),
      longitude: z.number(),
      latitude: z.number(),
    })
    .nullish(),
  displayedItemTypes: z.array(extensions.buildEnum(UserItemTypes)),
})

export type IRechercheForm = z.output<typeof ZRechercheForm>

function validate(values: IRechercheForm) {
  const errors: FormikErrors<IRechercheForm> = {}
  const result = ZRechercheForm.safeParse(values)
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      if (issue.path.length > 0) {
        const key = issue.path[0] as keyof IRechercheForm
        errors[key] = issue.message
      }
    })
  }
  return errors
}

export const rechercheFormToRechercheParams = (rechercheForm: IRechercheForm): Partial<IRecherchePageParams> => {
  const { displayedItemTypes, lieu, metier } = rechercheForm
  return {
    displayEntreprises: displayedItemTypes.includes(UserItemTypes.EMPLOI),
    displayFormations: displayedItemTypes.includes(UserItemTypes.FORMATIONS),
    displayPartenariats: displayedItemTypes.includes(UserItemTypes.EMPLOI),
    romes: metier.romes ?? [],
    geo: lieu
      ? {
          address: lieu.label,
          latitude: lieu.latitude,
          longitude: lieu.longitude,
        }
      : undefined,
    job_name: metier?.label,
    job_type: metier?.type,
  }
}

const rechercheParamsToRechercheForm = (rechercheParams: Partial<IRecherchePageParams>): IRechercheForm => {
  const displayedItemTypes: UserItemTypes[] = []
  if (rechercheParams.displayEntreprises) {
    displayedItemTypes.push(UserItemTypes.EMPLOI)
  }
  if (rechercheParams.displayFormations) {
    displayedItemTypes.push(UserItemTypes.FORMATIONS)
  }
  const rechercheForm: IRechercheForm = {
    metier: rechercheParams?.romes
      ? {
          label: rechercheParams.job_name ?? "",
          romes: rechercheParams.romes,
          type: rechercheParams.job_type ?? "job",
        }
      : null,
    lieu: rechercheParams?.geo
      ? {
          label: rechercheParams.geo.address ?? "",
          latitude: rechercheParams.geo.latitude,
          longitude: rechercheParams.geo.longitude,
        }
      : null,
    displayedItemTypes,
  }
  return rechercheForm
}

export function RechercheForm(props: { children: React.ReactNode; rechercheParams: Partial<IRecherchePageParams>; onSubmit: (formValues: IRechercheForm) => void }) {
  const { children, rechercheParams } = props
  const initialValues: IRechercheForm = rechercheParamsToRechercheForm(rechercheParams)

  return (
    <Formik<IRechercheForm> initialValues={initialValues} enableReinitialize validate={validate} validateOnBlur={false} onSubmit={props.onSubmit}>
      {(formik) => (
        <Box component={"form"} onSubmit={formik.handleSubmit}>
          {children}
        </Box>
      )}
    </Formik>
  )
}
