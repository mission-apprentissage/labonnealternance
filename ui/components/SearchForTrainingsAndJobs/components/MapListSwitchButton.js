import React from "react"
import toggleList from "../../../public/images/icons/toggleList.svg"
import toggleCard from "../../../public/images/icons/toggleCard.svg"
import { SearchResultContext } from "../../../context/SearchResultContextProvider"
import { DisplayContext } from "../../../context/DisplayContextProvider"

const MapListSwitchButton = ({ showResultMap, showResultList, isFormVisible }) => {
  const { hasSearch } = React.useContext(SearchResultContext)
  const { visiblePane } = React.useContext(DisplayContext)

  if (visiblePane === "resultList") {
    if (hasSearch)
      return (
        <div className={`floatingButtons is-hidden-${isFormVisible} resultList`}>
          <button onClick={showResultMap} className="d-flex align-items-center">
            <img src={toggleCard} alt="Basculer vers la carte" />
            <span className="ml-2 c-resultlist-card">Carte</span>
          </button>
        </div>
      )
    else return ""
  } else {
    return (
      <div className="floatingButtons resultMap">
        {hasSearch ? (
          <button onClick={showResultList} className="d-flex align-items-center">
            <img src={toggleList} alt="Basculer vers la liste" />
            <span className="ml-2 c-resultlist-card">Liste</span>
          </button>
        ) : (
          ""
        )}
      </div>
    )
  }
}

export default MapListSwitchButton
