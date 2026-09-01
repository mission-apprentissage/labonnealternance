import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ReactNode } from "react"
import CustomInput from "@/app/_components/CustomInput"

/**
 * Bloc de champs de contact partagé par les formulaires de création/édition de compte recruteur
 * (CompteRenderer, InformationCreationCompte, CreationEntrepriseDetailPage, DetailEntreprise) : Nom,
 * Prénom, Téléphone, Email — toujours obligatoires sur ces quatre écrans. Suppose un contexte Formik
 * ambiant (rendu à l'intérieur du render-prop de <Formik>) : les valeurs viennent de useField, pas de
 * props explicites.
 *
 * `hideAsterisk` est systématique ici : ces quatre écrans affichent tous la mention "Tous les champs
 * sont obligatoires" (ci-dessous) à la place de l'astérisque par champ.
 */
export const ContactInfoFields = ({ emailDisabled = false, emailInfo }: { emailDisabled?: boolean; emailInfo?: ReactNode }) => {
  return (
    <>
      <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v") }}>
        Tous les champs sont obligatoires.
      </Typography>
      <CustomInput hideAsterisk name="last_name" label="Nom" type="text" />
      <CustomInput hideAsterisk name="first_name" label="Prénom" type="text" />
      <CustomInput hideAsterisk name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" />
      <CustomInput hideAsterisk isDisabled={emailDisabled} name="email" label="Email" type="email" info={emailInfo} />
    </>
  )
}
