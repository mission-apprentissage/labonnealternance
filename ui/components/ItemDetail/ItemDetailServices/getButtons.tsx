import { Box, Button, Image } from "@chakra-ui/react"
import { useSwipeable } from "react-swipeable"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import getCurrentList from "./getCurrentList"

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

export const buttonJePostuleShouldBeDisplayed = (item) => {
  return item.ideaType === LBA_ITEM_TYPE_OLD.PEJOB && item?.url
}

/**
 * Display RDV button if "rdvContext" is present in the item.
 */
export const buttonRdvShouldBeDisplayed = (item) => !!item?.rdvContext?.form_url

export const BuildSwipe = ({ jobs, trainings, extendedSearch, activeFilters, selectedItem, handleSelectItem }) => {
  // See https://www.npmjs.com/package/react-swipeable
  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      const currentList = getCurrentList({ jobs, trainings, extendedSearch, activeFilters })
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
    const currentList = getCurrentList({ jobs, trainings, extendedSearch, activeFilters })
    const currentIndex = currentList.findIndex((item) => selectedItem.id === item.id)

    const nextIndex = currentIndex == currentList.length - 1 ? 0 : currentIndex + 1

    handleSelectItem(currentList[nextIndex])
  }
  const goPrev = () => {
    const currentList = getCurrentList({ jobs, trainings, extendedSearch, activeFilters })
    const currentIndex = currentList.findIndex((item) => selectedItem.id === item.id)
    const prevIndex = currentIndex == 0 ? currentList.length - 1 : currentIndex - 1

    handleSelectItem(currentList[prevIndex])
  }
  return {
    swipeHandlers,
    goNext,
    goPrev,
  }
}

export const getNavigationButtons = ({ goPrev, goNext, handleClose }) => {
  return (
    <>
      <Box>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            goPrev()
          }}
          data-testid="previous-button"
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
          data-testid="next-button"
        >
          <Image width="30px" height="30px" src="/images/chevronright.svg" alt="Résultat suivant" />
        </Button>
      </Box>
      <Box ml={2}>
        <Button
          {...navigationButtonProperties}
          onClick={() => {
            handleClose()
          }}
          data-testid="close-detail-button"
        >
          <Image width="30px" height="30px" src="/images/close.svg" alt="Fermer la fenêtre" />
        </Button>
      </Box>
    </>
  )
}
