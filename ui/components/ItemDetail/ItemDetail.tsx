import { assertUnreachable } from "@/../shared"
import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useContext } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import fetchTrainingDetails from "../../services/fetchTrainingDetails"

import getActualTitle from "./ItemDetailServices/getActualTitle"
import { BuildSwipe, getNavigationButtons } from "./ItemDetailServices/getButtons"
import getCurrentList from "./ItemDetailServices/getCurrentList"
import getSoustitre from "./ItemDetailServices/getSoustitre"
import getTags from "./ItemDetailServices/getTags"
import LoadedItemDetail from "./loadedItemDetail"

const getItemDetails = async ({ selectedItem, trainings, /*jobs,*/ setTrainingsAndSelectedItem }) => {
  switch (selectedItem?.ideaType) {
    case LBA_ITEM_TYPE_OLD.FORMATION: {
      const trainingWithDetails = await fetchTrainingDetails(selectedItem)
      trainingWithDetails.detailsLoaded = true
      const updatedTrainings = trainings.map((v) => {
        if (v.id === trainingWithDetails.id) {
          return trainingWithDetails
        }
        return v
      })

      setTrainingsAndSelectedItem(updatedTrainings, trainingWithDetails)
      break
    }

    default: {
      assertUnreachable("shouldNotHappen" as never)
    }
  }
}

const ItemDetail = ({ selectedItem, handleClose, handleSelectItem }) => {
  const kind: LBA_ITEM_TYPE_OLD = selectedItem?.ideaType

  const actualTitle = getActualTitle({ kind, selectedItem })
  const { activeFilters } = useContext(DisplayContext)

  // @ts-expect-error: TODO not defined in context
  const { trainings, setTrainingsAndSelectedItem, jobs, extendedSearch } = useContext(SearchResultContext)
  const currentList = getCurrentList({ store: { trainings, jobs }, activeFilters, extendedSearch })

  const { swipeHandlers, goNext, goPrev } = BuildSwipe({ currentList, handleSelectItem, selectedItem })
  const kindColor = kind !== LBA_ITEM_TYPE_OLD.FORMATION ? "pinksoft.600" : "greensoft.500"

  useQuery(["itemDetail", selectedItem.id], () => getItemDetails({ selectedItem, trainings, /*jobs,*/ setTrainingsAndSelectedItem }), {
    enabled: !!selectedItem && !selectedItem.detailsLoaded,
  })

  return selectedItem?.detailsLoaded ? (
    <LoadedItemDetail selectedItem={selectedItem} handleClose={handleClose} handleSelectItem={handleSelectItem} />
  ) : (
    <Box
      as="section"
      display={selectedItem ? "block" : "none"}
      height="100%"
      id="itemDetailColumn"
      sx={{
        overflowY: "auto",
        position: "relative",
      }}
      {...swipeHandlers}
    >
      <Box
        as="header"
        sx={{
          filter: "drop-shadow(0px 4px 4px rgba(213, 213, 213, 0.25))",
          padding: "10px 20px 0px 10px",
        }}
        background="white"
      >
        <Box width="100%" pl={["0", 4]} pb={2}>
          <Flex mb={2} justifyContent="flex-end">
            {getTags({ kind, isCfa: false, isMandataire: false })}
            {getNavigationButtons({ goPrev, goNext, handleClose })}
          </Flex>

          <Text
            as="h1"
            fontSize="28px"
            color={kindColor}
            sx={{
              fontWeight: 700,
              marginBottom: "11px",
              paddingBottom: "0",
              textAlign: "left",
              wordBreak: "break-word",
            }}
          >
            {actualTitle || ""}
          </Text>

          {getSoustitre({ selectedItem })}
        </Box>
      </Box>
      <Box>
        <Flex alignItems="center" m={4} color={kindColor}>
          Chargement des informations en cours
          <Spinner ml={3} />
        </Flex>
      </Box>
    </Box>
  )
}

export default ItemDetail
