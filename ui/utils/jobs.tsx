import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

const getJobAddress = (job) => {
  if (job.ideaType === LBA_ITEM_TYPE_OLD.PE) return <>{job.place.fullAddress}</>
  else return job.place.fullAddress
}

export { getJobAddress }
