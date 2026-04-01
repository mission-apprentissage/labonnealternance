import { captureException } from "@sentry/browser"
import { useEffect } from "react"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

let triggered = false
const PERCENTAGE_TRIGGER = 0.1 // 10%
let scriptInitialized = false

const insertTallyScript = () => {
  if (scriptInitialized) {
    return
  }
  try {
    scriptInitialized = true
    const scriptEl = window.document.createElement("script")
    scriptEl.src = "https://tally.so/widgets/embed.js"
    window.document.body.append(scriptEl)
  } catch (err) {
    captureException(err)
  }
}

const openPopup = () => {
  try {
    if (triggered) {
      return
    }
    triggered = true

    const rechercheParams = parseRecherchePageParams(new URL(window.location.href).searchParams, IRechercheMode.DEFAULT)

    const itemTypes: string[] = []
    if (rechercheParams.displayEntreprises) {
      itemTypes.push("métier")
    }
    if (rechercheParams.displayFormations) {
      itemTypes.push("formation")
    }

    const hiddenFields: { checkbox?: string; libelle?: string; lieu?: string; niveau?: string; handi?: string } = {
      libelle: rechercheParams.job_name,
      lieu: rechercheParams.geo?.address,
      niveau: rechercheParams.diploma,
      handi: `${rechercheParams.elligibleHandicapFilter}`,
      checkbox: itemTypes.join(" & "),
    }

    const options: TallyOptions = {
      key: "search",
      emoji: {
        text: "👋",
        animation: "wave",
      },
      hideTitle: true,
      showOnce: true,
      doNotShowAfterSubmit: true,
      hiddenFields,
    }
    // @ts-expect-error
    window.Tally.openPopup("b5xXxZ", options)
  } catch (err) {
    captureException(err)
  }
}

function getScrollPercent(): number | undefined {
  const el = document.querySelector(".VirtualContainer")
  if (!el) {
    return
  }
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return el.scrollTop / max
}

export const EnqueteTally = () => {
  useEffect(() => {
    if (triggered) {
      return
    }
    insertTallyScript()
    const intervalId = setInterval(() => {
      if (triggered) {
        clearInterval(intervalId)
        return
      }
      const scrollPercentage = getScrollPercent()
      if (scrollPercentage !== undefined && scrollPercentage >= PERCENTAGE_TRIGGER) {
        openPopup()
        clearInterval(intervalId)
      }
    }, 1_000)
    const timeoutId = setTimeout(() => {
      openPopup()
    }, 30_000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])
  return null
}

type TallyOptions = {
  key?: string // This is used as a unique identifier used for the "Show only once" and "Don't show after submit" functionality
  layout?: "default" | "modal"
  width?: number
  alignLeft?: boolean
  hideTitle?: boolean
  overlay?: boolean
  emoji?: {
    text: string
    animation: "none" | "wave" | "tada" | "heart-beat" | "spin" | "flash" | "bounce" | "rubber-band" | "head-shake"
  }
  autoClose?: number // in milliseconds
  showOnce?: boolean
  doNotShowAfterSubmit?: boolean
  customFormUrl?: string // when you want to load the form via it's custom domain URL
  hiddenFields?: {
    [key: string]: any
  }
  onOpen?: () => void
  onClose?: () => void
  onPageView?: (page: number) => void
  // onSubmit?: (payload: SubmissionPayload) => void;
}
