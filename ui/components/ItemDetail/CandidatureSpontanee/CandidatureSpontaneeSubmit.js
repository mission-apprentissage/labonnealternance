import React from "react";
import { Spinner } from "reactstrap";
import { amongst } from "../../../utils/arrayutils";
import { capitalizeFirstLetter } from "../../../utils/strutils";

const CandidatureSpontaneeSubmit = (props) => {
  const sendingState = props.sendingState;
  const kind = props?.item?.ideaType || "";

  let res = <></>;
  if (sendingState === "not_sent") {
    res = (
      <button
        aria-label="je-postule"
        className={`btn btn-dark btn-dark-action c-candidature-submit c-candidature-submit--default gtmEnvoiCandidature gtm${capitalizeFirstLetter(
          kind
        )}`}
        type="submit"
      >
        {amongst(kind, ["lbb", "lba"]) ? "J'envoie ma candidature spontanée" : "J'envoie ma candidature"}
      </button>
    );
  } else if (sendingState === "ok_sent") {
    res = <span className="c-candidature-submit-ok">Succès</span>;
  } else if (sendingState === "currently_sending") {
    res = (
      <span className="c-candidature-submit-sending">
        <Spinner color="primary" /> Veuillez patienter
      </span>
    );
  } else if (sendingState === "not_sent_because_of_errors") {
    res = <span className="c-candidature-submit-error">Erreur lors de l'envoi, veuillez réessayer plus tard</span>;
  }
  return res;
};

export default CandidatureSpontaneeSubmit;
