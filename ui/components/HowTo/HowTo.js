import React from "react"
import howto1 from "../../public/images/howto1.svg"
import howto2 from "../../public/images/howto2.svg"
import howto3 from "../../public/images/howto3.svg"
import howtoline1 from "../../public/images/howtoline1.svg"
import howtoline2a from "../../public/images/howtoline2a.svg"
import howtoline3a from "../../public/images/howtoline3a.svg"
import howtoline3b from "../../public/images/howtoline3b.svg"

const HowTo = () => {
  return (
    <>
      <section className="c-howto container">
        <div className="c-howto-cards card-deck">
          <div className="card border-0 position-relative">
            <img src={howto1} className="card-img-top" alt="" />
            <img src={howtoline1} className="position-absolute c-homebg-img c-homebg-img--line c-homebg-img--line1" alt="" />
            <div className="card-body">
              <h5 className="card-title">Le job de vos rêves</h5>
              <p className="card-text">Renseignez le métier que vous souhaitez faire et la localisation (Ville ou Code postal)</p>
            </div>
          </div>
          <div className="card border-0  position-relative">
            <img src={howto2} className="card-img-top" alt="" />
            <img src={howtoline2a} className="position-absolute c-homebg-img c-homebg-img--line c-homebg-img--line2a" alt="" />
            <div className="card-body">
              <h5 className="card-title">En un clin d’&oelig;il</h5>
              <p className="card-text">Obtenez la liste des formations et entreprises proches de chez vous dans le domaine recherché.</p>
            </div>
          </div>
          <div className="card border-0  position-relative">
            <img src={howto3} className="card-img-top" alt="" />
            <img src={howtoline3a} className="position-absolute c-homebg-img c-homebg-img--line c-homebg-img--line3a" alt="" />
            <img src={howtoline3b} className="position-absolute c-homebg-img c-homebg-img--line c-homebg-img--line3b" alt="" />
            <div className="card-body">
              <h5 className="card-title">Un contact facile</h5>
              <p className="card-text">Contactez facilement les centres de formation ou les entreprises pour postuler </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default HowTo
