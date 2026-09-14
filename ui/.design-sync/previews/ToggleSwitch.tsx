import { ToggleSwitch } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <ToggleSwitch label="Recevoir des alertes email pour les nouvelles offres" helperText="Une fois par jour, selon vos critères de recherche" defaultChecked />
  </div>
)

export const LabelRight = () => (
  <div style={{ maxWidth: 480 }}>
    <ToggleSwitch label="Rendre mon offre d'apprentissage visible aux candidats" labelPosition="right" defaultChecked />
  </div>
)

export const Unchecked = () => (
  <div style={{ maxWidth: 480 }}>
    <ToggleSwitch label="Autoriser les candidatures spontanées" helperText="Les candidats pourront vous contacter hors offre publiée" defaultChecked={false} />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <ToggleSwitch label="Diffuser l'offre sur France Travail (bientôt disponible)" disabled defaultChecked />
  </div>
)
