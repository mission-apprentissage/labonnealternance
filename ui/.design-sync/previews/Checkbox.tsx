import { Checkbox } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <Checkbox
      legend="Types de contrat acceptés"
      hintText="Vous pouvez cocher plusieurs types de contrat"
      options={[
        {
          label: "Contrat d'apprentissage",
          hintText: "Pour les 16-29 ans, en CFA",
          nativeInputProps: { name: "contrat", value: "apprentissage", defaultChecked: true },
        },
        {
          label: "Contrat de professionnalisation",
          hintText: "En organisme de formation",
          nativeInputProps: { name: "contrat", value: "pro", defaultChecked: true },
        },
        {
          label: "Stage d'immersion",
          nativeInputProps: { name: "contrat", value: "stage" },
        },
      ]}
    />
  </div>
)

export const Horizontal = () => (
  <div style={{ maxWidth: 480 }}>
    <Checkbox
      legend="Jours de présence en entreprise"
      orientation="horizontal"
      options={[
        { label: "Lundi", nativeInputProps: { name: "jour", value: "lun", defaultChecked: true } },
        { label: "Mardi", nativeInputProps: { name: "jour", value: "mar", defaultChecked: true } },
        { label: "Mercredi", nativeInputProps: { name: "jour", value: "mer" } },
      ]}
    />
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <Checkbox
      legend="Consentement candidat"
      state="error"
      stateRelatedMessage="Vous devez accepter pour envoyer votre candidature"
      options={[
        {
          label: "J'autorise la transmission de mon CV au recruteur",
          nativeInputProps: { name: "rgpd", value: "cv" },
        },
      ]}
    />
  </div>
)

export const Small = () => (
  <div style={{ maxWidth: 480 }}>
    <Checkbox
      legend="Filtres de recherche"
      small
      options={[
        {
          label: "Uniquement les offres avec entreprise identifiée",
          nativeInputProps: { name: "filtre", value: "entreprise", defaultChecked: true },
        },
        {
          label: "Masquer les offres déjà consultées",
          nativeInputProps: { name: "filtre", value: "vues" },
        },
      ]}
    />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <Checkbox
      legend="Options indisponibles pour votre profil"
      disabled
      options={[
        {
          label: "Réservé aux travailleurs en situation de handicap",
          nativeInputProps: { name: "opt", value: "rqth" },
        },
      ]}
    />
  </div>
)
