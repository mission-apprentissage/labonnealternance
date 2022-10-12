import React from "react";
import { logError } from "utils/tools";

const SimulatedError = (props) => {
  try {
    throw new Error("simulated error 1 ...");
  } catch (error) {
    logError("Test", error);
  }

  throw new Error("simulated error 2 ...");

  return <div>Passed</div>;
};
export default SimulatedError;
