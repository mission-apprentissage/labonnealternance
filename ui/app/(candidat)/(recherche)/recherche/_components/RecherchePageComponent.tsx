"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRef } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import type { Virtualizer } from "@tanstack/react-virtual"
import { CandidatRechercheFilters } from "./CandidatRechercheFilters"
import { RechercheBackToTopButton } from "./RechercheResultats/RechercheBackToTopButton"
import { RechercheHeader } from "./RechercheResultats/RechercheHeader"
import { RechercheCarte } from "./RechercheResultats/RechercheMap"
import { RechercheMobileFormUpdate } from "./RechercheResultats/RechercheMobileFormUpdate"
import { RechercheMobileToggleMapButton } from "./RechercheResultats/RechercheMobileToggleMapButton"
import { RecherchePageEmpty } from "./RechercheResultats/RecherchePageEmpty"
import { RechercheResultatsList } from "./RechercheResultats/RechercheResultatsList"
import { VirtualContainer } from "./RechercheResultats/VirtualContainer"
import type { ResultCardData } from "./RechercheResultats/ResultCardData"
import { useRechercheResults } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { isItemReferenceInList } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { Footer } from "@/app/_components/Footer"

function RecherchePageComponentWithParams(props: { rechercheParams: IRecherchePageParams }) {
  const { displayMap, displayMobileForm, activeItems = [], scrollToRecruteursLba } = props.rechercheParams
  const scrollElement = useRef<HTMLElement>(null)
  const rechercheResult = useRechercheResults(props.rechercheParams)
  const virtualizerRef = useRef<Virtualizer<any, Element>>(null)

  const elements: ReturnType<typeof RechercheResultatsList> = []

  const scrollToItem = (item: ResultCardData) => {
    const scolledElementIndex = elements.findIndex((element) => "item" in element && element.item === item)
    if (scolledElementIndex !== -1) {
      virtualizerRef.current.scrollToIndex(scolledElementIndex, { align: "start" })
    }
  }

  elements.push(
    {
      height: 122,
      render: () => <CandidatRechercheFilters rechercheParams={props.rechercheParams} />,
      onRender: undefined,
      item: undefined,
    },
    ...RechercheResultatsList({ ...props, scrollToItem })
  )

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
    <Box
      sx={{
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <RechercheHeader {...props} />
      <Box
        sx={{
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: {
            xs: "column",
            lg: "row",
          },
        }}
      >
        <VirtualContainer
          ref={scrollElement}
          virtualizerRef={virtualizerRef}
          defaultHeight={270}
          elements={elements}
          scrollToElementIndex={scolledElementIndex}
          parentStyle={{
            ...(displayMap
              ? {
                  display: {
                    xs: "none",
                    lg: "block",
                  },
                }
              : {}),
          }}
        />
        {displayMap ? <RechercheCarte item={null} variant="recherche" {...props} /> : <></>}
        <Box
          sx={{
            padding: fr.spacing("2w"),
            margin: "auto",
            display: {
              xs: "block",
              lg: "none",
            },
          }}
        >
          <RechercheMobileToggleMapButton displayMap={displayMap} rechercheParams={props.rechercheParams} />
        </Box>
        {!displayMap && rechercheResult.displayedItems.length > 1 && <RechercheBackToTopButton onClick={() => scrollElement.current?.scrollTo({ top: 0 })} />}
      </Box>
    </Box>
  )
}

export function RecherchePageComponent(props: { rechercheParams: IRecherchePageParams }) {
  const rechercheResult = useRechercheResults(props.rechercheParams)
  if (rechercheResult.status === "disabled") {
    return (
      <>
        <Box role="main" tabIndex={-1} component="main" id="search-content-container">
          <RecherchePageEmpty {...props} />
        </Box>
        <Footer />
      </>
    )
  }
  return (
    <Box role="main" component="main">
      <RecherchePageComponentWithParams {...props} />
    </Box>
  )
}
