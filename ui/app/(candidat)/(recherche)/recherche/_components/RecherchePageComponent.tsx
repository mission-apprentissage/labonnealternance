"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import type { Virtualizer } from "@tanstack/react-virtual"
import { useCallback, useEffect, useRef, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { Footer } from "@/app/_components/Footer"
import { EnqueteTally } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/EnqueteTally"
import { useNavigateToRecherchePage } from "@/app/(candidat)/(recherche)/recherche/_hooks/useNavigateToRecherchePage"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { isItemReferenceInList } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { scrollToVirtualItem } from "@/app/(candidat)/(recherche)/recherche/_utils/scrollToVirtualItem"
import { BackToTopButton } from "@/components/ItemDetail/BackToTopButton"
import { RechercheHeader } from "./RechercheResultats/RechercheHeader"
import { RechercheMobileFormUpdate } from "./RechercheResultats/RechercheMobileFormUpdate"
import { RecherchePageEmpty } from "./RechercheResultats/RecherchePageEmpty"
import { RechercheResultatsList } from "./RechercheResultats/RechercheResultatsList"
import { RechercheTitle } from "./RechercheResultats/RechercheTitle"
import type { ResultCardData } from "./RechercheResultats/ResultCardData"
import { VirtualContainer } from "./RechercheResultats/VirtualContainer"

/** Hauteur réservée sous le header sticky lors des scrolls programmatiques vers un item. */
const STICKY_HEADER_HEIGHT = 212

function RecherchePageComponentWithParams(props: { rechercheParams: IRecherchePageParams }) {
  const { displayMobileForm, activeItems = [], scrollToRecruteursLba } = props.rechercheParams
  const scrollElement = useRef<HTMLElement>(null)
  const virtualizerRef = useRef<Virtualizer<any, Element>>(null)
  const scrollToItemCancelRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => scrollToItemCancelRef.current?.()
  }, [])

  const elements: ReturnType<typeof RechercheResultatsList> = []

  const scrollToItem = (item: ResultCardData) => {
    const scrolledElementIndex = elements.findIndex((element) => "item" in element && element.item === item)
    if (scrolledElementIndex === -1 || !virtualizerRef.current) return
    scrollToItemCancelRef.current?.()
    scrollToItemCancelRef.current = scrollToVirtualItem({
      virtualizer: virtualizerRef.current,
      index: scrolledElementIndex,
      offsetTop: STICKY_HEADER_HEIGHT,
      behavior: "smooth",
      maxAttempts: 30,
    })
  }

  elements.push(...RechercheResultatsList({ ...props, scrollToItem }))

  const getScolledElementIndex = () => {
    return elements.findIndex((element) => {
      if (!("item" in element && element.item)) return false
      const { item } = element
      const { type } = item
      if (activeItems.length) {
        return type === "lba_item" && isItemReferenceInList(item.value, activeItems)
      }
      if (scrollToRecruteursLba) {
        return type === "lba_item" && item.value.ideaType === LBA_ITEM_TYPE_OLD.LBA
      }
      return false
    })
  }

  const scolledElementIndex = getScolledElementIndex()

  // Retire le flag de l'URL après le scroll initial pour éviter un re-scroll au refresh.
  const onInitialScrollDone = useCallback(() => {
    if (!scrollToRecruteursLba) return
    const url = new URL(window.location.href)
    url.searchParams.delete("scrollToRecruteursLba")
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }, [scrollToRecruteursLba])

  if (displayMobileForm) {
    return <RechercheMobileFormUpdate rechercheParams={props.rechercheParams} />
  }

  return (
    <Box>
      <RecherchePageHeader rechercheParams={props.rechercheParams} />
      <VirtualContainer
        scrollElementRef={scrollElement}
        virtualizerRef={virtualizerRef}
        defaultHeight={270}
        elements={elements}
        scrollPaddingStart={STICKY_HEADER_HEIGHT}
        initialScrollIndex={scolledElementIndex}
        onInitialScrollDone={onInitialScrollDone}
        useWindowScroll
      />
    </Box>
  )
}

function RecherchePageHeader({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerHeightRef = useRef(0)
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)
  const navigateToRecherchePage = useNavigateToRecherchePage(rechercheParams)

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        headerHeightRef.current = headerRef.current.offsetHeight
      }
    }

    updateHeaderHeight()
    window.addEventListener("resize", updateHeaderHeight)

    return () => window.removeEventListener("resize", updateHeaderHeight)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (headerHeightRef.current === 0) return

      const currentScroll = window.scrollY || document.documentElement.scrollTop
      const nextIsCollapsedHeader = currentScroll > headerHeightRef.current
      setIsCollapsedHeader((previousIsCollapsedHeader) => (previousIsCollapsedHeader === nextIsCollapsedHeader ? previousIsCollapsedHeader : nextIsCollapsedHeader))
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Mobile: sticky au niveau du fragment pour que le parent (Box principal) englobe tout le contenu */}
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
          justifyContent: "flex-end",
        }}
      >
        <h1 className="fr-sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          Trouver formation et emploi en alternance
        </h1>
        <Button
          iconId="fr-icon-search-line"
          priority="secondary"
          onClick={() => navigateToRecherchePage({ displayMobileForm: true }, true)}
          style={{ backgroundColor: "transparent" }}
        >
          Modifier la recherche
        </Button>
      </Box>

      {/* Desktop: titre + header avec scroll collapse */}
      <RechercheTitle viewType={rechercheParams.viewType} />
      <Box ref={headerRef} sx={{ display: { xs: "none", lg: "block" }, minHeight: isCollapsedHeader ? headerHeightRef.current : undefined }}>
        <RechercheHeader rechercheParams={rechercheParams} fullWidth={isCollapsedHeader} />
      </Box>
    </>
  )
}

export function RecherchePageComponent(props: { rechercheParams: IRecherchePageParams }) {
  const rechercheResult = useRechercheResults(props.rechercheParams)

  if (rechercheResult.status === "disabled") {
    return (
      <>
        <EnqueteTally />
        <RecherchePageEmpty {...props} />
        <BackToTopButton />
        <Footer />
      </>
    )
  }

  return (
    <>
      <EnqueteTally />
      <RecherchePageComponentWithParams {...props} />
      <BackToTopButton />
    </>
  )
}
