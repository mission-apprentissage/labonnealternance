import { PasswordInput } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <PasswordInput label="Mot de passe de votre espace recruteur" nativeInputProps={{ defaultValue: "Alternance2026!" }} />
  </div>
)

export const WithCriteria = () => (
  <div style={{ maxWidth: 480 }}>
    <PasswordInput
      label="Créer un mot de passe"
      messagesHint="Votre mot de passe doit contenir :"
      messages={[
        { severity: "valid", message: "12 caractères minimum" },
        { severity: "valid", message: "1 majuscule" },
        { severity: "info", message: "1 caractère spécial" },
      ]}
      nativeInputProps={{ defaultValue: "Apprenti" }}
    />
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <PasswordInput
      label="Mot de passe"
      messages={[
        { severity: "error", message: "8 caractères minimum requis" },
        { severity: "error", message: "Au moins un chiffre" },
      ]}
      nativeInputProps={{ defaultValue: "cfa" }}
    />
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <PasswordInput label="Mot de passe (compte suspendu)" disabled nativeInputProps={{ defaultValue: "MotDePasse2026" }} />
  </div>
)
