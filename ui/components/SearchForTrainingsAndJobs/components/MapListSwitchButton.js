import React from "react";
import { useSelector } from "react-redux";
import toggleList from "public/images/icons/toggleList.svg";
import toggleCard from "public/images/icons/toggleCard.svg";

const MapListSwitchButton = ({ showResultMap, showSearchForm, showResultList }) => {

  const { visiblePane, hasSearch } = useSelector((state) => state.trainings);

  if (visiblePane === "resultList") {
    if (hasSearch)
      return (
        <div className="floatingButtons resultList">
          <button onClick={showResultMap} className="d-flex align-items-center">
            <img src={toggleCard} alt="Basculer vers la carte" />
            <span className="ml-2 c-resultlist-card">
              Carte
            </span>
          </button>
        </div>
      );
    else return "";
  } else {
    return (
      <div className="floatingButtons resultMap">
        {hasSearch ? 
          <button onClick={showResultList} className="d-flex align-items-center">
            <img src={toggleList} alt="Basculer vers la liste" />
            <span className="ml-2 c-resultlist-card">
              Liste
            </span>
          </button> 
          : 
          ""
        }
      </div>
    );
  }
};

export default MapListSwitchButton;
