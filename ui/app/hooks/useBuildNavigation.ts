import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useSwipeable } from "react-swipeable"

import { IUseRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { getItemReference, getResultItemUrl, type WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export function useBuildNavigation({ items, currentItemId, rechercheParams }: WithRecherchePageParams<{ items: IUseRechercheResults["displayedItems"]; currentItemId?: string }>) {
  const router = useRouter()
  // TODO: quand nous aurons la pagination partout il ne sera pas nécessaire de gérer le cas où currentItem est null (conséquence de lien partagé recherche France entière)

  const { goPrev, goNext } = useMemo(() => {
    if (items.length <= 1) {
      return {}
    }
    const currentIndex = currentItemId ? items.findIndex((item) => currentItemId === item.id) : 0
    const nextItemIndex = (currentIndex + 1) % items.length
    const previousItemIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1

    const goToIndex = (index: number) => {
      const item = items[index]
      if (!item) return null
      const url = getResultItemUrl(item, { ...rechercheParams, activeItems: [getItemReference(item)] })
      return () => router.push(url)
    }

    return { goNext: goToIndex(nextItemIndex), goPrev: goToIndex(previousItemIndex) }
  }, [currentItemId, items, rechercheParams, router])

  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      if (event_data.dir === "Right") {
        goPrev?.()
      } else if (event_data.dir === "Left") {
        goNext?.()
      }
    },
  })

  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}
