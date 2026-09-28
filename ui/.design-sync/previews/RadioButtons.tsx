import { RadioButtons } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <RadioButtons
      legend="Quel est votre statut actuel ?"
      name="statut"
      options={[
        {
          label: "Lycéen ou étudiant",
          hintText: "En cours de scolarité",
          nativeInputProps: { value: "etudiant", defaultChecked: true },
        },
        {
          label: "Demandeur d'emploi",
          hintText: "Inscrit à France Travail",
          nativeInputProps: { value: "demandeur" },
        },
        {
          label: "Salarié en reconversion",
          nativeInputProps: { value: "reconversion" },
        },
      ]}
    />
  </div>
)

export const Horizontal = () => (
  <div style={{ maxWidth: 480 }}>
    <RadioButtons
      legend="L'offre correspond-elle à votre recherche ?"
      name="feedback"
      orientation="horizontal"
      options={[
        { label: "Oui", nativeInputProps: { value: "oui", defaultChecked: true } },
        { label: "Non", nativeInputProps: { value: "non" } },
      ]}
    />
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <RadioButtons
      legend="Publier cette offre d'apprentissage ?"
      name="publication"
      state="error"
      stateRelatedMessage="Choisissez une option avant de valider"
      options={[
        { label: "Publier immédiatement", nativeInputProps: { value: "now" } },
        { label: "Enregistrer en brouillon", nativeInputProps: { value: "draft" } },
      ]}
    />
  </div>
)

export const Small = () => (
  <div style={{ maxWidth: 480 }}>
    <RadioButtons
      legend="Trier les offres par"
      name="tri"
      small
      options={[
        { label: "Pertinence", nativeInputProps: { value: "pertinence", defaultChecked: true } },
        { label: "Distance", nativeInputProps: { value: "distance" } },
        { label: "Date de publication", nativeInputProps: { value: "date" } },
      ]}
    />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <RadioButtons
      legend="Mode de candidature"
      name="mode"
      disabled
      options={[
        { label: "Candidature via La Bonne Alternance", nativeInputProps: { value: "lba", defaultChecked: true } },
        { label: "Candidature sur le site du recruteur", nativeInputProps: { value: "externe" } },
      ]}
    />
  </div>
)
