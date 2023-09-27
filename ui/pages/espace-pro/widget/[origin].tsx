import { useRouter } from "next/router"

import { AUTHTYPE } from "../../../common/contants"
import CreationCompte from "../../../components/espace_pro/Authentification/CreationCompte"

export default function Widget() {
  const router = useRouter()
  const { origin } = router.query
  return <CreationCompte type={AUTHTYPE.ENTREPRISE} widget={true} origin={origin as string} />
}
