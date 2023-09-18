import React, { createContext, useReducer } from "react"

const initialState = {
  trainings: [],
  jobs: [],
  itemToScrollTo: null,
  selectedItem: null,
  extendedSearch: false,
  hasSearch: false,
  selectedMapPopupItem: null,
}

const actions = {
  SET_TRAININGS: "SET_TRAININGS",
  SET_JOBS: "SET_JOBS",
  SET_SELECTED_ITEM: "SET_SELECTED_ITEM",
  SET_ITEM_TO_SCROLL_TO: "SET_ITEM_TO_SCROLL_TO",
  SET_EXTENDED_SEARCH: "SET_EXTENDED_SEARCH",
  SET_HAS_SEARCH: "SET_HAS_SEARCH",
  SET_TRAININGS_AND_SELECTED_ITEM: "SET_TRAININGS_AND_SELECTED_ITEM",
  SET_SELECTED_MAP_POPUP_ITEM: "SET_SELECTED_MAP_POPUP_ITEM",
}

const reducer = (state, action) => {
  let state_copy = JSON.parse(JSON.stringify(state))

  switch (action.type) {
    case actions.SET_TRAININGS: {
      return { ...state_copy, trainings: action.trainings }
    }
    case actions.SET_JOBS: {
      return { ...state_copy, jobs: action.jobs }
    }
    case actions.SET_SELECTED_ITEM: {
      return { ...state_copy, selectedItem: action.selectedItem }
    }
    case actions.SET_TRAININGS_AND_SELECTED_ITEM: {
      return { ...state_copy, selectedItem: action.selectedItem, trainings: action.trainings }
    }
    case actions.SET_ITEM_TO_SCROLL_TO: {
      return { ...state_copy, itemToScrollTo: action.itemToScrollTo }
    }
    case actions.SET_HAS_SEARCH: {
      return { ...state_copy, hasSearch: action.hasSearch }
    }
    case actions.SET_SELECTED_MAP_POPUP_ITEM: {
      return { ...state_copy, selectedMapPopupItem: action.selectedMapPopupItem }
    }
    case actions.SET_EXTENDED_SEARCH: {
      return { ...state_copy, extendedSearch: action.extendedSearch }
    }

    default:
      return state
  }
}

export const SearchResultContext = createContext()

const SearchResultContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = {
    ...state,
    setTrainings: (trainings = []) => {
      dispatch({ type: actions.SET_TRAININGS, trainings })
    },
    setJobs: (jobs = []) => {
      dispatch({ type: actions.SET_JOBS, jobs })
    },
    setSelectedItem: (selectedItem = null) => {
      dispatch({ type: actions.SET_SELECTED_ITEM, selectedItem })
    },
    setSelectedMapPopupItem: (selectedMapPopupItem = null) => {
      dispatch({ type: actions.SET_SELECTED_MAP_POPUP_ITEM, selectedMapPopupItem })
    },
    setTrainingsAndSelectedItem: (trainings = [], selectedItem = null) => {
      dispatch({ type: actions.SET_TRAININGS_AND_SELECTED_ITEM, trainings, selectedItem })
    },
    setItemToScrollTo: (itemToScrollTo = null) => {
      dispatch({ type: actions.SET_ITEM_TO_SCROLL_TO, itemToScrollTo })
    },
    setExtendedSearch: (extendedSearch = false) => {
      dispatch({ type: actions.SET_EXTENDED_SEARCH, extendedSearch })
    },
    setHasSearch: (hasSearch = false) => {
      dispatch({ type: actions.SET_HAS_SEARCH, hasSearch })
    },
  }

  return <SearchResultContext.Provider value={value}>{children}</SearchResultContext.Provider>
}

export default SearchResultContextProvider
