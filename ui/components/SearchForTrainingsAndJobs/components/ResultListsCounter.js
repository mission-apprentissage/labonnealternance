import React from "react"
import { Spinner } from "reactstrap"
import FilterButton from "./FilterButton"
import purpleFilterIcon from "../../../public/images/icons/purpleFilter.svg"

const ResultListsCounter = (props) => {
  const scopeContext = props.scopeContext
  const filterButtonClicked = props.filterButtonClicked
  const displayCount = props.displayCount
  const getJobCount = props.getJobCount
  const allJobSearchError = props.allJobSearchError
  const trainingSearchError = props.trainingSearchError
  const isTrainingSearchLoading = props.isTrainingSearchLoading
  const isJobSearchLoading = props.isJobSearchLoading
  const jobs = props.jobs
  const trainings = props.trainings
  const activeFilter = props.activeFilter
  const showSearchForm = props.showSearchForm

  if (allJobSearchError && trainingSearchError) return ""

  let count = 0

  let jobPart = ""
  let jobLoading = ""
  let jobCount = 0

  if (scopeContext.isJob) {
    if (isJobSearchLoading) {
      jobLoading = (
        <span className="jobColor">
          <div className="searchLoading">
            Recherche des entreprises en cours
            <Spinner />
          </div>
        </span>
      )
    } else if (!allJobSearchError) {
      jobCount = getJobCount(jobs)
      count += jobCount
      jobPart = `${jobCount === 0 ? "aucune entreprise" : jobCount}`

      if (jobCount === 1) {
        jobPart += " entreprise"
      } else if (jobCount > 1) {
        jobPart += " entreprises"
      }
    }
  }

  let trainingCount = 0
  let trainingPart = ""
  let trainingLoading = ""

  if (scopeContext.isTraining) {
    if (isTrainingSearchLoading) {
      trainingLoading = (
        <span className="trainingColor">
          <div className="searchLoading">
            Recherche des formations en cours
            <Spinner />
          </div>
        </span>
      )
    } else if (!trainingSearchError) {
      trainingCount = trainings ? trainings.length : 0

      count += trainingCount

      trainingPart = `${trainingCount === 0 ? "Aucune formation" : trainingCount}`

      if (trainingCount === 1) {
        trainingPart += " formation"
      } else if (trainingCount > 1) {
        trainingPart += " formations"
      }
    }
  }

  let correspondText = `${count === 0 ? " ne" : ""}${count <= 1 ? " correspond" : " correspondent"} à votre recherche`

  return (
    <div className="pt-0">
      <div className="resultTitle mt-0 mt-md-2">
        {trainingLoading ? (
          <>
            <br />
            <br />
            {trainingLoading}
          </>
        ) : (
          ""
        )}
        {jobLoading ? (
          <>
            <br />
            <br />
            {jobLoading}
          </>
        ) : (
          ""
        )}
      </div>

      <div className="c-filterzone mt-3">
        {!trainingLoading && !jobLoading && scopeContext.isJob && scopeContext.isTraining ? (
          <>
            <div className="c-filterbuttons-hint mr-3">Que souhaitez-vous voir ?</div>
            <div className="c-filterbuttons">
              <FilterButton type="all" count={jobCount + trainingCount} isActive={activeFilter === "all"} handleFilterButtonClicked={filterButtonClicked} />
              <FilterButton type="jobs" count={jobCount} isActive={activeFilter === "jobs"} handleFilterButtonClicked={filterButtonClicked} />
              <FilterButton type="trainings" count={trainingCount} isActive={activeFilter === "trainings"} handleFilterButtonClicked={filterButtonClicked} />
              <div className="c-resultlist-purplefilter" onClick={showSearchForm}>
                <img src={purpleFilterIcon} alt="Filtrer les résultats" />
              </div>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    </div>
  )
}

export default ResultListsCounter
