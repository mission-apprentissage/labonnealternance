let currentPage = ""
let currentSearch = null

const setCurrentPage = (p) => {
  currentPage = p
}

const setCurrentSearch = (s) => {
  currentSearch = s
}

export { currentPage, currentSearch, setCurrentPage, setCurrentSearch }
