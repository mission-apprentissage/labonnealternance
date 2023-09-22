import { AUTHTYPE } from "../../../../common/contants"
import CreationCompte from "../../../../components/espace_pro/Authentification/CreationCompte"

export default function CreationCFA() {
  return <CreationCompte type={AUTHTYPE.CFA} />
}
