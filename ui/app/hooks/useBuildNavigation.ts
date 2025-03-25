import { useRouter } from "next/navigation"
import { useSwipeable } from "react-swipeable"

import { ILbaItem, IUseRechercheResultsSuccess } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { useResultItemUrl } from "@/app/(candidat)/recherche/_hooks/useResultItemUrl"
import type { WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function useBuildNavigation({ items, currentItem, params }: WithRecherchePageParams<{ items: IUseRechercheResultsSuccess["items"]; currentItem: ILbaItem }>) {
  const router = useRouter()
  const currentIndex = items.findIndex((item) => currentItem.id === item.id)
  const nextIndex = currentIndex == items.length - 1 ? 0 : currentIndex + 1
  const previousIndex = currentIndex == 0 ? items.length - 1 : currentIndex - 1
  const nextUrl = useResultItemUrl(items[nextIndex], params)
  const previousUrl = useResultItemUrl(items[previousIndex], params)

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

  const goNext = () => router.push(nextUrl)
  const goPrev = () => router.push(previousUrl)

  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}
