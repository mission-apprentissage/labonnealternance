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
import { RecherchePageHome } from "@/app/(candidat)/recherche/_components/RechercheResultats/RecherchePageHome"
import { RechercheResultatsList } from "@/app/(candidat)/recherche/_components/RechercheResultats/RechercheResultatsList"
import { VirtualContainer } from "@/app/(candidat)/recherche/_components/RechercheResultats/VirtualContainer"
import { useRechercheResults } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { IRecherchePageParams, isItemReferenceInList } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

function RecherchePageComponentWithParams(props: { params: IRecherchePageParams }) {
  const { displayMap, displayMobileForm, activeItems = [] } = props.params
  const scrollElement = useRef<HTMLElement>(null)
  const rechercheResult = useRechercheResults(props.params)

  const elements = [
    {
      height: 122,
      render: () => <CandidatRechercheFilters params={props.params} />,
    },
    ...RechercheResultatsList(props),
  ] satisfies Parameters<typeof VirtualContainer>[0]["elements"]

  if (displayMobileForm) {
    return <RechercheMobileFormUpdate params={props.params} />
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
            md: "row",
          },
        }}
      >
        <VirtualContainer
          ref={scrollElement}
          defaultHeight={270}
          elements={elements}
          scrollToElementIndex={scolledElementIndex}
          parentStyle={{
            ...(displayMap ? { display: { xs: "none", md: "block" } } : {}),
          }}
        />
        {displayMap ? <RechercheCarte item={null} variant="recherche" {...props} /> : <></>}
        <Box
          sx={{
            padding: fr.spacing("2w"),
            margin: "auto",
            display: {
              xs: "block",
              md: "none",
            },
          }}
        >
          <RechercheMobileToggleMapButton displayMap={displayMap} params={props.params} />
        </Box>
        {rechercheResult.status === "success" && <RechercheBackToTopButton onClick={() => scrollElement.current?.scrollTo({ top: 0 })} />}
      </Box>
    </Box>
  )
}

export function RecherchePageComponent(props: { params: IRecherchePageParams }) {
  const rechercheResult = useRechercheResults(props.params)
  if (rechercheResult.status === "idle") {
    return <RecherchePageHome {...props} />
  }
  return <RecherchePageComponentWithParams {...props} />
}
