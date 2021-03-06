import React, { useState } from "react";
import jobIcon from "../../public/images/icons/job.svg";
import TagCandidatureSpontanee from "./TagCandidatureSpontanee";
import { useSelector } from "react-redux";
import { fetchAddresses } from "../../services/baseAdresse";
import extendedSearchPin from "../../public/images/icons/trainingPin.svg";
import { capitalizeFirstLetter } from "../../utils/strutils";
import { get } from "lodash";
import { setSelectedMarker } from "utils/mapTools";

const LbbCompany = ({ company, handleSelectItem, showTextOnly, searchForTrainingsOnNewCenter }) => {
  const { formValues, selectedMapPopupItem } = useSelector((state) => state.trainings);

  const currentSearchRadius = formValues?.radius || 30;

  const [allowDim, setAllowDim] = useState(true); // cet état évite un appel qui masque la mise en avant de l'icône lors de l'ouverture du détail

  const onSelectItem = () => {
    setAllowDim(false); // fixation du flag
    handleSelectItem(company, company.ideaType);
  };

  const getCenterSearchOnCompanyButton = () => {
    return (
      <button className="extendedTrainingSearchButton" onClick={centerSearchOnCompany}>
        <img src={extendedSearchPin} alt="" /> <span>Voir les formations proches</span>
      </button>
    );
  };

  const centerSearchOnCompany = async (e) => {
    if (e) {
      e.stopPropagation();
    }

    // récupération du code insee manquant depuis la base d'adresse
    if (!company.place.insee) {
      const addresses = await fetchAddresses(company.place.address, "municipality");
      company.place.insee = "";
      company.place.zipCode = "";
      if (addresses.length) {
        company.place.insee = addresses[0].insee;
        company.place.zipCode = addresses[0].zipcode;
      }
    }

    const newCenter = {
      insee: company.place.insee,
      label: company.place.address,
      zipcode: company.place.zipCode,
      value: {
        type: "Point",
        coordinates: [company.place.longitude, company.place.latitude],
      },
    };

    searchForTrainingsOnNewCenter(newCenter);
  };

  const highlightItemOnMap = () => {
    setSelectedMarker(company);
  };

  const dimItemOnMap = (e) => {
    if (allowDim) {
      setSelectedMarker(null);
    } else {
      setAllowDim(true);
    }
  };

  const getHightlightClass = () => {
    return shouldBeHighlighted() ? "c-resultcard--highlight" : "";
  };

  const shouldBeHighlighted = () => {
    if (selectedMapPopupItem?.ideaType === "job") {
      return selectedMapPopupItem.items.find((item) => {
        return item?.company?.siret === company.company.siret;
      });
    } else {
      return false;
    }
  };

  return (
    <div
      className={`resultCard gtmSavoirPlus gtm${capitalizeFirstLetter(
        company.ideaType
      )} gtmListe ${getHightlightClass()}`}
      onClick={onSelectItem}
      onMouseOver={highlightItemOnMap}
      onMouseOut={dimItemOnMap}
    >
      <div className="c-media" id={`${company.ideaType}${company.company.siret}`}>
        <div className="c-media-figure">
          <img className="cardIcon" src={jobIcon} alt="" />
        </div>

        <div className="c-media-body">
          <div className="row no-gutters">
            <div className="col-12 col-lg-6 text-left">
              <div className="title d-inline-block">{company.company.name}</div>
            </div>
            <div className="col-12 col-lg-6 d-lg-flex flex-column text-left text-lg-right my-1 my-lg-0">
              <TagCandidatureSpontanee />
            </div>
          </div>

          <div>
            <div className="cardText pt-2">{get(company, "nafs[0].label", "")}</div>
            <div className="cardText pt-2">{company.place.fullAddress}</div>
          </div>

          <span className="cardDistance pt-1">
            {company.place.distance} km(s) du lieu de recherche
            {showTextOnly ? (
              ""
            ) : (
              <>
                <div className="knowMore d-none d-md-block">
                  <button className={`c-resultcard-knowmore`}>En savoir plus</button>
                </div>
              </>
            )}
          </span>
          {showTextOnly ? (
            ""
          ) : (
            <>{Math.round(company.place.distance) > currentSearchRadius ? getCenterSearchOnCompanyButton() : ""}</>
          )}
        </div>
      </div>
    </div>
  );
};

export default LbbCompany;
