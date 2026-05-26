"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, Typography } from "@mui/material"
import { Formik, useField, useFormikContext } from "formik"
import Image from "next/image"
import type { IJob } from "shared"

type IStep3Form = {
  ft_support: boolean
}

const blueBoxStyle = {
  padding: fr.spacing("4v"),
  backgroundColor: "#F5F5FE",
  display: "flex",
  alignItems: "center",
  textAlign: { xs: "left", md: "center" },
  flexDirection: { xs: "row", md: "column" },
}
const blueBoxTextStyle = {
  mt: { xs: 0, md: fr.spacing("2v") },
  ml: { xs: fr.spacing("2v"), md: 0 },
  fontSize: "14px",
  lineHeight: "24px",
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
            sx={{
              fontWeight: 700,
              color: "#000091",
              mb: fr.spacing("6v"),
              fontSize: { xs: "18px !important", md: "20px !important" },
              lineHeight: { xs: "24px !important", md: "28px !important" },
            }}
          >
            Étape 3/3 : Accompagnement France Travail
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              mb: fr.spacing("6v"),
              fontSize: { xs: "22px !important", md: "32px !important" },
              lineHeight: { xs: "28px !important", md: "40px !important" },
            }}
          >
            Accompagnement France Travail Pro (Facultatif)
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: fr.spacing("11v"),
            }}
          >
            <Box sx={{ flex: 1 }}>
              <FtSupportCheckbox />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize="20px" lineHeight="32px" mb={fr.spacing("5v")}>
                Pour faciliter vos recrutements en alternance, le conseiller pro France Travail peut vous aider à :
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: fr.spacing("2v") }}>
                <Box sx={blueBoxStyle}>
                  <Image src="/images/espace_pro/xp_france_travail/profil.svg" aria-hidden="true" alt="" width={56} height={56} />
                  <Typography sx={blueBoxTextStyle}>Définir le profil à recruter</Typography>
                </Box>
                <Box sx={blueBoxStyle}>
                  <Image src="/images/espace_pro/xp_france_travail/selection.svg" aria-hidden="true" alt="" width={56} height={56} />
                  <Typography sx={blueBoxTextStyle}>Faire une première sélection de candidats</Typography>
                </Box>
                <Box sx={blueBoxStyle}>
                  <Image src="/images/espace_pro/xp_france_travail/handicap.svg" aria-hidden="true" alt="" width={56} height={56} />
                  <Typography sx={blueBoxTextStyle}>Recruter un profil en situation de handicap</Typography>
                </Box>
                <Box sx={blueBoxStyle}>
                  <Image src="/images/espace_pro/xp_france_travail/entretien.svg" aria-hidden="true" alt="" width={56} height={56} />
                  <Typography sx={blueBoxTextStyle}>Préparer une trame d’entretien de recrutement</Typography>
                </Box>
                <Box sx={blueBoxStyle}>
                  <Image src="/images/espace_pro/xp_france_travail/page.svg" aria-hidden="true" alt="" width={56} height={56} />
                  <Typography sx={blueBoxTextStyle}>Rendre attractive votre page employeur sur francetravail.fr</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
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
          label: (
            <>
              Oui, je souhaite être accompagné(e) pour recruter sur cette offre
              <Typography fontSize="12px" lineHeight="20px" color="#666" mt={fr.spacing("1v")}>
                Votre offre et vos coordonnées seront transmises au conseiller France Travail qui vous recontactera dans les jours à venir.
              </Typography>
            </>
          ),
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
