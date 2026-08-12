"use client"

import { captureException } from "@sentry/browser"
import { useEffect } from "react"

import { parseSearchPageParams } from "../_utils/search.params.utils"
import { SEARCH_MODE_OPTIONS } from "./SearchTypeRechercheSelect"

// https://tally.so/forms/LZq2l1 — « Donnez votre avis » (nouveau moteur de recherche)
const TALLY_FORM_ID = "LZq2l1"

let triggered = false
const PERCENTAGE_TRIGGER = 0.2 // 20%
const TIME_ELAPSED_TRIGGER = 15_000 // 15 secondes
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

    const params = parseSearchPageParams(new URL(window.location.href).searchParams)

    // Clés = hidden fields configurés dans le formulaire Tally (keywords / lieu / type).
    const hiddenFields: { keywords?: string; lieu?: string; type?: string } = {
      keywords: params.q,
      lieu: params.lieu_label,
      type: SEARCH_MODE_OPTIONS.find((option) => option.value === params.mode)?.label ?? params.mode,
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
    window.Tally.openPopup(TALLY_FORM_ID, options)
  } catch (err) {
    captureException(err)
  }
}

function getScrollPercent(): number | undefined {
  const el = document.documentElement
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
    }, TIME_ELAPSED_TRIGGER)

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
