import React, { useState } from "react";
import { Nav, NavItem, NavLink, Spinner } from "reactstrap";
import Training from "../../../components/ItemDetail/Training";
import PeJob from "../../../components/ItemDetail/PeJob";
import LbbCompany from "../../../components/ItemDetail/LbbCompany";
import { LogoIdea, ErrorMessage } from "../../../components";
import { filterLayers } from "../../../utils/mapTools";
import { useSelector } from "react-redux";
import ExtendedSearchButton from "./ExtendedSearchButton";
import NoJobResult from "./NoJobResult";
import FilterButton from "./FilterButton";
import { useScopeContext } from "context/ScopeContext";
import questionMarkIcon from "public/images/icons/question_mark.svg";

const ResultLists = (props) => {
  const [activeFilter, setActiveFilter] = useState("all");
  const scopeContext = useScopeContext();

  const { extendedSearch, hasSearch, isFormVisible } = useSelector((state) => state.trainings);

  const filterButtonClicked = (filterButton) => {
    setActiveFilter(filterButton);
    filterLayers(filterButton);
  };

  const getBanner = () => {
    return (
      <div className="c-trainingresult-warning pl-4 py-3 mt-1">
        <div className="c-trainingresult-warningimg">
          <img src={questionMarkIcon} alt="Interrogation" />
        </div>
        <div className="c-trainingresult-warningtxt ml-2">
          Les résultats affichés concernent uniquement les offres d'apprentissage
        </div>
      </div>
    );
  };

  const getTrainingResult = () => {
    if (hasSearch && scopeContext.isTraining && (activeFilter === "all" || activeFilter === "trainings")) {
      return <div className="trainingResult">{getTrainingList()}</div>;
    } else {
      return "";
    }
  };

  const getTrainingList = () => {
    if (props.trainings.length) {
      return (
        <>
          {props.searchRadius < props.trainings[0].place.distance ? (
            <div className="bold px-3 py-3">
              Aucune formation ne correspondait à votre zone de recherche, nous avons trouvé les plus proches
            </div>
          ) : (
            ""
          )}
          {props.trainings.map((training, idx) => {
            return (
              <Training
                key={idx}
                training={training}
                handleSelectItem={props.handleSelectItem}
                searchForJobsOnNewCenter={props.searchForJobsOnNewCenter}
              />
            );
          })}
        </>
      );
    } else if (props.isTrainingSearchLoading) {
      return "Nous recherchons les formations, merci de patienter...";
    } else {
      return <div className="bold bg-white">Aucune formation trouvée pour votre recherche</div>;
    }
  };

  const getJobResult = () => {
    if (hasSearch && !props.isJobSearchLoading && (activeFilter === "all" || activeFilter === "jobs")) {
      if (props.allJobSearchError) return "";

      const jobCount = getJobCount(props.jobs);

      if (jobCount) {
        if (extendedSearch) {
          const mergedJobList = getMergedJobList();
          return <div className="jobResult">{mergedJobList ? <>{mergedJobList}</> : ""}</div>;
        } else {
          const peJobList = getPeJobList();
          const lbbCompanyList = getLbbCompanyList();
          return (
            <div className="jobResult">
              {peJobList || lbbCompanyList ? (
                <>
                  {peJobList}
                  {lbbCompanyList}
                  {jobCount < 100 ? (
                    <ExtendedSearchButton
                      title="Voir plus de résultats"
                      handleExtendedSearch={props.handleExtendedSearch}
                    />
                  ) : (
                    ""
                  )}
                </>
              ) : (
                <>
                  <NoJobResult />
                  <ExtendedSearchButton
                    title="Étendre la sélection"
                    hasJob="true"
                    handleExtendedSearch={props.handleExtendedSearch}
                  />
                </>
              )}
            </div>
          );
        }
      } else {
        if (extendedSearch) return <NoJobResult />;
        else
          return (
            <>
              <NoJobResult />
              <ExtendedSearchButton
                title="Étendre la sélection"
                hasJob="false"
                handleExtendedSearch={props.handleExtendedSearch}
              />
            </>
          );
      }
    } else {
      return "";
    }
  };

  const getJobCount = (jobs) => {
    let jobCount = 0;

    if (jobs) {
      if (jobs.peJobs) jobCount += jobs.peJobs.length;
      if (jobs.lbbCompanies) jobCount += jobs.lbbCompanies.length;
      if (jobs.lbaCompanies) jobCount += jobs.lbaCompanies.length;
    }

    return jobCount;
  };

  const getPeJobList = () => {
    if (props.jobs && props.jobs.peJobs && props.jobs.peJobs.length) {
      return (
        <>
          {props.jobs.peJobs.map((job, idx) => {
            return (
              <PeJob
                key={idx}
                job={job}
                handleSelectItem={props.handleSelectItem}
                searchForTrainingsOnNewCenter={props.searchForTrainingsOnNewCenter}
              />
            );
          })}
        </>
      );
      //} else return <div className="listText">Aucun poste pour ces critères de recherche</div>;
    } else return "";
  };

  const getLbbCompanyList = () => {
    const mergedLbaLbbCompanies = mergeOpportunities("onlyLbbLba");
    if (mergedLbaLbbCompanies.length) {
      return (
        <>
          {mergedLbaLbbCompanies.map((company, idx) => {
            return (
              <LbbCompany
                key={idx}
                company={company}
                handleSelectItem={props.handleSelectItem}
                searchForTrainingsOnNewCenter={props.searchForTrainingsOnNewCenter}
              />
            );
          })}
        </>
      );
    } else return "";
  };

  // fusionne les résultats lbb et lba et les trie par ordre croissant de distance, optionnellement intègre aussi les offres PE
  const mergeOpportunities = (onlyLbbLbaCompanies) => {
    let mergedArray = [];
    let resultSources = 0;
    if (props.jobs) {
      if (props.jobs.lbbCompanies && props.jobs.lbbCompanies.length) {
        mergedArray = props.jobs.lbbCompanies;
        resultSources++;
      }

      if (props.jobs.lbaCompanies && props.jobs.lbaCompanies.length) {
        mergedArray = mergedArray.concat(props.jobs.lbaCompanies);
        resultSources++;
      }

      if (!onlyLbbLbaCompanies && props.jobs.peJobs && props.jobs.peJobs.length > 0) {
        mergedArray = mergedArray.concat(props.jobs.peJobs);
        resultSources++;
      }

      if (resultSources > 1)
        mergedArray.sort((a, b) => {
          let dA = a.place.distance;
          let dB = b.place.distance;

          if (dA > dB) return 1;
          if (dA < dB) return -1;
          return 0;
        });
    }

    return mergedArray;
  };

  // retourne le bloc construit des items lbb, lba et pe triés par ordre de distance
  const getMergedJobList = () => {
    const mergedOpportunities = mergeOpportunities();

    if (mergedOpportunities.length) {
      return (
        <>
          {mergedOpportunities.map((opportunity, idx) => {
            if (opportunity.ideaType === "peJob")
              return (
                <PeJob
                  key={idx}
                  job={opportunity}
                  handleSelectItem={props.handleSelectItem}
                  searchForTrainingsOnNewCenter={props.searchForTrainingsOnNewCenter}
                />
              );
            else
              return (
                <LbbCompany
                  key={idx}
                  company={opportunity}
                  handleSelectItem={props.handleSelectItem}
                  searchForTrainingsOnNewCenter={props.searchForTrainingsOnNewCenter}
                />
              );
          })}
        </>
      );
    } else return "";
  };

  // construit le bloc formaté avec les décomptes de formations et d'opportunités d'emploi
  const getResultCountAndLoading = () => {
    if (props.allJobSearchError && props.trainingSearchError) return "";

    let count = 0;
    let trainingCount = 0;
    let trainingPart = "";
    let trainingLoading = "";

    if (scopeContext.isTraining) {
      if (props.isTrainingSearchLoading) {
        trainingLoading = (
          <span className="trainingColor">
            <div className="searchLoading">
              Recherche des formations en cours
              <Spinner />
            </div>
          </span>
        );
      } else if (!props.trainingSearchError) {
        trainingCount = props.trainings ? props.trainings.length : 0;

        //trainingCount = 0;

        count += trainingCount;

        trainingPart = `${trainingCount === 0 ? "Aucune formation" : trainingCount}`;

        if (trainingCount === 1) {
          trainingPart += " formation";
        } else if (trainingCount > 1) {
          trainingPart += " formations";
        }
      }
    }

    let jobPart = "";
    let jobLoading = "";
    let jobCount = 0;

    if (scopeContext.isJob) {
      if (props.isJobSearchLoading) {
        jobLoading = (
          <span className="jobColor">
            <div className="searchLoading">
              Recherche des entreprises en cours
              <Spinner />
            </div>
          </span>
        );
      } else if (!props.allJobSearchError) {
        jobCount = getJobCount(props.jobs);

        //jobCount = 0;

        count += jobCount;

        jobPart = `${jobCount === 0 ? "aucune entreprise" : jobCount}`;

        if (jobCount === 1) {
          jobPart += " entreprise";
        } else if (jobCount > 1) {
          jobPart += " entreprises";
        }
      }
    }

    let correspondText = `${count === 0 ? " ne" : ""}${
      count <= 1 ? " correspond" : " correspondent"
    } à votre recherche`;

    return (
      <div className="c-result-lists">
        <div className="resultTitle">
          {(scopeContext.isTraining && !trainingLoading) || (scopeContext.isJob && !jobLoading) ? (
            <>
              <span className="c-resultlist-correspond c-resultlist-correspond--bold">
                {trainingPart} {trainingPart && jobPart ? " et " : ""} {jobPart}{" "}
              </span>
              <span className="c-resultlist-correspond c-resultlist-correspond--light">{correspondText}</span>
            </>
          ) : (
            ""
          )}
          {trainingLoading ? (
            <>
              <br />
              <br />
              {trainingLoading}
            </>
          ) : (
            ""
          )}
          {jobLoading ? (
            <>
              <br />
              <br />
              {jobLoading}
            </>
          ) : (
            ""
          )}
        </div>
        {!trainingLoading && !jobLoading && scopeContext.isJob && scopeContext.isTraining ? (
          <div className="filterButtons">
            <FilterButton
              type="all"
              isActive={activeFilter === "all" ? true : false}
              handleFilterButtonClicked={filterButtonClicked}
            />
            <FilterButton
              type="trainings"
              count={trainingCount}
              isActive={activeFilter === "trainings" ? true : false}
              handleFilterButtonClicked={filterButtonClicked}
            />
            <FilterButton
              type="jobs"
              count={jobCount}
              isActive={activeFilter === "jobs" ? true : false}
              handleFilterButtonClicked={filterButtonClicked}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    );
  };

  // construit le bloc formaté avec les erreurs remontées
  const getErrorMessages = () => {
    return props.trainingSearchError && props.allJobSearchError ? (
      <ErrorMessage message="Erreur technique momentanée" type="column" />
    ) : (
      <>
        {props.trainingSearchError ? <ErrorMessage message={props.trainingSearchError} /> : ""}
        {props.jobSearchError ? <ErrorMessage message={props.jobSearchError} /> : ""}
      </>
    );
  };

  return (
    <div className={isFormVisible || props.selectedItem ? "hiddenResultList" : ""}>
      <header>
        <LogoIdea showSearchForm={props.showSearchForm} />
      </header>
      <div className="clearBoth" />
      {getResultCountAndLoading()}
      {getErrorMessages()}
      {getBanner()}
      {getTrainingResult()}
      {getJobResult()}
    </div>
  );
};

export default ResultLists;
