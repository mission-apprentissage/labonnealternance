// eslint-disable-next-line import/no-mutable-exports
let currentPage = ""
// eslint-disable-next-line import/no-mutable-exports
let currentSearch = null

const setCurrentPage = (p) => {
  currentPage = p
}

const setCurrentSearch = (s) => {
  currentSearch = s
}

// @ts-ignore
window.currentConsolidatedItemList = []

export { currentPage, currentSearch, setCurrentPage, setCurrentSearch }
