import { assertUnreachable } from "shared"
import { AUTHTYPE } from "shared/constants"

import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"

export function useUserNavigationContext() {
  const { user } = useConnectedSessionClient()

  switch (user.type) {
    case AUTHTYPE.ENTREPRISE:
      return `/espace-pro/entreprise`
    case AUTHTYPE.CFA:
      return `/espace-pro/cfa`
    case AUTHTYPE.ADMIN:
      return `/espace-pro/administration`
    case AUTHTYPE.OPCO:
      return `/espace-pro/opco`
    default:
      assertUnreachable(`wrong user type ${user.type}` as never)
  }
}
