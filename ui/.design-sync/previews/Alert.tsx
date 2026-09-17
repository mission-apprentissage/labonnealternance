import { Alert } from "lba-ds"

export const Severities = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <Alert severity="info" title="Votre candidature a bien été enregistrée" description="L'employeur reviendra vers vous sous 5 jours ouvrés." />
    <Alert severity="success" title="Offre publiée" description="Votre offre d'alternance est désormais visible sur La Bonne Alternance." />
    <Alert severity="warning" title="Profil incomplet" description="Ajoutez un CV pour augmenter vos chances d'être recontacté." />
    <Alert severity="error" title="Envoi impossible" description="Vérifiez votre adresse e-mail et réessayez." />
  </div>
)

export const Small = () => <Alert small severity="info" description="Les offres sont mises à jour chaque nuit." />

export const Closable = () => <Alert closable severity="success" title="Adresse confirmée" description="Vous recevrez les nouvelles offres correspondant à votre recherche." />
