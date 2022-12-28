import React from "react"
import Training from "../../../components/ItemDetail/Training"
import Job from "../../../components/ItemDetail/Job"
import LbbCompany from "../../../components/ItemDetail/LbbCompany"
import { Box } from "@chakra-ui/react"

export const renderJob = (isTestMode, idx, job, handleSelectItem, searchForTrainingsOnNewCenter) => {
  if (isTestMode) {
    return <Box key={idx} data-testid={`Job-${job?.id}`}></Box>
  } else {
    return <Job key={idx} job={job} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
  }
}
export const renderTraining = (isTestMode, idx, training, handleSelectItem, searchForJobsOnNewCenter, isCfa) => {
  if (isTestMode) {
    return <Box key={idx} data-testid={`Training-${training?.id}`}></Box>
  } else {
    return <Training key={idx} training={training} handleSelectItem={handleSelectItem} searchForJobsOnNewCenter={searchForJobsOnNewCenter} isCfa={isCfa} />
  }
}
export const renderLbb = (isTestMode, idx, company, handleSelectItem, searchForTrainingsOnNewCenter) => {
  if (isTestMode) {
    return <Box key={idx} data-testid={`LbbCompany-${company?.id}`}></Box>
  } else {
    return <LbbCompany key={idx} company={company} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
  }
}
