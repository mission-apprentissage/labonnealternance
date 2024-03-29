import { factorInternalJobsForMap, factorPartnerJobsForMap, factorTrainingsForMap, layerType, setJobMarkers, setTrainingMarkers } from "../../../utils/mapTools"

export const storeTrainingsInSession = ({ trainings, searchTimestamp }) => {
  try {
    trimSessionStorage()
    const search = JSON.parse(sessionStorage.getItem(searchTimestamp))
    sessionStorage.setItem(searchTimestamp, JSON.stringify({ trainings, ...search }))
  } catch (err) {
    console.error("sessionStorage error : ", err)
  }
}

export const storeJobsInSession = ({ jobs, searchTimestamp }) => {
  try {
    //TODO ICI amender l'existant
    trimSessionStorage()
    const search = JSON.parse(sessionStorage.getItem(searchTimestamp))
    sessionStorage.setItem(searchTimestamp, JSON.stringify({ jobs, ...search }))
  } catch (err) {
    console.error("sessionStorage error : ", err)
  }
}

const trimSessionStorage = () => {
  let oldest = 0

  for (let i = 0, l = sessionStorage.length; i < l; ++i) {
    const currentKey = parseInt(sessionStorage.key(i))
    if (!oldest || currentKey < oldest) {
      oldest = currentKey
    }
  }

  if (oldest) {
    sessionStorage.removeItem(`${oldest}`)
  }
}

export const restoreSearchFromSession = ({ searchTimestamp, setTrainings, setJobs }) => {
  const search = JSON.parse(sessionStorage.getItem(searchTimestamp))

  if (search?.jobs) {
    setJobs(search.jobs)
    setJobMarkers({ jobList: factorInternalJobsForMap(search.jobs), type: layerType.INTERNAL, hasTrainings: search?.trainings })
    setJobMarkers({ jobList: factorPartnerJobsForMap(search.jobs), type: layerType.PARTNER, hasTrainings: search?.trainings })
  }

  if (search?.trainings) {
    setTrainings(search.trainings)
    setTrainingMarkers({ trainingList: factorTrainingsForMap(search.trainings) })
  }
}
