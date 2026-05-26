"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, Typography } from "@mui/material"
import { Formik, useField, useFormikContext } from "formik"
import type { IJob } from "shared"

type IStep3Form = {
  ft_support: boolean
}

export const FormulaireEditionOffreStep3FtSupport = ({ offre, onSubmit, onCancel }: { offre?: IJob; onSubmit?: (values: IStep3Form) => void; onCancel: () => void }) => {
  return (
    <Formik<IStep3Form>
      validateOnMount
      enableReinitialize={true}
      initialValues={{
        ft_support: (offre as any)?.ft_support ?? false,
      }}
      onSubmit={onSubmit}
    >
      {() => (
        <>
          <Typography
            component="h1"
            sx={(theme) => ({
              fontWeight: 700,
              color: "#000091",
              mb: fr.spacing("6v"),
              [theme.breakpoints.up("xs")]: {
                fontSize: "18px !important",
                lineHeight: "24px !important",
              },
              [theme.breakpoints.up("md")]: {
                fontSize: "20px !important",
                lineHeight: "28px !important",
              },
            })}
          >
            Étape 3/3 : Accompagnement France Travail Pro
          </Typography>
          <FtSupportCheckbox />
          <Buttons offre={offre} onCancel={onCancel} />
        </>
      )}
    </Formik>
  )
}

const FtSupportCheckbox = () => {
  const [input, , helper] = useField<boolean>("ft_support")

  return (
    <Checkbox
      options={[
        {
          label: "Souhaitez-vous être accompagné(e) par France Travail Pro ?",
          nativeInputProps: {
            checked: input.value,
            onChange: (e) => {
              helper.setValue(e.target.checked)
            },
          },
        },
      ]}
    />
  )
}

const Buttons = ({ offre, onCancel }: { offre?: IJob; onCancel: () => void }) => {
  const { isSubmitting, submitForm } = useFormikContext<IStep3Form>()

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v"), mt: fr.spacing("6v") }}
    >
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button className="fr-btn--secondary" onClick={() => onCancel()}>
          Retour
        </Button>
      </Box>
      <Button disabled={isSubmitting} onClick={submitForm} data-testid="creer-offre">
        {offre?._id ? "Continuer et Mettre à jour l'offre" : "Continuer et Créer l'offre"}
      </Button>
    </Box>
  )
}
