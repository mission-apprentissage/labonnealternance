import React from "react"

import refreshSearchOnMap from "public/images/icons/refreshSearchOnMap.svg"
import lookingGlassOnMap from "public/images/glass.svg"
import { SearchResultContext } from "../../context/SearchResultContextProvider"
import { DisplayContext } from "../../context/DisplayContextProvider"

const MapSearchButton = ({ handleSearchClick }) => {
  const { formValues } = React.useContext(DisplayContext)
  const { hasSearch } = React.useContext(SearchResultContext)

  return hasSearch ? (
    <div className="c-map-searchButton">
      <button onClick={handleSearchClick} title="Lancer une rechercher centrée sur la carte" className="d-flex align-items-center">
        {formValues ? (
          <>
            <img src={refreshSearchOnMap} alt="Relancer la recherche depuis la carte" />
            <span className="ml-2">Rechercher dans cette zone</span>
          </>
        ) : (
          <>
            <img src={lookingGlassOnMap} alt="Relancer la recherche depuis la carte" />
            <span className="ml-2">Lancer une recherche</span>
          </>
        )}
      </button>
    </div>
  ) : (
    ""
  )
}

export default MapSearchButton
