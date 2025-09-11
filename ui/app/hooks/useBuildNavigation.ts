import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useSwipeable } from "react-swipeable"

import { ILbaItem, IUseRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { getItemReference, getResultItemUrl, type WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useBuildNavigation({ items, currentItem, rechercheParams }: WithRecherchePageParams<{ items: IUseRechercheResults["items"]; currentItem: ILbaItem }>) {
  const router = useRouter()
  // TODO: quand nous aurons la pagination partout il ne sera pas nécessaire de gérer le cas où currentItem est null (conséquence de lien partagé recherche France entière)
  const currentIndex = currentItem ? items.findIndex((item) => currentItem.id === item.id) : 0
  const nextItem = currentIndex == items.length - 1 ? 0 : items[currentIndex + 1]
  const previousItem = currentIndex == 0 ? items[items.length - 1] : items[currentIndex - 1]
  const nextUrl = useMemo(() => {
    return nextItem ? getResultItemUrl(nextItem, { ...rechercheParams, activeItems: [getItemReference(nextItem)] }) : null
  }, [nextItem, rechercheParams])
  const previousUrl = useMemo(() => {
    return previousItem ? getResultItemUrl(previousItem, { ...rechercheParams, activeItems: [getItemReference(previousItem)] }) : null
  }, [previousItem, rechercheParams])

  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      if (event_data.dir === "Right") {
        if (items.length > 1) {
          goPrev()
        }
      } else if (event_data.dir === "Left") {
        if (items.length > 1) {
          goNext()
        }
      }
    },
  })

  const goNext = nextUrl ? () => router.push(nextUrl) : null
  const goPrev = previousUrl ? () => router.push(previousUrl) : null

  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}
