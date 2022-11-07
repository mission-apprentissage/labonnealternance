import React from "react";
import TagCandidatureSpontanee from "../../components/ItemDetail/TagCandidatureSpontanee.js";
import ExternalLink from "../externalLink";
import gotoIcon from "../../public/images/icons/goto.svg";

const DidYouKnow = ({ item }) => {
  return (
    <>
      <div className="c-detail-body c-locationdetail mt-4">
        <h2 className="c-locationdetail-title mt-2">Le saviez-vous ?</h2>
        <p className="c-didyouknow-paragraph">
          Diversifiez vos démarches en envoyant aussi des candidatures spontanées aux entreprises qui n&apos;ont pas diffusé
          d&apos;offre! Repérez les tags suivants dans la liste de résultats
        </p>
        <p>
          <TagCandidatureSpontanee />
        </p>
        <p className="pb-3">
          <span className="d-block">Un employeur vous a proposé un entretien ?</span>
          <span className="d-block">
            <span className="c-detail-traininglink c-detail-traininglink--strong">
              <ExternalLink
                className="gtmDidask2  c-nice-link"
                url="https://dinum-beta.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
                title="On vous donne des conseils pour vous aider à le préparer."
                withPic={<img src={gotoIcon} alt="Ouverture dans un nouvel onglet" />}
              />
              <br/>
              <a href="https://media.giphy.com/media/3oz8xG0CiDpXqYXCz6/giphy.gif" className="c-candidature-link" target="_blank" rel="noreferrer">
                Donner mon avis sur cette entreprise.
              </a>
            </span>
          </span>
        </p>
      </div>
    </>
  );
};

export default DidYouKnow;
