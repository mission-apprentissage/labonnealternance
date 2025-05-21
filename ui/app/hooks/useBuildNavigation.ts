import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useSwipeable } from "react-swipeable"

import { ILbaItem, IUseRechercheResultsSuccess } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { getItemReference, getResultItemUrl, type WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useBuildNavigation({ items, currentItem, params }: WithRecherchePageParams<{ items: IUseRechercheResultsSuccess["items"]; currentItem: ILbaItem }>) {
  const router = useRouter()
  const currentIndex = currentItem ? items.findIndex((item) => currentItem.id === item.id) : 0
  const nextItem = currentIndex == items.length - 1 ? 0 : items[currentIndex + 1]
  const previousItem = currentIndex == 0 ? items[items.length - 1] : items[currentIndex - 1]
  const nextUrl = useMemo(() => {
    return nextItem ? getResultItemUrl(nextItem, { ...params, activeItems: [getItemReference(nextItem)] }) : null
  }, [nextItem, params])
  const previousUrl = useMemo(() => {
    return previousItem ? getResultItemUrl(previousItem, { ...params, activeItems: [getItemReference(previousItem)] }) : null
  }, [previousItem, params])

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
