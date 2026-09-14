import { FranceConnectButton } from "lba-ds"

export const Connexion = () => (
  <div style={{ maxWidth: 320 }}>
    <FranceConnectButton url="/connexion/franceconnect?redirect=/espace-candidat" />
  </div>
)

export const ConnexionPlus = () => (
  <div style={{ maxWidth: 320 }}>
    <FranceConnectButton plus url="/connexion/franceconnect-plus?redirect=/espace-recruteur" />
  </div>
)
