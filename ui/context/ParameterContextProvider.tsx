import React, { createContext, useReducer } from "react"

const initialState = {
  shouldExecuteSearch: false,
  widgetParameters: null,
  itemParameters: null,
  opcoFilter: null,
  opcoUrlFilter: null,
  displayMap: false,
  showCombinedJob: true,
}

const actions = {
  SET_SHOULD_EXECUTE_SEARCH: "SET_SHOULD_EXECUTE_SEARCH",
  SET_WIDGET_PARAMETERS: "SET_WIDGET_PARAMETERS",
  SET_ITEM_PARAMETERS: "SET_ITEM_PARAMETERS",
  SET_OPCO_FILTER: "SET_OPCO_FILTER",
  SET_DISPLAY_MAP: "SET_DISPLAY_MAP",
  SET_SHOW_COMBINED_JOB: "SET_SHOW_COMBINED_JOB",
}

const reducer = (state, action) => {
  const state_copy = JSON.parse(JSON.stringify(state))

  switch (action.type) {
    case actions.SET_SHOULD_EXECUTE_SEARCH: {
      return { ...state_copy, shouldExecuteSearch: action.shouldExecuteSearch }
    }
    case actions.SET_WIDGET_PARAMETERS: {
      return { ...state_copy, widgetParameters: action.widgetParameters }
    }
    case actions.SET_ITEM_PARAMETERS: {
      return { ...state_copy, itemParameters: action.itemParameters }
    }
    case actions.SET_OPCO_FILTER: {
      return { ...state_copy, opcoFilter: action.opcoFilter, opcoUrlFilter: action.opcoUrlFilter }
    }
    case actions.SET_DISPLAY_MAP: {
      return { ...state_copy, displayMap: action.displayMap }
    }
    case actions.SET_SHOW_COMBINED_JOB: {
      return { ...state_copy, showCombinedJob: action.showCombinedJob }
    }

    default:
      return state
  }
}
export type IContextParameter = {
  shouldExecuteSearch: boolean
  setShouldExecuteSearch: (b: boolean) => void
  widgetParameters: object
  // widgetParameters: {
  //   formValues?: object
  //   applyFormValues?: object
  // parameters: {
  //   jobName
  //   romes
  //   frozenJob
  // }
  // }
  setWidgetParameters: (b: object) => void
  itemParameters: object
  setItemParameters: (b: object) => void
  opcoFilter: object
  setOpcoFilter: (b: object) => void
  opcoUrlFilter: object
  setOpcoUrlFilter: (b: object) => void
  displayMap: boolean
  setDisplayMap: (b: boolean) => void
  showCombinedJob: boolean
  setShowCombinedJob: (b: boolean) => void
}
// @ts-expect-error: TODO
export const ParameterContext = createContext<IContextParameter>()

const ParameterContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = {
    ...state,
    setShouldExecuteSearch: (shouldExecuteSearch = false) => {
      dispatch({ type: actions.SET_SHOULD_EXECUTE_SEARCH, shouldExecuteSearch })
    },
    setWidgetParameters: (widgetParameters = null) => {
      dispatch({ type: actions.SET_WIDGET_PARAMETERS, widgetParameters })
    },
    setItemParameters: (itemParameters = null) => {
      dispatch({ type: actions.SET_ITEM_PARAMETERS, itemParameters })
    },
    setOpcoFilter: (opcoFilter = null, opcoUrlFilter = null) => {
      dispatch({ type: actions.SET_OPCO_FILTER, opcoFilter, opcoUrlFilter })
    },
    setDisplayMap: (displayMap = false) => {
      dispatch({ type: actions.SET_DISPLAY_MAP, displayMap })
    },
    setShowCombinedJob: (showCombinedJob = true) => {
      dispatch({ type: actions.SET_SHOW_COMBINED_JOB, showCombinedJob })
    },
  }

  return <ParameterContext.Provider value={value}>{children}</ParameterContext.Provider>
}

export default ParameterContextProvider
