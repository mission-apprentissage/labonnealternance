import React from "react";

const getJobAddress = (job) => {
  if (job.ideaType === "peJob")
    return (
      <>
        {job.place.fullAddress}
      </>
    );
  else return job.place.fullAddress;
};

export { getJobAddress };
