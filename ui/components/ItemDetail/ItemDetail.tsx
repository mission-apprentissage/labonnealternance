import { assertUnreachable } from "@/../shared"
import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useContext, useState } from "react"
import { useQuery } from "react-query"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import fetchFtJobDetails from "@/services/fetchFtJobDetails"
import fetchLbaCompanyDetails from "@/services/fetchLbaCompanyDetails"
import fetchLbaJobDetails from "@/services/fetchLbaJobDetails"
import { ApiError } from "@/utils/api.utils"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { fetchTrainingDetails } from "../../services/fetchTrainingDetails"
import ErrorMessage from "../ErrorMessage"

import getActualTitle from "./ItemDetailServices/getActualTitle"
import { BuildSwipe, getNavigationButtons } from "./ItemDetailServices/getButtons"
import getSoustitre from "./ItemDetailServices/getSoustitre"
import getTags from "./ItemDetailServices/getTags"
import LoadedItemDetail from "./loadedItemDetail"

const getItemDetails = async ({ selectedItem, trainings, jobs, setTrainingsAndSelectedItem, setJobsAndSelectedItem, setHasError }) => {
  setHasError("")
  switch (selectedItem?.ideaType) {
    case LBA_ITEM_TYPE_OLD.FORMATION: {
      const trainingWithDetails = await fetchTrainingDetails(selectedItem)
      const updatedTrainings = trainings.map((v) => {
        if (v.id === trainingWithDetails.id) {
          trainingWithDetails.place.distance = v.place.distance
          return trainingWithDetails
        }
        return v
      })

      setTrainingsAndSelectedItem(updatedTrainings, trainingWithDetails)
      break
    }

    case LBA_ITEM_TYPE_OLD.MATCHA: {
      const jobWithDetails = await fetchLbaJobDetails(selectedItem)
      const updatedJobs = {
        peJobs: jobs.peJobs,
        lbaCompanies: jobs.lbaCompanies,
        matchas: jobs.matchas.map((v) => {
          if (v.id === jobWithDetails.id) {
            jobWithDetails.place.distance = v.place.distance
            return jobWithDetails
          }
          return v
        }),
      }

      setJobsAndSelectedItem(updatedJobs, jobWithDetails)
      break
    }

    case LBA_ITEM_TYPE_OLD.LBA: {
      const companyWithDetails = await fetchLbaCompanyDetails(selectedItem)
      const updatedJobs = {
        peJobs: jobs.peJobs,
        lbaCompanies: jobs.lbaCompanies.map((v) => {
          if (v.id === companyWithDetails.id) {
            companyWithDetails.place.distance = v.place.distance
            return companyWithDetails
          }
          return v
        }),
        matchas: jobs.matchas,
      }

      setJobsAndSelectedItem(updatedJobs, companyWithDetails)
      break
    }

    case LBA_ITEM_TYPE_OLD.PEJOB: {
      const jobWithDetails = await fetchFtJobDetails(selectedItem)
      const updatedJobs = {
        peJobs: jobs.peJobs.map((v) => {
          if (v.id === jobWithDetails.id) {
            jobWithDetails.place.distance = v.place.distance
            return jobWithDetails
          }
          return v
        }),
        lbaCompanies: jobs.lbaCompanies,
        matchas: jobs.matchas,
      }

      setJobsAndSelectedItem(updatedJobs, jobWithDetails)
      break
    }

    default: {
      assertUnreachable("shouldNotHappen" as never)
    }
  }
}

const ItemDetail = ({ handleClose, handleSelectItem }) => {
  const { extendedSearch, jobs, selectedItem, setJobsAndSelectedItem, setTrainingsAndSelectedItem, trainings } = useContext(SearchResultContext)
  const { activeFilters } = useContext(DisplayContext)

  const kind = selectedItem?.ideaType

  const actualTitle = getActualTitle({ kind, selectedItem })

  const [hasError, setHasError] = useState<"not_found" | "unexpected" | "">("")

  const { swipeHandlers, goNext, goPrev } = BuildSwipe({ jobs, trainings, extendedSearch, activeFilters, selectedItem, handleSelectItem })
  const kindColor = kind !== LBA_ITEM_TYPE_OLD.FORMATION ? "pinksoft.600" : "greensoft.500"

  useQuery(["itemDetail", selectedItem.id], () => getItemDetails({ selectedItem, trainings, jobs, setTrainingsAndSelectedItem, setJobsAndSelectedItem, setHasError }), {
    enabled: !!selectedItem && !selectedItem.detailsLoaded,
    onError: (error: ApiError) => setHasError(error.isNotFoundError() ? "not_found" : "unexpected"),
  })

  return selectedItem?.detailsLoaded ? (
    <LoadedItemDetail handleClose={handleClose} handleSelectItem={handleSelectItem} />
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
        {hasError ? (
          <ErrorMessage message={hasError === "not_found" ? "Fiche introuvable" : "Une erreur s'est produite. Détail de la fiche momentanément indisponible"} />
        ) : (
          <Flex alignItems="center" m={4} color={kindColor}>
            Chargement des informations en cours
            <Spinner ml={3} />
          </Flex>
        )}
      </Box>
    </Box>
  )
}

export default ItemDetail
