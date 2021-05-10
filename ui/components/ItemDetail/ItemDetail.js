import React, { useState } from "react";
import { useSelector } from "react-redux";
import PeJobDetail from "./PeJobDetail";
import MatchaDetail from "./MatchaDetail";
import LbbCompanyDetail from "./LbbCompanyDetail";
import TrainingDetail from "./TrainingDetail";
import { findIndex, concat, pick, get, includes, defaultTo, round } from "lodash";
import smallMapPointIcon from "public/images/icons/small_map_point.svg";
import chevronLeft from "public/images/chevronleft.svg";
import chevronRight from "public/images/chevronright.svg";
import chevronClose from "public/images/close.svg";
import { capitalizeFirstLetter } from "utils/strutils";

import { useSwipeable } from "react-swipeable";
import { mergeJobs, mergeOpportunities } from "utils/itemListUtils";

import TagCandidatureSpontanee from "./TagCandidatureSpontanee";
import TagOffreEmploi from "./TagOffreEmploi";
import TagCfaDEntreprise from "./TagCfaDEntreprise";

const ItemDetail = ({ selectedItem, handleClose, displayNavbar, handleSelectItem, activeFilter }) => {
  const kind = selectedItem?.ideaType;

  const distance = selectedItem?.place?.distance;

  const [seeInfo, setSeeInfo] = useState(false);

  let actualTitle = selectedItem?.title || selectedItem?.longTitle;

  const { extendedSearch } = useSelector((state) => state.trainings);

  const currentList = useSelector((store) => {
    let picked = pick(store.trainings, ["trainings", "jobs"]);
    let trainingsArray = includes(["all", "trainings"], activeFilter) ? get(picked, "trainings", []) : [];

    let jobList = [];
    let companyList = [];
    if (includes(["all", "jobs"], activeFilter)) {
      if (extendedSearch) jobList = mergeOpportunities(get(picked, "jobs"));
      else {
        jobList = mergeJobs(get(picked, "jobs"));
        companyList = mergeOpportunities(get(picked, "jobs"), "onlyLbbLba");
      }
    }
    let fullList = concat([], trainingsArray, jobList, companyList);
    let listWithoutEmptyValues = fullList.filter((el) => !!el);
    return listWithoutEmptyValues;
  });

  // See https://www.npmjs.com/package/react-swipeable
  const swipeHandlers = useSwipeable({
    onSwiped: (event_data) => {
      if (event_data.dir === "Right") {
        if (currentList.length > 1) {
          goPrev();
        }
      } else if (event_data.dir === "Left") {
        if (currentList.length > 1) {
          goNext();
        }
      }
    },
  });
  const goNext = () => {
    let currentIndex = findIndex(currentList, selectedItem);
    let nextIndex = currentIndex == currentList.length - 1 ? 0 : currentIndex + 1;
    handleSelectItem(currentList[nextIndex]);
  };
  const goPrev = () => {
    let currentIndex = findIndex(currentList, selectedItem);
    let prevIndex = currentIndex == 0 ? currentList.length - 1 : currentIndex - 1;
    handleSelectItem(currentList[prevIndex]);
  };

  return (
    <>
      <section
        className={`c-detail itemDetail ${kind ? `gtmDetail${capitalizeFirstLetter(kind)}` : ""} ${
          selectedItem ? "" : "hiddenItemDetail"
        }`}
        {...swipeHandlers}
      >
        {displayNavbar ? (
          <nav
            className="c-detail-stickynav"
            onClick={() => {
              setSeeInfo(false);
              handleClose();
            }}
          >
            <span className="mr-3">←</span> {actualTitle}
          </nav>
        ) : (
          ""
        )}
        <header className="c-detail-header">
          <div className="">
            <div className="d-flex justify-content-end mb-2">
              <div className="mr-auto">
                {kind === "formation" ? <TagCfaDEntreprise /> : ""}
                {includes(["lbb", "lba"], kind) ? <TagCandidatureSpontanee /> : ""}
                {includes(["peJob", "matcha"], kind) ? <TagOffreEmploi /> : ""}
              </div>
              <div>
                <button
                  className="c-tiny-btn"
                  onClick={() => {
                    goPrev();
                  }}
                >
                  <img className="c-tiny-btn__image" src={chevronLeft} alt="Résultat précédent" />
                </button>
              </div>
              <div className="ml-2">
                <button
                  className="c-tiny-btn"
                  onClick={() => {
                    goNext();
                  }}
                >
                  <img className="c-tiny-btn__image" src={chevronRight} alt="Résultat suivant" />
                </button>
              </div>
              <div className="ml-2">
                <button
                  className="c-tiny-btn"
                  onClick={() => {
                    setSeeInfo(false);
                    handleClose();
                  }}
                >
                  <img className="c-tiny-btn__image" src={chevronClose} alt="Fermer la fenêtre" />
                </button>
              </div>
            </div>

            <p className={"c-detail-title c-detail-title--" + kind}>{defaultTo(actualTitle, "")}</p>

            <p className={`c-detail-activity c-detail-title--${kind}`}>
              {kind === "lba" || kind === "lbb"
                ? get(selectedItem, "nafs[0].label", "Candidature spontanée")
                : get(selectedItem, "company.name", "")}
              {kind === "formation" ? ` (${selectedItem.company.place.city})` : ""}
            </p>
            <p className="d-flex mt-4 text-left">
              <span className="d-block">
                <img className="cardIcon" src={smallMapPointIcon} alt="Illustration d'un point sur la carte" />
              </span>
              <span className="ml-2 d-block">
                <span className="c-detail-address d-block">{get(selectedItem, "place.fullAddress", "")}</span>
                {distance ? (
                  <span className="c-detail-km d-block">
                    {round(distance, 1) + " "}
                    km(s) du lieu de recherche
                  </span>
                ) : (
                  ""
                )}
              </span>
            </p>
          </div>
        </header>

        <div className="c-detail-body">
          {kind === "peJob" && selectedItem?.url ? (
            <div className="c-detail-description-me col-12 col-md-5">
              <div className="c-detail-pelink my-3">
                <a className="btn btn-dark ml-1 gtmContactPE" target="poleemploi" href={selectedItem.url}>
                  Je postule sur Pôle emploi
                </a>
              </div>
            </div>
          ) : (
            ""
          )}
          {kind === "peJob" ? <PeJobDetail job={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} /> : ""}
          {kind === "matcha" ? <MatchaDetail job={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} /> : ""}
          {includes(["lbb", "lba"], kind) ? (
            <LbbCompanyDetail lbb={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} />
          ) : (
            ""
          )}
          {kind === "formation" ? (
            <TrainingDetail training={selectedItem} seeInfo={seeInfo} setSeeInfo={setSeeInfo} />
          ) : (
            ""
          )}
        </div>
      </section>
    </>
  );
};

export default ItemDetail;
