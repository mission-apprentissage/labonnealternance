import { LBA_ITEM_TYPE } from "shared/constants/lbaiten"

const getJobAddress = (job) => {
  if (job.ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) return <>{job.place.fullAddress}</>
  else return job.place.fullAddress
}

export { getJobAddress }
