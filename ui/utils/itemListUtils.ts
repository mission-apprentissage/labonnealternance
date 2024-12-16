import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

// retourne les offres issues du dépôt d'offre simplifié (ex Matcha) triées par ordre croissant de distance au centre de recherche
// suivi des offres partner job triées par ordre croissant de distance au centre de recherche.
// suivi des offres France travail triées par ordre croissant de distance au centre de recherche.
export const mergeJobs = ({ jobs, activeFilters }) => {
  let mergedArray = []

  if (jobs) {
    mergedArray = mergedArray
      .concat(sortMergedSources(jobs?.matchas?.length ? jobs.matchas.filter((job) => (activeFilters.includes("duo") ? true : !job.company.mandataire)) : []))
      .concat(sortMergedSources(jobs.partnerJobs))
      .concat(sortMergedSources(jobs.peJobs))
  }

  return mergedArray
}

// fusionne les résultats lbb et lba et les trie par ordre croissant de distance, optionnellement intègre aussi les offres France travail et LBA
export const mergeOpportunities = ({ jobs, onlyLbbLbaCompanies = undefined, activeFilters }) => {
  let mergedArray = []
  if (jobs) {
    const sources = [jobs.lbaCompanies]
    if (!onlyLbbLbaCompanies) {
      sources.push(jobs.peJobs)
      sources.push(jobs.partnerJobs)
      sources.push(activeFilters.includes("duo") ? jobs?.matchas : jobs?.matchas?.filter((job) => !job.company.mandataire))
    }

    mergedArray = concatSources(sources)
    mergedArray = sortMergedSources(mergedArray)
  }

  return mergedArray
}

const concatSources = (sources) => {
  let resultArray = []

  sources.map((source) => {
    if (source && source.length) {
      resultArray = resultArray.concat(source)
    }
  })

  return resultArray
}

const sortMergedSources = (mergedArray) => {
  if (!mergedArray?.length) {
    return []
  }

  return mergedArray.sort((a, b) => {
    const dA = a.place.distance
    const dB = b.place.distance

    if (a.ideaType === LBA_ITEM_TYPE_OLD.PEJOB && isDepartmentJob(a)) {
      return 1
    }
    if (dA > dB) {
      return 1
    }
    if (dA < dB) {
      return -1
    }
    return 0
  })
}

// détermine si l'offre France travail est liée au département avec une géoloc non précisée
export const isDepartmentJob = (job) => {
  let isDepartmentJob = false
  if (job.place.distance == null && (!job.place.zipCode || job.place.zipCode.substring(0, 2) === job.place.city.substring(0, 2))) {
    isDepartmentJob = true
  }

  return isDepartmentJob
}
