import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ReactNode } from "react"
import CustomInput from "@/app/_components/CustomInput"
import { EMAIL_FORMAT_HINT, PHONE_FORMAT_HINT } from "@/utils/validation-messages"

/**
 * Bloc de champs de contact partagé par les formulaires de création/édition de compte recruteur
 * (CompteRenderer, InformationCreationCompte, CreationEntrepriseDetailPage, DetailEntreprise) : Nom,
 * Prénom, Téléphone, E-mail — toujours obligatoires sur ces quatre écrans. Suppose un contexte Formik
 * ambiant (rendu à l'intérieur du render-prop de <Formik>) : les valeurs viennent de useField, pas de
 * props explicites.
 *
 * `hideAsterisk` est systématique ici : ces quatre écrans affichent tous la mention "Tous les champs
 * sont obligatoires" (ci-dessous) à la place de l'astérisque par champ.
 *
 * `thirdParty` quand l'opérateur saisit les coordonnées d'un tiers (RGAA 11.13) : autoComplete="off"
 * pour que le navigateur ne propose pas les siennes.
 */
export const ContactInfoFields = ({ emailDisabled = false, emailInfo, thirdParty = false }: { emailDisabled?: boolean; emailInfo?: ReactNode; thirdParty?: boolean }) => {
  const autoComplete = (token: string) => (thirdParty ? "off" : token)

  return (
    <>
      <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v") }}>
        Tous les champs sont obligatoires.
      </Typography>
      {/* autoComplete (RGAA 11.13) et format attendu annoncé avant la saisie (RGAA 11.10) */}
      <CustomInput hideAsterisk name="last_name" label="Nom" type="text" autoComplete={autoComplete("family-name")} />
      <CustomInput hideAsterisk name="first_name" label="Prénom" type="text" autoComplete={autoComplete("given-name")} />
      <CustomInput
        hideAsterisk
        name="phone"
        label="Téléphone"
        type="tel"
        inputMode="numeric"
        pattern="[0-9]{10}"
        maxLength="10"
        autoComplete={autoComplete("tel-national")}
        info={PHONE_FORMAT_HINT}
      />
      <CustomInput hideAsterisk disabled={emailDisabled} name="email" label="E-mail" type="email" autoComplete={autoComplete("email")} info={emailInfo ?? EMAIL_FORMAT_HINT} />
    </>
  )
}
