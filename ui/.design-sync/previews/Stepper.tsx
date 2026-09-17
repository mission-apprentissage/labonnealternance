import { Stepper } from "lba-ds"

export const DebutCandidature = () => (
  <div style={{ maxWidth: 520 }}>
    <Stepper currentStep={1} stepCount={4} title="Vos coordonnées" nextTitle="Votre CV et lettre de motivation" />
  </div>
)

export const EnCours = () => (
  <div style={{ maxWidth: 520 }}>
    <Stepper currentStep={3} stepCount={4} title="Vos disponibilités" nextTitle="Récapitulatif et envoi" />
  </div>
)

export const DerniereEtape = () => (
  <div style={{ maxWidth: 520 }}>
    <Stepper currentStep={4} stepCount={4} title="Récapitulatif et envoi" />
  </div>
)

export const DepotOffre = () => (
  <div style={{ maxWidth: 520 }}>
    <Stepper currentStep={2} stepCount={3} title="Description du poste" nextTitle="Diffusion de l'offre" />
  </div>
)
