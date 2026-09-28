import { Stack, TextField } from "lba-ds"

export const Formulaire = () => (
  <Stack direction="column" spacing={2} component="div" style={{ maxWidth: 420 }}>
    <TextField label="Intitulé du poste" defaultValue="Développeur·se web en alternance" />
    <TextField label="Ville" defaultValue="Paris" helperText="Lieu principal du contrat" />
    <TextField label="E-mail de contact" type="email" defaultValue="recrutement@entreprise.fr" error helperText="Adresse invalide" />
    <TextField label="Référence interne" disabled defaultValue="ALT-2026-045" />
  </Stack>
)

export const MultiLignes = () => (
  <div style={{ maxWidth: 420 }}>
    <TextField
      label="Description de l'offre"
      multiline
      minRows={3}
      defaultValue="Vous participerez au développement des services numériques de l'emploi, encadré·e par un tuteur."
      fullWidth
    />
  </div>
)
