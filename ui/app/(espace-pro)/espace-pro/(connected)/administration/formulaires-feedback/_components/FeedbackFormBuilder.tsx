"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import type { FormikErrors } from "formik"
import { FormikProvider, getIn, prepareDataForValidation, setIn, useFormik } from "formik"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { ZFeedbackFormInput } from "shared/models/feedback-form.model"
import { toSnakeCaseSlug } from "shared/utils/string-utils"

import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { useToast } from "@/app/hooks/useToast"
import { ApiError, apiPost, apiPut } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import type { IFeedbackFormDraft } from "../_utils/questionDrafts"
import { toFeedbackFormDraft, toFeedbackFormInput } from "../_utils/questionDrafts"
import { QuestionsField } from "./QuestionsField"
import { TriggerScopeField } from "./TriggerScopeField"

const createEmptyForm = (): IFeedbackFormDraft =>
  toFeedbackFormDraft({
    slug: "",
    title: "",
    trigger: { minInteractions: 1, scope: [] },
    questions: [],
  })

/**
 * Les valeurs Formik sont des brouillons de questions (tous types confondus), pas le corps de
 * requête : on valide donc ce qui sera réellement envoyé, puis on reporte chaque erreur sur le
 * champ du brouillon correspondant.
 */
const validate = (values: IFeedbackFormDraft): FormikErrors<IFeedbackFormDraft> => {
  const { input, draftIndexes } = toFeedbackFormInput(values)
  // même traitement que `validationSchema` : "" devient undefined, pour que les champs vides
  // reçoivent le message « obligatoire » plutôt qu'une erreur de longueur
  const result = ZFeedbackFormInput.safeParse(prepareDataForValidation(input))
  if (result.success) return {}

  let errors: FormikErrors<IFeedbackFormDraft> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.map(String)
    if (path[0] === "questions" && path[1] !== undefined) {
      path[1] = String(draftIndexes[Number(path[1])])
    }
    const key = path.join(".")
    if (key && getIn(errors, key) === undefined) {
      errors = setIn(errors, key, issue.message)
    }
  }
  return errors
}

/**
 * `initialValues` pré-remplit le formulaire : en modification, c'est le formulaire enregistré ; en
 * création, c'est une copie à enregistrer comme nouveau brouillon (duplication). Il doit être
 * mémoïsé par l'appelant, l'effet de réinitialisation en dépend.
 */
export function FeedbackFormBuilder({ mode, initialValues }: { mode: "create" | "edit"; initialValues?: IFeedbackFormInput }) {
  const isEdit = mode === "edit"
  const router = useRouter()
  const toast = useToast()
  // tant que le slug n'a pas été édité à la main, il suit le titre
  const [slugTouched, setSlugTouched] = useState(isEdit)

  const formik = useFormik<IFeedbackFormDraft>({
    initialValues: initialValues ? toFeedbackFormDraft(initialValues) : createEmptyForm(),
    validate,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const { input } = toFeedbackFormInput(values)
      try {
        if (isEdit) {
          const { slug, ...body } = input
          await apiPut("/admin/feedback-forms/:slug", { params: { slug }, body })
          toast({ title: "Formulaire enregistré" })
        } else {
          await apiPost("/admin/feedback-forms", { body: input })
          toast({ title: "Brouillon enregistré" })
        }
        router.push(PAGES.static.backAdminFeedbackForms.getPath())
      } catch (error) {
        const message = error instanceof ApiError && error.context?.statusCode >= 400 ? error.context.message : "Une erreur est survenue, merci de réessayer plus tard"
        toast({ title: message, variant: "error" })
      }
    },
  })

  const { values, isSubmitting, setFieldValue, resetForm } = formik
  const formRef = useRef<HTMLFormElement>(null)

  // Next garde le segment précédent monté : revenir sur la page de création par « Créer un
  // formulaire » réutilise le même arbre React, donc la saisie abandonnée réapparaîtrait. Cet
  // effet se rejoue quand le segment redevient actif et rend bien un formulaire vierge.
  useEffect(() => {
    if (!isEdit) {
      resetForm({ values: initialValues ? toFeedbackFormDraft(initialValues) : createEmptyForm() })
      setSlugTouched(false)
    }
  }, [isEdit, resetForm, initialValues])

  return (
    <FormikProvider value={formik}>
      {/* noValidate : la validation Zod porte les messages en français, celle du navigateur les doublerait */}
      <form ref={formRef} onSubmit={createSubmitWithFocusOnError(formRef, formik)} noValidate>
        <Typography component="h2" className={fr.cx("fr-text--md", "fr-text--bold")} sx={{ color: fr.colors.decisions.text.title.blueFrance.default, mb: fr.spacing("3v") }}>
          1 · Informations générales
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: fr.spacing("4v") }}>
          <CustomInput
            name="title"
            label="Titre"
            info="Visible uniquement dans le back-office"
            type="text"
            value={values.title}
            onChange={(event) => {
              const title = event.target.value
              setFieldValue("title", title)
              if (!slugTouched) {
                setFieldValue("slug", toSnakeCaseSlug(title))
              }
            }}
          />
          <CustomInput
            name="slug"
            label="Slug"
            info="Généré depuis le titre, modifiable, unique"
            type="text"
            value={values.slug}
            disabled={isEdit}
            onChange={(event) => {
              setSlugTouched(true)
              setFieldValue("slug", event.target.value)
            }}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, columnGap: fr.spacing("4v"), alignItems: "start" }}>
          <TriggerScopeField />
          <CustomInput
            name="trigger.minInteractions"
            label="Interactions avant affichage"
            info="Jamais 0 : pas d'affichage au chargement"
            type="number"
            inputProps={{ min: 1 }}
            value={values.trigger.minInteractions}
            onChange={(event) => {
              const raw = event.target.value
              setFieldValue("trigger.minInteractions", raw === "" ? "" : Number(raw))
            }}
          />
        </Box>

        <QuestionsField />

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: fr.spacing("2v"),
            mt: fr.spacing("4v"),
            pt: fr.spacing("4v"),
            borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <Typography className={fr.cx("fr-text--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: 0 }}>
            {isEdit ? "Les modifications d'un brouillon sont enregistrées en place." : "Le formulaire sera enregistré en brouillon. Vous pourrez l'activer depuis la liste."}
          </Typography>
          <Box sx={{ display: "flex", gap: fr.spacing("2v") }}>
            <Button priority="secondary" linkProps={{ href: PAGES.static.backAdminFeedbackForms.getPath() }}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Enregistrer les modifications" : "Enregistrer le brouillon"}
            </Button>
          </Box>
        </Box>
      </form>
    </FormikProvider>
  )
}
