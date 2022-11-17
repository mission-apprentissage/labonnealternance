import React from "react"

import homereview from "../../public/images/homereview.svg"
import { some, values } from "lodash"
import ExternalLink from "../externalLink"

const HomeReview = (props) => {
  return (
    <>
      {some(values(props?.reviews)) ? (
        <section className="c-home-review container mb-0 mb-sm-5 p-4">
          <div className="row">
            <div className="col-12 col-lg-4">
              <div className="d-flex-center h-100">
                <img src={homereview} className="card-img-top c-home-review__img" alt="Une dame dit bonjour" />
              </div>
            </div>
            <div className="col-12 col-lg-8">
              <div className="c-home-review-content">
                <p className="pt-5 pt-md-2">
                  {props?.reviews?.PETIT_TITRE_1 ? (
                    <>
                      <strong>{props.reviews.PETIT_TITRE_1}</strong>
                    </>
                  ) : (
                    <></>
                  )}
                </p>
                <h2 className="c-home-review-title">
                  {props?.reviews?.GROS_TITRE_2 ? (
                    <>
                      <strong>{props.reviews.GROS_TITRE_2}</strong>
                    </>
                  ) : (
                    <></>
                  )}
                </h2>
                <p className="m-0">{props?.reviews?.TEXTE_1_NON_GRAS ? <>{props.reviews.TEXTE_1_NON_GRAS}</> : <></>}</p>
                <p className="pt-2">
                  {props?.reviews?.TEXTE_2_GRAS ? (
                    <>
                      <strong>{props.reviews.TEXTE_2_GRAS}</strong>
                    </>
                  ) : (
                    <></>
                  )}
                </p>

                {props?.reviews?.URL_CTA ? (
                  <>
                    <ExternalLink
                      className="btn btn-outline-primary px-1 px-sm-5 mt-3"
                      url={props.reviews.URL_CTA}
                      title={<span className="d-inline px-3 px-sm-0">{props?.reviews?.LIBELLE_CTA || "Voir"}</span>}
                    />
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        ""
      )}
    </>
  )
}

export default HomeReview
