import { Box } from "@chakra-ui/react"
import React from "react"

import Job from "../../ItemDetail/Job"
import LbaRecruteur from "../../ItemDetail/LbaRecruteur"
import Training from "../../ItemDetail/Training"

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
    return <LbaRecruteur key={idx} company={company} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
  }
}
