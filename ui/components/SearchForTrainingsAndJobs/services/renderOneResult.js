import React from "react"
import Training from "../../../components/ItemDetail/Training"
import Job from "../../../components/ItemDetail/Job"
import LbbCompany from "../../../components/ItemDetail/LbbCompany"

export const renderJob = (isTestMode, idx, job, handleSelectItem, searchForJobsOnNewCenter) => {
  if (isTestMode) {
    return <div key={idx} data-testid={`Job-${job?.id}`}></div>
  } else {
    return <Job key={idx} job={job} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForJobsOnNewCenter} />
  }
}
export const renderTraining = (isTestMode, idx, training, handleSelectItem, searchForJobsOnNewCenter, hasAlsoJob, isCfa) => {
  if (isTestMode) {
    return <div key={idx} data-testid={`Training-${training?.id}`}></div>
  } else {
    return <Training key={idx} training={training} handleSelectItem={handleSelectItem} searchForJobsOnNewCenter={searchForJobsOnNewCenter} hasAlsoJob={hasAlsoJob} isCfa={isCfa} />
  }
}
export const renderLbb = (isTestMode, idx, company, handleSelectItem, searchForTrainingsOnNewCenter) => {
  if (isTestMode) {
    return <div key={idx} data-testid={`LbbCompany-${company?.id}`}></div>
  } else {
    return <LbbCompany key={idx} company={company} handleSelectItem={handleSelectItem} searchForTrainingsOnNewCenter={searchForTrainingsOnNewCenter} />
  }
}
