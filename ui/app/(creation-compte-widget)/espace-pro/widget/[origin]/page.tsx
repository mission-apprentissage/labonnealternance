import { AUTHTYPE } from "@/common/contants"
import CreationCompte from "@/components/espace_pro/Authentification/CreationCompte"

export default async function Widget({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params
  return <CreationCompte type={AUTHTYPE.ENTREPRISE} isWidget={true} origin={origin} />
}
