import { Box } from "@mui/material"
import type { FormikErrors } from "formik"
import { Formik } from "formik"
// Module léger et non `extensions` (zod-primitives traîne libphonenumber-js dans le bundle client)
import { buildEnum } from "shared/helpers/zod-helpers/zod-primitives-light"
import { zDiplomaParam } from "shared/routes/params"
import { z } from "zod"

import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { zTypesEmploiParam } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

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
  displayedItemTypes: z.array(buildEnum(UserItemTypes)),
  radius: z.string().nullish(),
  diploma: zDiplomaParam.nullish(),
  typesEmploi: zTypesEmploiParam.nullish(),
  elligibleHandicapFilter: z.boolean().nullish(),
})

export type IRechercheForm = z.output<typeof ZRechercheForm>

const validate = (zodSchema: z.ZodObject<any>) => (values: IRechercheForm) => {
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
  const { displayedItemTypes, lieu, metier, diploma, radius, typesEmploi, elligibleHandicapFilter } = rechercheForm
  return {
    displayEntreprises: displayedItemTypes?.includes(UserItemTypes.EMPLOI),
    displayFormations: displayedItemTypes?.includes(UserItemTypes.FORMATIONS),
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
    typesEmploi: typesEmploi ?? [],
    elligibleHandicapFilter,
  }
}

export const rechercheParamsToRechercheForm = (rechercheParams: Partial<IRecherchePageParams>): IRechercheForm => {
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
    diploma: rechercheParams?.diploma || null,
    typesEmploi: rechercheParams?.typesEmploi ?? [],
    elligibleHandicapFilter: rechercheParams.elligibleHandicapFilter,
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
    <Formik<IRechercheForm>
      initialValues={initialValues}
      enableReinitialize
      validate={validate(zodSchema)}
      validateOnBlur={false}
      onSubmit={(values, { setSubmitting }) => {
        // La « soumission » ne fait que déclencher une navigation client (router.push/replace),
        // jamais réinitialisée par Formik ensuite : sur la home, rechercheParams est un littéral
        // statique, donc enableReinitialize ne se redéclenche jamais après le 1er envoi. Sans ce
        // reset, isSubmitting reste bloqué à true — invisible tant que le formulaire était démonté
        // en quittant la page, mais <Activity> le garde monté au retour arrière : le bouton Rechercher
        // reste alors désactivé indéfiniment.
        try {
          props.onSubmit(values)
        } finally {
          setSubmitting(false)
        }
      }}
    >
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
