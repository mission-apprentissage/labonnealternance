import React, { createContext, useReducer } from "react"

import { defaultFilters } from "../components/SearchForTrainingsAndJobs/services/utils"

// formValues = {
// radius
//   location: {
//     value: {
//       coordinates: [lon, lat]
//     }
//     insee
//     zipcode
//     label
//   }
// }

const initialState = {
  formValues: null,
  visiblePane: "resultList",
  isFormVisible: true,
  shouldMapBeVisible: false,
  activeFilters: defaultFilters,
  bannerStates: {
    isEnvClosed: false,
    isAlertClosed: false,
    isInfoClosed: false,
    isOKClosed: false,
  },
}

const actions = {
  SET_FORM_VALUES: "SET_FORM_VALUES",
  SET_VISIBLE_PANE: "SET_VISIBLE_PANE",
  SET_IS_FORM_VISIBLE: "SET_IS_FORM_VISIBLE",
  SET_SHOULD_MAP_BE_VISIBLE: "SET_SHOULD_MAP_BE_VISIBLE",
  SET_ACTIVE_FILTERS: "SET_ACTIVE_FILTERS",
  SET_BANNER_STATES: "SET_BANNER_STATES",
}

const reducer = (state, action) => {
  const state_copy = JSON.parse(JSON.stringify(state))

  switch (action.type) {
    case actions.SET_FORM_VALUES: {
      return { ...state_copy, formValues: action.formValues }
    }
    case actions.SET_VISIBLE_PANE: {
      return { ...state_copy, visiblePane: action.visiblePane }
    }
    case actions.SET_IS_FORM_VISIBLE: {
      return { ...state_copy, isFormVisible: action.isFormVisible }
    }
    case actions.SET_SHOULD_MAP_BE_VISIBLE: {
      return { ...state_copy, shouldMapBeVisible: action.shouldMapBeVisible }
    }
    case actions.SET_ACTIVE_FILTERS: {
      return { ...state_copy, activeFilters: action.activeFilters }
    }
    case actions.SET_BANNER_STATES: {
      return { ...state_copy, bannerStates: action.bannerStates }
    }
    default:
      return state
  }
}

type IContextDisplay = {
  formValues: any
  setFormValues: (b: any) => void
  visiblePane: string
  setVisiblePane: (b: string) => void
  isFormVisible: boolean
  setIsFormVisible: (b: boolean) => void
  shouldMapBeVisible: boolean
  setShouldMapBeVisible: (b: boolean) => void
  activeFilters: string[]
  setActiveFilters: (b: string[]) => void
  bannerStates: { isEnvClosed: boolean; isOKClosed: boolean; isInfoClosed: boolean; isAlertClosed: boolean }
  setBannerStates: (o: { isEnvClosed: boolean; isOKClosed: boolean; isInfoClosed: boolean; isAlertClosed: boolean }) => void
}
// @ts-expect-error: TODO
export const DisplayContext = createContext<IContextDisplay>()

const DisplayContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = {
    ...state,
    setActiveFilters: (activeFilters = defaultFilters) => {
      dispatch({ type: actions.SET_ACTIVE_FILTERS, activeFilters })
    },
    setFormValues: (formValues = null) => {
      dispatch({ type: actions.SET_FORM_VALUES, formValues })
    },
    setVisiblePane: (visiblePane = "resultList") => {
      dispatch({ type: actions.SET_VISIBLE_PANE, visiblePane })
    },
    setIsFormVisible: (isFormVisible = true) => {
      dispatch({ type: actions.SET_IS_FORM_VISIBLE, isFormVisible })
    },
    setShouldMapBeVisible: (shouldMapBeVisible = false) => {
      dispatch({ type: actions.SET_SHOULD_MAP_BE_VISIBLE, shouldMapBeVisible })
    },
    setBannerStates: (bannerStates) => {
      dispatch({ type: actions.SET_BANNER_STATES, bannerStates })
    },
  }

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
}

export default DisplayContextProvider
