import React, { createContext, useReducer } from "react"

const initialState = {
  shouldExecuteSearch: false,
  widgetParameters: null,
  itemParameters: null,
  opcoFilter: null,
  useMock: false,
}

const actions = {
  SET_SHOULD_EXECUTE_SEARCH: "SET_SHOULD_EXECUTE_SEARCH",
  SET_WIDGET_PARAMETERS: "SET_WIDGET_PARAMETERS",
  SET_ITEM_PARAMETERS: "SET_ITEM_PARAMETERS",
  SET_OPCO_FILTER: "SET_OPCO_FILTER",
  SET_USE_MOCK: "SET_USE_MOCK",
}

const reducer = (state, action) => {
  let state_copy = JSON.parse(JSON.stringify(state))

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
      return { ...state_copy, opcoFilter: action.opcoFilter }
    }
    case actions.SET_USE_MOCK: {
      return { ...state_copy, useMock: action.useMock }
    }

    default:
      return state
  }
}

export const ParameterContext = createContext()

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
    setOpcoFilter: (opcoFilter = null) => {
      dispatch({ type: actions.SET_OPCO_FILTER, opcoFilter })
    },
    setUseMock: (useMock = null) => {
      dispatch({ type: actions.SET_USE_MOCK, useMock })
    },
  }

  return <ParameterContext.Provider value={value}>{children}</ParameterContext.Provider>
}

export default ParameterContextProvider
