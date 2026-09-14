import { Upload } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <Upload label="Déposer votre CV" hint="Format PDF ou DOCX, 5 Mo maximum" nativeInputProps={{ accept: ".pdf,.docx" }} />
  </div>
)

export const Multiple = () => (
  <div style={{ maxWidth: 480 }}>
    <Upload
      label="Pièces justificatives du contrat d'apprentissage"
      hint="Convention de formation, pièce d'identité, RIB"
      multiple
      nativeInputProps={{ accept: ".pdf,.jpg,.png" }}
    />
  </div>
)

export const Success = () => (
  <div style={{ maxWidth: 480 }}>
    <Upload label="Justificatif de domicile" state="success" stateRelatedMessage="Fichier justificatif-domicile.pdf téléchargé" />
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <Upload label="Lettre de motivation" state="error" stateRelatedMessage="Le fichier dépasse la taille maximale de 5 Mo" />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <Upload label="Attestation employeur (indisponible)" hint="Étape accessible après validation du dossier" disabled />
  </div>
)
