import { ILbaItemFormation, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemTraining, ILbaItemTraining2 } from "@/../shared"
import React, { createContext, useReducer } from "react"

const initialState = {
  trainings: [],
  jobs: { peJobs: null, matchas: null, lbaCompanies: null },
  itemToScrollTo: null,
  selectedItem: null,
  extendedSearch: false,
  hasSearch: false,
  selectedMapPopupItem: null,
  searchHistory: [],
}

const actions = {
  SET_TRAININGS: "SET_TRAININGS",
  SET_JOBS: "SET_JOBS",
  SET_INTERNAL_JOBS: "SET_INTERNAL_JOBS",
  SET_PARTNER_JOBS: "SET_PARTNER_JOBS",
  SET_SELECTED_ITEM: "SET_SELECTED_ITEM",
  SET_ITEM_TO_SCROLL_TO: "SET_ITEM_TO_SCROLL_TO",
  SET_EXTENDED_SEARCH: "SET_EXTENDED_SEARCH",
  SET_HAS_SEARCH: "SET_HAS_SEARCH",
  SET_TRAININGS_AND_SELECTED_ITEM: "SET_TRAININGS_AND_SELECTED_ITEM",
  SET_SELECTED_MAP_POPUP_ITEM: "SET_SELECTED_MAP_POPUP_ITEM",
  SET_JOBS_AND_SELECTED_ITEM: "SET_JOBS_AND_SELECTED_ITEM",
  SET_SEARCH_HISTORY: "SET_SEARCH_HISTORY",
}

const reducer = (state, action) => {
  const state_copy = JSON.parse(JSON.stringify(state))

  switch (action.type) {
    case actions.SET_TRAININGS: {
      return { ...state_copy, trainings: action.trainings }
    }
    case actions.SET_JOBS: {
      return { ...state_copy, jobs: action.jobs }
    }
    case actions.SET_INTERNAL_JOBS: {
      return { ...state_copy, jobs: { peJobs: state_copy.jobs.peJobs, ...action.jobs } }
    }
    case actions.SET_PARTNER_JOBS: {
      return { ...state_copy, jobs: { ...state_copy.jobs, peJobs: action.jobs.peJobs } }
    }
    case actions.SET_SELECTED_ITEM: {
      return { ...state_copy, selectedItem: action.selectedItem }
    }
    case actions.SET_TRAININGS_AND_SELECTED_ITEM: {
      return { ...state_copy, selectedItem: action.selectedItem, trainings: action.trainings }
    }
    case actions.SET_JOBS_AND_SELECTED_ITEM: {
      return { ...state_copy, selectedItem: action.selectedItem, jobs: action.jobs }
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
    case actions.SET_SEARCH_HISTORY: {
      return { ...state_copy, searchHistory: action.searchHistory }
    }
    default:
      return state
  }
}

export type IContextSearchHistory = {
  index: number
  trainings?: ILbaItemTraining2[]
  jobs?: { peJobs: [] | null; lbaCompanies: [] | null; matchas: [] | null }
  formValues?: any
}

export type IContextSearch = {
  trainings: any[]
  setTrainings: (b: any[]) => void
  jobs: { peJobs: ILbaItemFtJob[] | null; lbaCompanies: ILbaItemLbaCompany[] | null; matchas: ILbaItemLbaJob[] | null }
  setJobs: (b: { peJobs: [] | null; lbaCompanies: [] | null; matchas: [] | null }) => void
  setInternalJobs: (b: any[]) => void
  setPartnerJobs: (b: any[]) => void
  itemToScrollTo: object
  setItemToScrollTo: (b: object) => void
  selectedItem: ILbaItemFormation | ILbaItemFtJob | ILbaItemLbaCompany | ILbaItemLbaJob
  setSelectedItem: (b: object) => void
  extendedSearch: boolean
  setExtendedSearch: (b: boolean) => void
  hasSearch: boolean
  setHasSearch: (b: boolean) => void
  selectedMapPopupItem: any
  setSelectedMapPopupItem: (b: object) => void
  setTrainingsAndSelectedItem: (trainings: ILbaItemTraining[], selectedItem: ILbaItemTraining) => void
  setJobsAndSelectedItem: (jobs: { peJobs: [] | null; lbaCompanies: [] | null; matchas: [] | null }, selectedItem: ILbaItemFtJob | ILbaItemLbaCompany | ILbaItemLbaJob) => void
  searchHistory: IContextSearchHistory[]
  setSearchHistory: (searchHistory: IContextSearchHistory[]) => void
}
// @ts-expect-error: TODO
export const SearchResultContext = createContext<IContextSearch>()

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
    setInternalJobs: (jobs = []) => {
      dispatch({ type: actions.SET_INTERNAL_JOBS, jobs })
    },
    setPartnerJobs: (jobs = []) => {
      dispatch({ type: actions.SET_PARTNER_JOBS, jobs })
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
    setJobsAndSelectedItem: (jobs = { peJobs: null, lbaCompanies: null, matchas: null }, selectedItem = null) => {
      dispatch({ type: actions.SET_JOBS_AND_SELECTED_ITEM, jobs, selectedItem })
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
    setSearchHistory: (searchHistory = []) => {
      dispatch({ type: actions.SET_SEARCH_HISTORY, searchHistory })
    },
  }

  return <SearchResultContext.Provider value={value}>{children}</SearchResultContext.Provider>
}

export default SearchResultContextProvider
