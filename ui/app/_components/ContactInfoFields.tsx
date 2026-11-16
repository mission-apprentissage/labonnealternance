import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { ReactNode } from "react"
import CustomInput from "@/app/_components/CustomInput"
import { EMAIL_FORMAT_HINT, PHONE_FORMAT_HINT } from "@/utils/validation-messages"

const PHONE_FIXE_HINT = "Privilégiez un numéro de téléphone fixe à 10 chiffres, par exemple 0212345678"
const PHONE_VERIFICATION_MENTION = (
  <>
    <b>Nos équipes peuvent être amenées à vous appeler</b> pour vérifier votre identité et la validité des informations renseignées.
  </>
)
const emailDomainMention = (benefit: string) => (
  <>
    Pour accélérer {benefit}, nous vous conseillons d'utiliser une adresse e-mail comportant <b>le nom de domaine de votre établissement</b>.
  </>
)

/**
 * Textes d'aide et mentions par parcours (#5452, #5773) :
 * - `recruteur` / `cfa` : le titulaire du compte saisit ses propres coordonnées (création, Mon compte) ;
 * - `partenaire` : un CFA saisit les coordonnées d'une entreprise partenaire ;
 * - `default` : saisie par un opérateur (admin, OPCO), formats attendus seuls.
 */
const VARIANTS = {
  default: { phoneLabel: "Téléphone", phoneHint: PHONE_FORMAT_HINT, phoneMention: undefined, emailHint: EMAIL_FORMAT_HINT, emailMention: undefined },
  recruteur: {
    phoneLabel: "Numéro de téléphone",
    phoneHint: PHONE_FIXE_HINT,
    phoneMention: PHONE_VERIFICATION_MENTION,
    emailHint: "Privilégiez votre adresse e-mail professionnelle, par exemple marie.dupond@mon-entreprise.fr",
    emailMention: emailDomainMention("la mise en ligne de votre offre"),
  },
  cfa: {
    phoneLabel: "Numéro de téléphone",
    phoneHint: PHONE_FIXE_HINT,
    phoneMention: PHONE_VERIFICATION_MENTION,
    emailHint: "Privilégiez votre adresse e-mail professionnelle, par exemple marie.dupond@mon-entreprise.fr",
    emailMention: emailDomainMention("la validation de votre compte"),
  },
  partenaire: {
    phoneLabel: "Numéro de téléphone",
    phoneHint: PHONE_FIXE_HINT,
    phoneMention: undefined,
    emailHint: "Privilégiez l'adresse e-mail professionnelle, par exemple marie.dupond@mon-entreprise.fr",
    emailMention: (
      <>
        <b>Important</b> : ces informations restent confidentielles et ne sont pas visibles par les candidats. Elles sont uniquement utilisées par nos équipes à des fins de
        contrôle.
      </>
    ),
  },
} satisfies Record<string, { phoneLabel: string; phoneHint: ReactNode; phoneMention: ReactNode; emailHint: ReactNode; emailMention: ReactNode }>

export type ContactInfoFieldsVariant = keyof typeof VARIANTS

/**
 * Nom, Prénom, Téléphone, E-mail : toujours obligatoires. Suppose un contexte Formik ambiant (valeurs lues
 * par useField). `hideAsterisk` est systématique : chaque écran affiche « Tous les champs sont obligatoires »,
 * ici (`showRequiredMention`) ou sous son titre de page.
 *
 * Le téléphone accepte toute écriture d'un numéro français (cf. frenchPhoneValidation) : chaque écran le
 * ramène à 10 chiffres à l'envoi avec toSubmittedPhone.
 *
 * `thirdParty` quand l'opérateur saisit les coordonnées d'un tiers (RGAA 11.13) : autoComplete="off".
 * `emailHint` remplace l'aide du variant ; un e-mail désactivé n'affiche pas de mention.
 */
export const ContactInfoFields = ({
  variant = "default",
  emailDisabled = false,
  emailHint,
  thirdParty = false,
  showRequiredMention = true,
}: {
  variant?: ContactInfoFieldsVariant
  emailDisabled?: boolean
  emailHint?: ReactNode
  thirdParty?: boolean
  showRequiredMention?: boolean
}) => {
  const autoComplete = (token: string) => (thirdParty ? "off" : token)
  const texts = VARIANTS[variant]

  return (
    <>
      {showRequiredMention && <RequiredFieldsMention />}
      {/* autoComplete (RGAA 11.13) et format attendu annoncé avant la saisie (RGAA 11.10) */}
      <CustomInput hideAsterisk name="last_name" label="Nom" type="text" autoComplete={autoComplete("family-name")} />
      <CustomInput hideAsterisk name="first_name" label="Prénom" type="text" autoComplete={autoComplete("given-name")} />
      <CustomInput hideAsterisk name="phone" label={texts.phoneLabel} type="tel" autoComplete={autoComplete("tel-national")} info={texts.phoneHint} mention={texts.phoneMention} />
      <CustomInput
        hideAsterisk
        disabled={emailDisabled}
        name="email"
        label="E-mail"
        type="email"
        autoComplete={autoComplete("email")}
        info={emailHint ?? texts.emailHint}
        mention={emailDisabled ? undefined : texts.emailMention}
      />
    </>
  )
}

const RequiredFieldsMention = () => (
  <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("4v") }}>
    Tous les champs sont obligatoires.
  </Typography>
)
