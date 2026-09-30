import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ReactNode } from "react"
import CustomInput from "@/app/_components/CustomInput"
import { PHONE_FORMAT_HINT } from "@/utils/validation-messages"

/**
 * Bloc de champs de contact partagé par les formulaires de création/édition de compte recruteur
 * (CompteRenderer, InformationCreationCompte, CreationEntrepriseDetailPage, DetailEntreprise) : Nom,
 * Prénom, Téléphone, Email — toujours obligatoires sur ces quatre écrans. Suppose un contexte Formik
 * ambiant (rendu à l'intérieur du render-prop de <Formik>) : les valeurs viennent de useField, pas de
 * props explicites.
 *
 * `hideAsterisk` est systématique ici : ces quatre écrans affichent tous la mention "Tous les champs
 * sont obligatoires" (ci-dessous) à la place de l'astérisque par champ.
 *
 * Le téléphone accepte toute écriture d'un numéro français (cf. frenchPhoneValidation) : chaque écran le
 * ramène à 10 chiffres à l'envoi avec toSubmittedPhone.
 *
 * `thirdParty` : les coordonnées saisies sont celles d'un tiers (ex. CFA qui crée une entreprise partenaire),
 * `autoComplete="off"` empêche le navigateur de proposer celles de l'usager connecté (RGAA 11.13).
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
      <CustomInput hideAsterisk name="phone" label="Téléphone" type="tel" autoComplete={autoComplete("tel-national")} info={PHONE_FORMAT_HINT} />
      <CustomInput
        hideAsterisk
        disabled={emailDisabled}
        name="email"
        label="Email"
        type="email"
        autoComplete={autoComplete("email")}
        info={emailInfo ?? "Par exemple nom@domaine.fr"}
      />
    </>
  )
}
