import React, { useState, useContext } from "react";
import trainingIcon from "../../public/images/icons/book.svg";
import { fetchAddresses } from "../../services/baseAdresse";
import extendedSearchPin from "../../public/images/icons/jobPin.svg";
import { ScopeContext } from "../../context/ScopeContext";
import TagCfaDEntreprise from "./TagCfaDEntreprise";
import TagFormation from "./TagFormation";
import { setSelectedMarker } from "../../utils/mapTools";
import { getItemQueryParameters } from "../../utils/getItemId";
import { getSearchQueryParameters } from "../../utils/getSearchParameters";
import { SearchResultContext } from "../../context/SearchResultContextProvider";
import { ParameterContext } from "../../context/ParameterContextProvider";
import { DisplayContext } from "../../context/DisplayContextProvider";

const Training = ({ training, handleSelectItem, showTextOnly, searchForJobsOnNewCenter, hasAlsoJob, isCfa }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext);
  const { itemParameters } = React.useContext(ParameterContext);
  const { formValues } = React.useContext(DisplayContext);
  const scopeContext = useContext(ScopeContext);

  const currentSearchRadius = formValues?.radius || 30;

  const [allowDim, setAllowDim] = useState(true); // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const onSelectItem = (e) => {
    e.preventDefault();
    setAllowDim(false); // fixation du flag
    handleSelectItem(training, "training");
  };

  const getHightlightClass = () => {
    return shouldBeHighlighted() ? "c-resultcard--highlight" : "";
  };

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "formation") {
      return selectedMapPopupItem.items.find((item) => {
        return item.id === training.id;
      });
    } else {
      return false;
    }
  };

  const getCenterSearchOnTrainingButton = () => {
    return (
      <button className="extendedJobSearchButton" onClick={centerSearchOnTraining}>
        <img src={extendedSearchPin} alt="" /> <span>Voir les entreprises proches</span>
      </button>
    );
  };

  const getDebugClass = () => {
    if (itemParameters?.mode === "debug" && formValues?.job?.rncps.indexOf(training.rncpCode) < 0) {
      return "debugRemoved";
    } else {
      return "";
    }
  };

  const centerSearchOnTraining = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // reconstruction des critères d'adresse selon l'adresse du centre de formation
    const label = `${training.place.city} ${training.place.zipCode}`;

    // récupération du code insee depuis la base d'adresse
    if (!training.place.insee) {
      const addresses = await fetchAddresses(label, "municipality");
      if (addresses.length) {
        training.place.insee = addresses[0].insee;
      }
    }

    const newCenter = {
      insee: training.place.insee,
      label,
      zipcode: training.place.zipCode,
      value: {
        type: "Point",
        coordinates: [training.place.longitude, training.place.latitude],
      },
    };

    searchForJobsOnNewCenter(newCenter);
  };

  const highlightItemOnMap = () => {
    setSelectedMarker(training);
  };

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null);
    } else {
      setAllowDim(true);
    }
  };

  const actualLink = `/recherche-apprentissage?display=list&page=fiche&${getItemQueryParameters(
    training
  )}&${getSearchQueryParameters(formValues)}`;

  return (
    <a
      className={`resultCard trainingCard gtmSavoirPlus gtmFormation gtmListe ${getHightlightClass()} ${getDebugClass()}`}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
      href={actualLink}
    >
      <div className="c-media" id={`id${training.id}`}>

        <div className="c-media-body">
          <div className="row no-gutters">
            <div className="col-12 col-lg-6 text-left">
              <div className="title d-inline-block">{training.title ? training.title : training.longTitle}</div>
            </div>
            <div className="col-12 col-lg-6  d-lg-flex flex-column text-left text-lg-right my-1 my-lg-0">
              {
                isCfa ? <TagCfaDEntreprise /> : <TagFormation />
              }
            </div>
          </div>

          <div className="cardText pt-3 pt-lg-1">{training.company.name}</div>
          <div className="cardText pt-2">{training.place.fullAddress}</div>
          {itemParameters?.mode === "debug" ? (
            <div className="cardText pt-2">{`${training.rncpCode} - romes :${training.romes.map(
              (rome) => " " + rome.code
            )}`}</div>
          ) : (
            ""
          )}
          <span className="cardDistance pt-1">
            {training.place.distance !== null
              ? `${Math.round(training.place.distance)} km(s) du lieu de recherche`
              : ""}
            {showTextOnly ? (
              ""
            ) : (
              <>
                <span className="knowMore d-none d-md-block">
                  <button className="c-resultcard-knowmore">En savoir plus</button>
                </span>
              </>
            )}
          </span>
          {showTextOnly ? (
            ""
          ) : (
            <>
              {(training.place.distance === null || Math.round(training.place.distance) > currentSearchRadius) &&
              scopeContext.isJob
                ? getCenterSearchOnTrainingButton()
                : ""}
            </>
          )}
        </div>
      </div>
    </a>
  );
};

export default Training;
