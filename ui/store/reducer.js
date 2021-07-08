import { types as actionsTypes } from "./actions";

const initialState = {
  trainings: [],
  jobs: [],
  itemToScrollTo: null,
  selectedItem: null,
  formValues: null,
  extendedSearch: false,
  visiblePane: "resultList",
  currentPage: "",
  isFormVisible: true,
  hasSearch: false,
  shouldExecuteSearch: false,
  shouldMapBeVisible: false,
  widgetParameters: null,
  formParameters: null,
  itemParameters: null,
  selectedMapPopupItem: null,
};

const mainReducer = (state = initialState, action) => {
  //console.log("state : ", state);

  // deep copy arg state
  let state_copy = JSON.parse(JSON.stringify(state));
  let res = {};

  if (action.type === actionsTypes.SET_RESULTS) {
    res = {
      trainings: action.trainings,
      jobs: action.jobs,
    };
  } else if (action.type === actionsTypes.SET_TRAININGS) {
    res = {
      ...state_copy,
      trainings: action.trainings,
    };
  } else if (action.type === actionsTypes.SET_JOBS) {
    res = {
      ...state_copy,
      jobs: action.jobs,
    };
  } else if (action.type === actionsTypes.SET_SELECTED_ITEM) {
    res = {
      ...state_copy,
      selectedItem: action.selectedItem,
    };
  } else if (action.type === actionsTypes.SET_TRAININGS_AND_SELECTED_ITEM) {
    res = {
      ...state_copy,
      selectedItem: action.selectedItem,
      trainings: action.trainings,
    };
  } else if (action.type === actionsTypes.SET_ITEM_TO_SCROLL_TO) {
    res = {
      ...state_copy,
      itemToScrollTo: action.itemToScrollTo,
    };
  } else if (action.type === actionsTypes.SET_FORM_VALUES) {
    res = {
      ...state_copy,
      formValues: action.formValues,
    };
  } else if (action.type === actionsTypes.SET_EXTENDED_SEARCH) {
    res = {
      ...state_copy,
      extendedSearch: action.extendedSearch,
    };
  } else if (action.type === actionsTypes.SET_VISIBLE_PANE) {
    res = {
      ...state_copy,
      visiblePane: action.visiblePane,
    };
  } else if (action.type === actionsTypes.SET_CURRENT_PAGE) {
    res = {
      ...state_copy,
      currentPage: action.currentPage,
    };
  } else if (action.type === actionsTypes.SET_HAS_SEARCH) {
    res = {
      ...state_copy,
      hasSearch: action.hasSearch,
    };
  } else if (action.type === actionsTypes.SET_IS_FORM_VISIBLE) {
    res = {
      ...state_copy,
      isFormVisible: action.isFormVisible,
    };
  } else if (action.type === actionsTypes.SET_SHOULD_EXECUTE_SEARCH) {
    res = {
      ...state_copy,
      shouldExecuteSearch: action.shouldExecuteSearch,
    };
  } else if (action.type === actionsTypes.SET_SHOULD_MAP_BE_VISIBLE) {
    res = {
      ...state_copy,
      shouldMapBeVisible: action.shouldMapBeVisible,
    };
  } else if (action.type === actionsTypes.SET_WIDGET_PARAMETERS) {
    res = {
      ...state_copy,
      widgetParameters: action.widgetParameters,
    };
  } else if (action.type === actionsTypes.SET_FORM_PARAMETERS) {
    res = {
      ...state_copy,
      formParameters: action.formParameters,
    };
  } else if (action.type === actionsTypes.SET_ITEM_PARAMETERS) {
    res = {
      ...state_copy,
      itemParameters: action.itemParameters,
    };
  } else if (action.type === actionsTypes.SET_SELECTED_MAP_POPUP_ITEM) {
    res = {
      ...state_copy,
      selectedMapPopupItem: action.selectedMapPopupItem,
    };
  } else {
    res = state_copy;
  }

  return res;
};

export { mainReducer, initialState };
