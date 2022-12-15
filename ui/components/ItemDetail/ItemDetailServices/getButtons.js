import React from "react"
import { findIndex } from "lodash"
import { useSwipeable } from "react-swipeable"

import chevronLeft from "../../../public/images/chevronleft.svg"
import chevronRight from "../../../public/images/chevronright.svg"
import chevronClose from "../../../public/images/close.svg"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { Box, Button, Image, Link } from "@chakra-ui/react"

const navigationButtonProperties = {
  background: "white",
  border: "none",
  padding: "0",
  width: "30px",
  height: "30px",
  minWidth: "30px",
  _hover: {
    background: "white",
  },
  _active: {
    background: "white",
  },
}

export const buttonJePostuleShouldBeDisplayed = (oneKind, oneItem) => {
  return oneKind === "peJob" && oneItem?.url
}

export const buttonPRDVShouldBeDisplayed = (oneItem) => {
  let res = !!oneItem?.prdvUrl
  return res
}

export const buildPrdvButton = (training) => {
  const onClickPrdv = () => {
    SendPlausibleEvent("Clic Prendre RDV - Fiche formation", { info_fiche: training.cleMinistereEducatif })
  }

  return (
    <Box
      className="widget-prdv"
      data-referrer="lba"
      data-id-cle-ministere-educatif={training.cleMinistereEducatif}
      data-id-rco-formation={training.idRcoFormation}
      onClick={onClickPrdv}
    >
      <Link variant="postuler" isExternal href={training.prdvUrl}>
        Je prends rendez-vous
      </Link>
    </Box>
  )
}

export const BuildSwipe = ({ currentList, handleSelectItem, selectedItem }) => {
  // See https://www.npmjs.com/package/react-swipeable
  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      if (event_data.dir === "Right") {
        if (currentList.length > 1) {
          goPrev()
        }
      } else if (event_data.dir === "Left") {
        if (currentList.length > 1) {
          goNext()
        }
      }
    },
  })
  const goNext = () => {
    let currentIndex = findIndex(currentList, selectedItem)
    let nextIndex = currentIndex == currentList.length - 1 ? 0 : currentIndex + 1
    handleSelectItem(currentList[nextIndex])
  }
  const goPrev = () => {
    let currentIndex = findIndex(currentList, selectedItem)
    let prevIndex = currentIndex == 0 ? currentList.length - 1 : currentIndex - 1
    handleSelectItem(currentList[prevIndex])
  }
  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}

export const getNavigationButtons = ({ goPrev, goNext, setSeeInfo, handleClose }) => {
  return (
    <>
      <Box>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            goPrev()
          }}
        >
          <Image width="30px" height="30px" src={chevronLeft} alt="Résultat précédent" />
        </Button>
      </Box>
      <Box ml={2}>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            goNext()
          }}
        >
          <Image width="30px" height="30px" src={chevronRight} alt="Résultat suivant" />
        </Button>
      </Box>
      <Box ml={2}>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            setSeeInfo(false)
            handleClose()
          }}
        >
          <Image width="30px" height="30px" src={chevronClose} alt="Fermer la fenêtre" />
        </Button>
      </Box>
    </>
  )
}
