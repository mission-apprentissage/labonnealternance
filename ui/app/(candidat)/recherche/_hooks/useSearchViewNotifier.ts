import { notifyJobSearchViewV3 } from "@/utils/api"

let notifyViewState = { viewedItems: new Set<string>(), lastNotifyDate: new Date(0) }
const notifiedViewedItems = new Set<string>()

const triggerSend = () => {
  // limite les appels toutes les 3 secondes
  if (typeof window === "undefined" || new Date().getTime() - notifyViewState.lastNotifyDate.getTime() < 3_000 /* 3 secondes*/) return
  const idsToSend: string[] = []
  for (const id of notifyViewState.viewedItems) {
    if (!notifiedViewedItems.has(id)) {
      idsToSend.push(id)
    }
  }
  if (!idsToSend.length) {
    return
  }
  idsToSend.forEach((id) => {
    notifiedViewedItems.add(id)
  })
  notifyViewState = { viewedItems: new Set<string>(), lastNotifyDate: new Date() }
  notifyJobSearchViewV3(idsToSend)
}

function addSearchView(id: string) {
  notifyViewState.viewedItems.add(id)
  triggerSend()
}

export function useSearchViewNotifier() {
  return { addSearchView }
}
