import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"

import { FormSection } from "@/app/_components/FormSection"
import { HandiEngagementSelect } from "@/app/(espace-pro)/_components/HandiEngagementSelect"

export const HandiEngagementSection = ({
  title,
  name,
  value,
  onChange,
  disabled,
}: {
  title: string
  name: string
  value: HandiEngagement | ""
  onChange: (value: HandiEngagement) => void
  disabled: boolean
}) => (
  <FormSection title={title}>
    <Typography sx={{ mb: fr.spacing("4v") }}>
      La bonne alternance mène des actions visant à aider les candidats en situation de handicap. Nous menons un partenariat avec France Travail et Cap emploi afin de valoriser les
      employeurs engagés en faveur de l’emploi des personnes en situation de handicap.
    </Typography>
    <Typography sx={{ mb: fr.spacing("6v") }}>
      Tous les recruteurs ayant obtenu la qualification handi-engagé par France Travail et Cap emploi sont facilement identifiables pour les candidats sur La bonne alternance grâce
      à une étiquette « Handi-engagé ».
    </Typography>
    <HandiEngagementSelect name={name} value={value} onChange={onChange} disabled={disabled} />
  </FormSection>
)
