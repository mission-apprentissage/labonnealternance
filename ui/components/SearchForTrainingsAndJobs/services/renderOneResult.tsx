import React from "react"

import Job from "../../ItemDetail/Job"
import RecruteurLba from "../../ItemDetail/RecruteurLbaComponents/RecruteurLba"
import Training from "../../ItemDetail/Training"

export const renderJob = (idx, job, handleSelectItem, searchForTrainingsOnNewCenter) => {
  return <Job key={idx} job={job} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
}
export const renderTraining = (idx, training, handleSelectItem, searchForJobsOnNewCenter, isCfa) => {
  return <Training key={idx} training={training} handleSelectItem={handleSelectItem} searchForJobsOnNewCenter={searchForJobsOnNewCenter} isCfa={isCfa} />
}
export const renderLbb = (idx, company, handleSelectItem, searchForTrainingsOnNewCenter) => {
  return <RecruteurLba key={idx} company={company} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
}
