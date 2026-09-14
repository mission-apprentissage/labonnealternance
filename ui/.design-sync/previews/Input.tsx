import { Input } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <Input
      label="Métier ou secteur recherché"
      hintText="Ex : boulanger, mécanicien, développement web"
      nativeInputProps={{ placeholder: "Rechercher un métier", defaultValue: "Cuisinier" }}
    />
  </div>
)

export const WithIcon = () => (
  <div style={{ maxWidth: 480 }}>
    <Input
      label="Lieu de recherche"
      hintText="Ville, code postal ou département de l'alternance"
      iconId="fr-icon-map-pin-2-line"
      nativeInputProps={{ placeholder: "Nantes (44000)", defaultValue: "Lyon (69003)" }}
    />
  </div>
)

export const Success = () => (
  <div style={{ maxWidth: 480 }}>
    <Input
      label="Adresse email du candidat"
      state="success"
      stateRelatedMessage="Adresse vérifiée, candidature transmise au recruteur"
      nativeInputProps={{ type: "email", defaultValue: "sofia.martin@example.fr" }}
    />
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <Input
      label="Numéro SIRET de l'entreprise"
      hintText="14 chiffres présents sur l'extrait Kbis"
      state="error"
      stateRelatedMessage="SIRET invalide : l'établissement n'a pas été trouvé"
      nativeInputProps={{ defaultValue: "320 999 001 00034" }}
    />
  </div>
)

export const TextArea = () => (
  <div style={{ maxWidth: 480 }}>
    <Input
      label="Message de motivation"
      hintText="Expliquez au recruteur pourquoi cette alternance vous intéresse"
      textArea
      nativeTextAreaProps={{
        rows: 4,
        defaultValue: "Bonjour, actuellement en Bac Pro Cuisine, je recherche un contrat d'apprentissage pour la rentrée 2026 au sein de votre établissement.",
      }}
    />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <Input label="Identifiant CFA (rattachement)" disabled nativeInputProps={{ defaultValue: "CFA-0691234A" }} />
  </div>
)
