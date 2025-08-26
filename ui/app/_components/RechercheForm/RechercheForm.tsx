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
  radius: z.string().nullish(),
  diploma: z.string().nullish(),
})

export type IRechercheForm = z.output<typeof ZRechercheForm>

const validate = (zodSchema: z.AnyZodObject) => (values: IRechercheForm) => {
  const errors: FormikErrors<IRechercheForm> = {}
  const result = zodSchema.safeParse(values)
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

export const rechercheFormToRechercheParams = (rechercheForm: Partial<IRechercheForm>): Partial<IRecherchePageParams> => {
  const { displayedItemTypes, lieu, metier, diploma, radius } = rechercheForm
  return {
    displayEntreprises: displayedItemTypes?.includes(UserItemTypes.EMPLOI),
    displayFormations: displayedItemTypes?.includes(UserItemTypes.FORMATIONS),
    displayPartenariats: displayedItemTypes?.includes(UserItemTypes.EMPLOI),
    romes: metier?.romes ?? [],
    geo: lieu
      ? {
          address: lieu.label,
          latitude: lieu.latitude,
          longitude: lieu.longitude,
        }
      : undefined,
    radius: radius ? parseInt(radius, 10) : undefined,
    job_name: metier?.label,
    job_type: metier?.type,
    diploma,
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
    metier: rechercheParams?.romes?.length
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
    radius: rechercheParams?.radius?.toString() ?? "",
    diploma: rechercheParams?.diploma || "",
  }
  return rechercheForm
}

export function RechercheForm(props: {
  children: React.ReactNode
  rechercheParams: Partial<IRecherchePageParams>
  onSubmit: (formValues: IRechercheForm) => void
  itemTypeRequired?: boolean
}) {
  const { children, rechercheParams, itemTypeRequired = false } = props
  const zodSchema = itemTypeRequired
    ? ZRechercheForm.omit({ displayedItemTypes: true }).extend({
        displayedItemTypes: ZRechercheForm.shape.displayedItemTypes.min(1, "Veuillez sélectionner une catégorie"),
      })
    : ZRechercheForm
  const initialValues: IRechercheForm = rechercheParamsToRechercheForm(rechercheParams)

  return (
    <Formik<IRechercheForm> initialValues={initialValues} enableReinitialize validate={validate(zodSchema)} validateOnBlur={false} onSubmit={props.onSubmit}>
      {(formik) => {
        return (
          <Box component={"form"} onSubmit={formik.handleSubmit}>
            {children}
          </Box>
        )
      }}
    </Formik>
  )
}
