import React from "react";

import gotoIcon from "public/images/icons/goto.svg";
import ExternalLink from "../externalLink";

const DidAsk2 = () => {
  return (
    <div className="c-detail-advice-text">
      <p>
        Un employeur vous a proposé un entretien ? Préparez-le en vous aidant de
        <span className="c-detail-traininglink ml-1">
          <ExternalLink
            className="gtmDidask2"
            url="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
            title="ces cas pratiques !"
            withPic={<img src={gotoIcon} alt="Lien" />}
          />
        </span>
        <span className="ml-1"> !</span>
      </p>
    </div>
  );
};

export default DidAsk2;
