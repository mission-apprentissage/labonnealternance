"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { Virtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { Footer } from "@/app/_components/Footer"
import { EnqueteTally } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/EnqueteTally"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { isItemReferenceInList } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { BackToTopButton } from "@/components/ItemDetail/BackToTopButton"
import { RechercheHeader } from "./RechercheResultats/RechercheHeader"
import { RechercheMobileFormUpdate } from "./RechercheResultats/RechercheMobileFormUpdate"
import { RecherchePageEmpty } from "./RechercheResultats/RecherchePageEmpty"
import { RechercheResultatsList } from "./RechercheResultats/RechercheResultatsList"
import type { ResultCardData } from "./RechercheResultats/ResultCardData"
import { VirtualContainer } from "./RechercheResultats/VirtualContainer"

function RecherchePageComponentWithParams(props: { rechercheParams: IRecherchePageParams }) {
  const { displayMobileForm, activeItems = [], scrollToRecruteursLba } = props.rechercheParams
  const scrollElement = useRef<HTMLElement>(null)
  const virtualizerRef = useRef<Virtualizer<any, Element>>(null)

  const elements: ReturnType<typeof RechercheResultatsList> = []

  const scrollToItem = (item: ResultCardData) => {
    const scolledElementIndex = elements.findIndex((element) => "item" in element && element.item === item)
    if (scolledElementIndex !== -1) {
      // Calcul direct de la position pour contourner les problèmes de scrollToIndex avec useWindowScroll
      let offset = 0
      for (let i = 0; i < scolledElementIndex; i++) {
        const el = elements[i]
        offset += (typeof el === "object" && "height" in el ? el.height : undefined) ?? 270
      }
      const containerOffset = document.querySelector(".VirtualContainer")?.getBoundingClientRect().top ?? 0
      const scrollTop = window.scrollY + containerOffset + offset
      window.scrollTo({ top: scrollTop, behavior: "instant" })
    }
  }

  elements.push(...RechercheResultatsList({ ...props, scrollToItem }))

  if (displayMobileForm) {
    return <RechercheMobileFormUpdate rechercheParams={props.rechercheParams} />
  }

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

  return (
    <Box>
      <RecherchePageHeader rechercheParams={props.rechercheParams} />
      <VirtualContainer
        scrollElementRef={scrollElement}
        virtualizerRef={virtualizerRef}
        defaultHeight={270}
        elements={elements}
        scrollToElementIndex={scolledElementIndex}
        useWindowScroll
      />
    </Box>
  )
}

function RecherchePageHeader({ rechercheParams }: { rechercheParams: IRecherchePageParams }) {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerHeightRef = useRef(0)
  const [isCollapsedHeader, setIsCollapsedHeader] = useState(false)

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
      <Box
        sx={{
          maxWidth: "xl",
          margin: "auto",
          pt: { xs: 0, lg: fr.spacing("4v") },
          px: { xs: 0, lg: fr.spacing("4v") },
          position: "relative",
        }}
      >
        <Typography
          component="h1"
          variant="h1"
          sx={{
            display: { xs: "none", lg: "block" },
          }}
        >
          Trouver formation et emploi{" "}
          <Typography component="span" variant="h1" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
            en alternance
          </Typography>
        </Typography>
        <Typography
          component="h1"
          className="fr-sr-only"
          sx={{ display: { xs: "block", lg: "none" }, position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
        >
          Trouver formation et emploi en alternance
        </Typography>
      </Box>
      <Box ref={headerRef} sx={{ minHeight: isCollapsedHeader ? headerHeightRef.current : undefined }}>
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
