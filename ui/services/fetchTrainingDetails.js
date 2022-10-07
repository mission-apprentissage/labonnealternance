import axios from "axios";
import baseUrl from "../utils/baseUrl";
import _ from "lodash";
import { logError } from "../utils/tools";

export default async function fetchTrainingDetails(
  training,
  errorCallbackFn = _.noop,
  _baseUrl = baseUrl,
  _axios = axios,
  _window = window,
  _logError = logError
) {
  let res = null;

  if (!training) return res;

  const trainingsApi = `${_baseUrl}/api/v1/formations/formationDescription/${training.idRco}`;
  const response = await _axios.get(trainingsApi);

  const isAxiosError = !!_.get(response, "data.error");
  const isSimulatedError = _.includes(_.get(_window, "location.href", ""), "trainingDetailError=true");

  const isError = isAxiosError || isSimulatedError;

  if (isError) {
    errorCallbackFn();
    if (isAxiosError) {
      _logError("Training detail API error", `Training detail API error ${response.data.error}`);
    } else if (isSimulatedError) {
      _logError("Training detail API error simulated with a query param :)");
    }
  } else {
    res = response.data;
  }

  return res;
}
