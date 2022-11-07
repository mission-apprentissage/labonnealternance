import React, { useState } from "react";
import jobIcon from "../../public/images/icons/job.svg";
import TagOffreEmploi from "./TagOffreEmploi";
import { isDepartmentJob } from "../../utils/itemListUtils";
import extendedSearchPin from "../../public/images/icons/trainingPin.svg";
import ReactHtmlParser from "react-html-parser";
import { fetchAddresses } from "../../services/baseAdresse";
import { setSelectedMarker } from "../../utils/mapTools";
import { getItemQueryParameters } from "../../utils/getItemId";
import { getSearchQueryParameters } from "../../utils/getSearchParameters";
import TagFormationAssociee from "./TagFormationAssociee";
import { SearchResultContext } from "../../context/SearchResultContextProvider";
import { DisplayContext } from "../../context/DisplayContextProvider";

const Job = ({ job, handleSelectItem, showTextOnly, searchForTrainingsOnNewCenter }) => {
  const { selectedMapPopupItem } = React.useContext(SearchResultContext);
  const { formValues } = React.useContext(DisplayContext);

  const currentSearchRadius = formValues?.radius || 30;

  const hasLocation = formValues?.location?.value ? true : false;

  const [allowDim, setAllowDim] = useState(true); // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const kind = job?.ideaType;

  const onSelectItem = (e) => {
    e.preventDefault();
    setAllowDim(false); // fixation du flag
    handleSelectItem(job);
  };

  const getHightlightClass = () => {
    return shouldBeHighlighted() ? "c-resultcard--highlight" : "";
  };

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "job") {
      return selectedMapPopupItem.items.find((item) => {
        return item?.job?.id === job.job.id;
      });
    } else {
      return false;
    }
  };

  const getCenterSearchOnJobButton = () => {
    return (
      <button className="extendedTrainingSearchButton" onClick={centerSearchOnJob}>
        <img src={extendedSearchPin} alt="" /> <span>Voir les formations proches</span>
      </button>
    );
  };

  const centerSearchOnJob = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    let jobPlace = job.place;

    if (!jobPlace.insee) {
      const addresses = await fetchAddresses(job.place.address, "municipality");
      jobPlace.insee = "";
      jobPlace.zipCode = "";
      if (addresses.length) {
        jobPlace.insee = addresses[0].insee;
        jobPlace.zipCode = addresses[0].zipcode;
      }
    }

    const newCenter = {
      insee: jobPlace.insee,
      label: jobPlace.fullAddress,
      zipcode: jobPlace.zipCode,
      value: {
        type: "Point",
        coordinates: [jobPlace.longitude, jobPlace.latitude],
      },
    };

    searchForTrainingsOnNewCenter(newCenter);
  };

  const rootClassList = (actualKind) => {
    let allClasses = "resultCard gtmSavoirPlus gtmListe ";
    if (actualKind === "peJob") {
      allClasses += "gtmPeJob ";
    } else if (actualKind === "matcha") {
      allClasses += "gtmMatcha ";
    }
    allClasses += getHightlightClass();

    return allClasses;
  };

  const highlightItemOnMap = () => {
    setSelectedMarker(job);
  };

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null);
    } else {
      setAllowDim(true);
    }
  };

  const actualLink = `/recherche-apprentissage?display=list&page=fiche&${getItemQueryParameters(
    job
  )}&${getSearchQueryParameters(formValues)}`;

  return (
    <a
      className={rootClassList(kind)}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
      data-testid={`${kind}${job.job.id}`}
      href={actualLink}
    >
      <div className="c-media" id={`${kind}${job.job.id}`}>
        <div className="c-media-figure">
          <img className="cardIcon" src={jobIcon} alt="" />
        </div>

        <div className="c-media-body">
          <div className="row no-gutters">
            <div className="col-12 col-lg-7 text-left">
              <div className="title d-inline-block">
                {job.title}
              </div>
            </div>
            <div className="col-12 col-lg-5 d-lg-flex flex-column text-left text-lg-right my-1 my-lg-0">
              <TagOffreEmploi />
              <TagFormationAssociee isMandataire={job?.company?.mandataire} />
            </div>
          </div>

          <div>
            <div className="cardText pt-2">{job.company && job.company.name ? job.company.name : ReactHtmlParser("<i>Offre anonyme</i>")}</div>
            <div className="cardText pt-2">{job.place.fullAddress}</div>
          </div>

          <span className="cardDistance pt-1">
            {hasLocation ? (
              isDepartmentJob(job) ? (
                "Dans votre zone de recherche"
              ) : (
                <>{job.place.distance} km(s) du lieu de recherche</>
              )
            ) : (
              ""
            )}
            {showTextOnly ? (
              ""
            ) : (
              <>
                <span className="knowMore d-none d-md-block">
                  <button className={`c-resultcard-knowmore`}>En savoir plus</button>
                </span>
              </>
            )}
          </span>
          {Math.round(job.place.distance) > currentSearchRadius ? getCenterSearchOnJobButton() : ""}
        </div>
      </div>
    </a>
  );
};

export default Job;
