import React, { useEffect } from "react";
import { get } from "lodash";

const CommonDetail = ({ thing }) => {
  useEffect(() => {
    try {
      document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0);
    } catch (err) {}
  });

  return (
    <>
      <main className="c-detail-body">
        <div className="c-detail-company">
          {get(thing, "company.name", "Une entreprise")}
          <span className="c-detail-proposal"> propose actuellement cette offre</span>
        </div>
      </main>
    </>
  );
};

export default CommonDetail;
