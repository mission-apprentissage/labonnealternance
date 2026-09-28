import { TextareaAutosize } from "lba-ds"

export const Message = () => (
  <div style={{ maxWidth: 460 }}>
    <TextareaAutosize
      minRows={4}
      defaultValue={"Bonjour,\n\nVotre profil correspond à notre offre d'alternance. Seriez-vous disponible pour un premier échange cette semaine ?\n\nCordialement,"}
      style={{ width: "100%", padding: "0.5rem 1rem", fontFamily: "inherit", fontSize: "1rem" }}
    />
  </div>
)
