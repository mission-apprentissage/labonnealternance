// retourne les offres issues du dépôt d'offre simplifié (ex Matcha) triées par ordre croissant de distance au centre de recherche
// suivi des offres pe triées par ordre croissant de distance au centre de recherche.
export const mergeJobs = (jobs) => {
  let mergedArray = []

  if (jobs) {
    if (jobs.matchas && jobs.matchas.length) {
      mergedArray = mergedArray.concat(sortMergedSources(jobs.matchas))
    }
    if (jobs.peJobs && jobs.peJobs.length) {
      mergedArray = mergedArray.concat(sortMergedSources(jobs.peJobs))
    }
  }

  return mergedArray
}

// fusionne les résultats lbb et lba et les trie par ordre croissant de distance, optionnellement intègre aussi les offres PE et matchas
export const mergeOpportunities = (jobs, onlyLbbLbaCompanies) => {
  let mergedArray = []
  if (jobs) {
    let sources = [jobs.lbbCompanies, jobs.lbaCompanies]
    if (!onlyLbbLbaCompanies) {
      sources.push(jobs.peJobs)
      sources.push(jobs.matchas)
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
  mergedArray.sort((a, b) => {
    let dA = a.place.distance
    let dB = b.place.distance

    if (a.ideaType === "peJob" && isDepartmentJob(a)) {
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

  return mergedArray
}

// détermine si l'offre pe est liée au département avec une géoloc non précisée
export const isDepartmentJob = (job) => {
  let isDepartmentJob = false
  if (!job.place.distance && (!job.place.zipCode || job.place.zipCode.substring(0, 2) === job.place.city.substring(0, 2))) {
    isDepartmentJob = true
  }

  return isDepartmentJob
}
