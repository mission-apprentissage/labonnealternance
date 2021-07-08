export const types = {
  SET_RESULTS: "training/SET_RESULTS",
  SET_TRAININGS: "trainings/SET_TRAININGS",
  SET_JOBS: "trainings/SET_JOBS",
  SET_SELECTED_ITEM: "trainings/SET_SELECTED_ITEM",
  SET_ITEM_TO_SCROLL_TO: "trainings/SET_ITEM_TO_SCROLL_TO",
  SET_FORM_VALUES: "trainings/SET_FORM_VALUES",
  SET_EXTENDED_SEARCH: "trainings/SET_EXTENDED_SEARCH",
  SET_VISIBLE_PANE: "trainings/SET_VISIBLE_PANE",
  SET_CURRENT_PAGE: "trainings/SET_CURRENT_PAGE",
  SET_HAS_SEARCH: "trainings/SET_HAS_SEARCH",
  SET_IS_FORM_VISIBLE: "trainings/SET_IS_FORM_VISIBLE",
  SET_SHOULD_EXECUTE_SEARCH: "trainings/SET_SHOULD_EXECUTE_SEARCH",
  SET_SHOULD_MAP_BE_VISIBLE: "trainings/SET_SHOULD_MAP_BE_VISIBLE",
  SET_WIDGET_PARAMETERS: "trainings/SET_WIDGET_PARAMETERS",
  SET_FORM_PARAMETERS: "trainings/SET_FORM_PARAMETERS",
  SET_ITEM_PARAMETERS: "trainings/SET_ITEM_PARAMETERS",
  SET_TRAININGS_AND_SELECTED_ITEM: "trainings/SET_TRAININGS_AND_SELECTED_ITEM",
  SET_SELECTED_MAP_POPUP_ITEM: "trainings/SET_SELECTED_MAP_POPUP_ITEM",
};

export const setResults = (trainings = [], jobs = []) => {
  return {
    type: types.SET_RESULTS,
    trainings,
    jobs,
  };
};

export const setTrainings = (trainings = []) => {
  return {
    type: types.SET_TRAININGS,
    trainings,
  };
};

export const setJobs = (jobs = []) => {
  return {
    type: types.SET_JOBS,
    jobs,
  };
};

export const setSelectedItem = (selectedItem = null) => {
  return {
    type: types.SET_SELECTED_ITEM,
    selectedItem,
  };
};

export const setSelectedMapPopupItem = (selectedMapPopupItem = null) => {
  return {
    type: types.SET_SELECTED_MAP_POPUP_ITEM,
    selectedMapPopupItem,
  };
};

export const setTrainingsAndSelectedItem = (trainings = [], selectedItem = null) => {
  return {
    type: types.SET_TRAININGS_AND_SELECTED_ITEM,
    selectedItem,
    trainings,
  };
};

export const setItemToScrollTo = (itemToScrollTo = null) => {
  return {
    type: types.SET_ITEM_TO_SCROLL_TO,
    itemToScrollTo,
  };
};

export const setFormValues = (formValues = null) => {
  return {
    type: types.SET_FORM_VALUES,
    formValues,
  };
};

export const setExtendedSearch = (extendedSearch = false) => {
  return {
    type: types.SET_EXTENDED_SEARCH,
    extendedSearch,
  };
};

export const setVisiblePane = (visiblePane = "resultList") => {
  return {
    type: types.SET_VISIBLE_PANE,
    visiblePane,
  };
};

export const setCurrentPage = (currentPage = "") => {
  return {
    type: types.SET_CURRENT_PAGE,
    currentPage,
  };
};

export const setHasSearch = (hasSearch = false) => {
  return {
    type: types.SET_HAS_SEARCH,
    hasSearch,
  };
};

export const setIsFormVisible = (isFormVisible = true) => {
  return {
    type: types.SET_IS_FORM_VISIBLE,
    isFormVisible,
  };
};

export const setShouldExecuteSearch = (shouldExecuteSearch = true) => {
  return {
    type: types.SET_SHOULD_EXECUTE_SEARCH,
    shouldExecuteSearch,
  };
};

export const setShouldMapBeVisible = (shouldMapBeVisible = false) => {
  return {
    type: types.SET_SHOULD_MAP_BE_VISIBLE,
    shouldMapBeVisible,
  };
};

export const setWidgetParameters = (widgetParameters = true) => {
  return {
    type: types.SET_WIDGET_PARAMETERS,
    widgetParameters,
  };
};

export const setFormParameters = (formParameters = true) => {
  console.log("EET ALOR ,",formParameters);
  return {
    type: types.SET_FORM_PARAMETERS,
    formParameters,
  };
};

export const setItemParameters = (itemParameters = true) => {
  return {
    type: types.SET_ITEM_PARAMETERS,
    itemParameters,
  };
};
