import React, { createContext, PropsWithChildren, useReducer } from "react"

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

const initialState: IDisplayState = {
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
} as const

type IAction =
  | { type: "SET_FORM_VALUES"; formValues: IDisplayState["formValues"] }
  | { type: "SET_VISIBLE_PANE"; visiblePane: IDisplayState["visiblePane"] }
  | { type: "SET_IS_FORM_VISIBLE"; isFormVisible: IDisplayState["isFormVisible"] }
  | { type: "SET_SHOULD_MAP_BE_VISIBLE"; shouldMapBeVisible: IDisplayState["shouldMapBeVisible"] }
  | { type: "SET_ACTIVE_FILTERS"; activeFilters: IDisplayState["activeFilters"] }
  | { type: "SET_BANNER_STATES"; bannerStates: IDisplayState["bannerStates"] }

const reducer = (state: IDisplayState, action: IAction) => {
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

export type IDisplayState = {
  formValues: any
  visiblePane: string
  isFormVisible: boolean
  shouldMapBeVisible: boolean
  activeFilters: string[]
  bannerStates: { isEnvClosed: boolean; isOKClosed: boolean; isInfoClosed: boolean; isAlertClosed: boolean }
}

type IContextDisplay = IDisplayState & {
  setFormValues: (b: any) => void
  setVisiblePane: (b: string) => void
  setIsFormVisible: (b: boolean) => void
  setShouldMapBeVisible: (b: boolean) => void
  setActiveFilters: (b: string[]) => void
  setBannerStates: (o: { isEnvClosed: boolean; isOKClosed: boolean; isInfoClosed: boolean; isAlertClosed: boolean }) => void
}
// @ts-expect-error: TODO
export const DisplayContext = createContext<IContextDisplay>()

const DisplayContextProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = {
    ...state,
    setActiveFilters: (activeFilters = defaultFilters) => {
      dispatch({ type: actions.SET_ACTIVE_FILTERS, activeFilters })
    },
    setFormValues: (formValues: IDisplayState["formValues"] = null) => {
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
    setBannerStates: (bannerStates: IDisplayState["bannerStates"]) => {
      dispatch({ type: actions.SET_BANNER_STATES, bannerStates })
    },
  }

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
}

export default DisplayContextProvider
