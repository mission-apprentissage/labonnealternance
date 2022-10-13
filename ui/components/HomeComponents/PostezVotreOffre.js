import React from "react";

const PostezVotreOffre = () => {
  return (
    <section className="p-3 mb-2 mb-md-5">
      <div className="row">
        <div className="col-12 col-md-6">
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-offreemploi.svg" alt="" />
        </div>
        <div className="col-12 col-md-6 pt-md-5">
          <h2 className="c-homecomponent-title__small mb-3">Postez votre offre d’alternance en quelques secondes</h2>
          <div>
            Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans
            votre compte en vous connectant avec votre email uniquement.
          </div>
        </div>
      </div>
    </section>
  );
};

export default PostezVotreOffre;
