import { ButtonsGroup } from "lba-ds"

export const CandidatureActions = () => (
  <ButtonsGroup
    inlineLayoutWhen="sm and up"
    buttons={[
      { children: "Postuler à l'offre", iconId: "fr-icon-mail-send-line" },
      { children: "Enregistrer l'offre", priority: "secondary" },
      { children: "Partager", priority: "tertiary no outline" },
    ]}
  />
)

export const RecruteurEspace = () => (
  <ButtonsGroup
    alignment="right"
    buttonsSize="small"
    inlineLayoutWhen="always"
    buttons={[
      { children: "Annuler", priority: "tertiary no outline" },
      { children: "Publier l'offre", iconId: "fr-icon-arrow-right-line", iconPosition: "right" },
    ]}
  />
)

export const Verticale = () => (
  <div style={{ maxWidth: 320 }}>
    <ButtonsGroup
      buttonsEquisized
      buttons={[
        { children: "Se connecter avec FranceConnect" },
        { children: "Créer un compte candidat", priority: "secondary" },
        { children: "Continuer sans compte", priority: "tertiary" },
      ]}
    />
  </div>
)
