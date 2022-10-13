import React from "react";

import gotoIcon from "public/images/icons/goto.svg";
import ExternalLink from "../externalLink";

const DidAsk1 = () => {
  return (
    <div className="c-detail-advice-text">
      <p>
        Trouver et convaincre une entreprise de vous embaucher ? On vous donne
        <span className="c-detail-traininglink ml-1">
          <ExternalLink
            className="gtmDidask1"
            url="https://dinum-beta.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
            title="des conseils pour vous aider !"
            withPic={<img src={gotoIcon} alt="Lien" />}
          />
        </span>
      </p>
    </div>
  );
};

export default DidAsk1;
