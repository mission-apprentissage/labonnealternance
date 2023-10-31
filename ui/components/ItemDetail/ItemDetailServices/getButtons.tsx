import { Box, Button, Image, Link } from "@chakra-ui/react"
import { findIndex } from "lodash"
import React from "react"
import { useSwipeable } from "react-swipeable"

import { SendPlausibleEvent } from "../../../utils/plausible"

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

/**
 * Display RDV button if "rdvContext" is present in the item.
 */
export const buttonRdvShouldBeDisplayed = (item) => !!item?.rdvContext?.form_url

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
    const currentIndex = findIndex(currentList, selectedItem)
    const nextIndex = currentIndex == currentList.length - 1 ? 0 : currentIndex + 1
    handleSelectItem(currentList[nextIndex])
  }
  const goPrev = () => {
    const currentIndex = findIndex(currentList, selectedItem)
    const prevIndex = currentIndex == 0 ? currentList.length - 1 : currentIndex - 1
    handleSelectItem(currentList[prevIndex])
  }
  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}

export const getNavigationButtons = ({
  goPrev,
  goNext,
  setSeeInfo = (t) => {
    console.log(t)
  },
  handleClose,
}) => {
  return (
    <>
      <Box>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            goPrev()
          }}
        >
          <Image width="30px" height="30px" src="/images/chevronleft.svg" alt="Résultat précédent" />
        </Button>
      </Box>
      <Box ml={2}>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            goNext()
          }}
        >
          <Image width="30px" height="30px" src="/images/chevronright.svg" alt="Résultat suivant" />
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
          <Image width="30px" height="30px" src="/images/close.svg" alt="Fermer la fenêtre" />
        </Button>
      </Box>
    </>
  )
}
