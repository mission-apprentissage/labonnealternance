import axios from "axios";
import { logError } from "utils/tools";

import {
  trainingsApi,
  trainingErrorText,
  getRomeFromParameters,
  getRncpsFromParameters,
} from "components/SearchForTrainingsAndJobs/services/utils";
import { storeTrainingsInSession } from "./handleSessionStorage";

export const searchForTrainingsFunction = async ({
  values,
  searchTimestamp,
  dispatch,
  setIsTrainingSearchLoading,
  setTrainingSearchError,
  clearTrainings,
  setTrainings,
  setHasSearch,
  setIsFormVisible,
  setTrainingMarkers,
  factorTrainingsForMap,
  widgetParameters,
  followUpItem,
  selectFollowUpItem,
}) => {
  setIsTrainingSearchLoading(true);
  setTrainingSearchError("");
  clearTrainings();
  try {
    const response = await axios.get(trainingsApi, {
      params: {
        romes: getRomeFromParameters({ values, widgetParameters }),
        rncps: getRncpsFromParameters({ values, widgetParameters }),
        longitude: values.location.value.coordinates[0],
        latitude: values.location.value.coordinates[1],
        radius: values.radius || 30,
        diploma: values.diploma,
      },
    });

    if (response.data.result === "error") {
      logError("Training Search Error", `${response.data.message}`);
      setTrainingSearchError(trainingErrorText);
    }

    dispatch(setTrainings(response.data.results));
    storeTrainingsInSession({ trainings: response.data.results, searchTimestamp });
    dispatch(setHasSearch(true));
    dispatch(setIsFormVisible(false));

    if (response.data.results.length) {
      setTrainingMarkers(factorTrainingsForMap(response.data.results));

      if (followUpItem?.parameters.type === "training") {
        selectFollowUpItem({
          itemId: followUpItem.parameters.itemId,
          type: followUpItem.parameters.type,
          trainings: response.data.results,
          formValues: values,
        });
      }
    }
  } catch (err) {
    console.log(
      `Erreur interne lors de la recherche de formations (${err.response ? err.response?.status : ""} : ${
        err?.response?.data ? err.response.data?.error : ""
      })`
    );
    logError("Training search error", err);
    setTrainingSearchError(trainingErrorText);
  }

  setIsTrainingSearchLoading(false);
};
