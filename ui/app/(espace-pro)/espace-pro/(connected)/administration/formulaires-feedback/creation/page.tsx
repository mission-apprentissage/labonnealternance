import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { Metadata } from "next"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormGeneralInfoForm } from "../_components/FeedbackFormGeneralInfoForm"

export const metadata: Metadata = {
  title: METADATA.static.backAdminFeedbackFormCreation().title,
}

export default async function AdministrationCreationFormulaireFeedback() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.static.backAdminFeedbackFormCreation]} />
      <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("4v") }}>
        Créer un formulaire de feedback
      </Typography>
      <FeedbackFormGeneralInfoForm />
    </>
  )
}
