import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

export default function CreationEntreprise() {
  return <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={false} />
}
