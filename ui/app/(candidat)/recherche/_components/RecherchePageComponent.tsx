"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useRef } from "react"

import { CandidatRechercheFilters } from "@/app/(candidat)/recherche/_components/CandidatRechercheFilters"
import { RechercheBackToTopButton } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheBackToTopButton"
import { RechercheHeader } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheHeader"
import { RechercheCarte } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMap"
import { RechercheMobileFormUpdate } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMobileFormUpdate"
import { RechercheMobileToggleMapButton } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheMobileToggleMapButton"
import { RecherchePageEmpty } from "@/app/(candidat)/recherche/_components/RechercheResultats/RecherchePageEmpty"
import { RechercheResultatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResultatsList"
import { VirtualContainer } from "@/app/(candidat)/recherche/_components/RechercheResultats/VirtualContainer"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { IRecherchePageParams, isItemReferenceInList } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

function RecherchePageComponentWithParams(props: { rechercheParams: IRecherchePageParams }) {
  const { displayMap, displayMobileForm, activeItems = [] } = props.rechercheParams
  const scrollElement = useRef<HTMLElement>(null)
  const rechercheResult = useRechercheResults(props.rechercheParams)

  const elements = [
    {
      height: 122,
      render: () => <CandidatRechercheFilters rechercheParams={props.rechercheParams} />,
    },
    ...RechercheResultatsList(props),
  ] satisfies Parameters<typeof VirtualContainer>[0]["elements"]

  if (displayMobileForm) {
    return <RechercheMobileFormUpdate rechercheParams={props.rechercheParams} />
  }

  const scolledElementIndex = elements.findIndex((element) => "item" in element && element.item.ideaType !== "whisper" && isItemReferenceInList(element.item, activeItems))

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
    return <RecherchePageEmpty {...props} />
  }
  return <RecherchePageComponentWithParams {...props} />
}
