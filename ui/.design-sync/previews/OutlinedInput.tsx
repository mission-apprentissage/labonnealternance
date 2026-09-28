import { OutlinedInput, Stack } from "lba-ds"

export const Champs = () => (
  <Stack direction="column" spacing={2} component="div" style={{ maxWidth: 420 }}>
    <OutlinedInput defaultValue="Alternance développeur web" placeholder="Métier recherché" />
    <OutlinedInput defaultValue="75001" placeholder="Code postal" />
    <OutlinedInput defaultValue="Candidature envoyée" disabled />
    <OutlinedInput defaultValue="siret-invalide" error />
  </Stack>
)
