import React from "react";
import Navigation from "components/navigation";
import ScrollToTop from "components/ScrollToTop";
import Breadcrumb from "components/breadcrumb";

import Footer from "components/footer";

const AccesRecruteur = () => (
  <div>
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="acces-recruteur" label="Accès recruteur" />

    <div className="c-page-container container my-0 mb-sm-5 p-5">
      <div className="row">
        <div className="col-12 col-md-5">
          <h1>
            <span className="d-block c-page-title is-color-2">Informations Recruteur</span>
          </h1>
          <hr className="c-page-title-separator" align="left" />
        </div>

        <div className="col-12 col-md-7">
          <p className="mb-3">Dernière mise à jour le : 06/05/2021</p>
          <section>
            <h2 className="mb-3 h3">Conditions d’affichage des offres d’emploi sur La Bonne Alternance</h2>
            <p>
              Seules les offres d’emploi en contrat d’apprentissage et en contrat de professionnalisation sont visibles sur La Bonne Alternance.
            </p>
            <p>
              Nous consommons l’API offres de Pôle emploi : par conséquent, votre offre d’emploi est visible sur La Bonne Alternance si :
            </p>
            <ul>
              <li>vous l’avez publiée sur 
                &nbsp;                
                <a
                  href="https://pole-emploi.fr"
                  target="_blank"
                  className=""
                  rel="noopener noreferrer"
                >
                  <img className="mt-n1" src="/images/square_link.svg" alt="Lien pole-emploi.fr" />
                  <span className="ml-1">pole-emploi.fr</span>
                </a>
                &nbsp;
                ou
                &nbsp;
                <a
                  href="https://1jeunesolution.gouv.fr"
                  target="_blank"
                  className=""
                  rel="noopener noreferrer"
                >
                  <img className="mt-n1" src="/images/square_link.svg" alt="Lien 1jeunesolution.gouv.fr" />
                  <span className="ml-1">1jeunesolution.gouv.fr</span>
                </a>
              </li>
              <li>vous l’avez publiée auprès de l’un des partenaires de 
                  &nbsp;                
                  <a
                    href="https://pole-emploi.fr"
                    target="_blank"
                    className=""
                    rel="noopener noreferrer"
                  >
                    <img className="mt-n1" src="/images/square_link.svg" alt="Lien pole-emploi.fr" />
                    <span className="ml-1">Pôle Emploi</span>
                  </a>, et que ce dernier a ouvert la multidiffusion de votre offre</li>
              <li>vous utilisez l’API "Je transfère mes offres" qui permet à Pôle emploi de recueillir directement votre offre depuis votre SIRH, et que l'option "multidiffusion" de l'offre est activée</li>
              <li>vous utilisez un multiposteur qui a opté pour la multidiffusion de votre offre à Pôle emploi</li>
              <li>vous avez conclu un partenariat d’agrégation de vos offres par Pôle emploi, que vous avez opté pour la multidiffusion.</li>
            </ul>
            <p>Bientôt, nous expérimenterons un autre canal de recueil de besoins en recrutement (
              <a
                href="https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/untitled"
                target="_blank"
                className=""
                rel="noopener noreferrer"
              >
                <img className="mt-n1" src="/images/square_link.svg" alt="Lien matcha" />
                <span className="ml-1">projet Matcha</span>
              </a>
              ).</p>
          </section>
          <section className="mt-4">
            <h2 className="mb-3 h3">Condition d’affichage des entreprises sans offre, pour réception de candidatures spontanées</h2>
            <p>
              Les entreprises présentes sur La Bonne Alternance sans offre d’emploi sont identifiées grâce à un algorithme prédictif. Ce dernier analyse les recrutements en alternance des 6 années passées afin de prédire ceux des 6 mois à venir.
            </p>
            <p>
              La liste d’entreprises est mise à jour tous les mois. Vous pouvez demander le référencement ou le déréférencement sur La Bonne Alternance grâce à ce 
              &nbsp;
              <a
                href="https://labonneboite.pole-emploi.fr/informations-entreprise/action"
                target="_blank"
                className=""
                rel="noopener noreferrer"
              >
                <img className="mt-n1" src="/images/square_link.svg" alt="Lien formulaire la bonne boîte" />
                <span className="ml-1">formulaire</span>.
              </a>
              &nbsp;
            </p>  
          </section>
          <section className="mt-4">
            <h2 className="mb-3 h3">Vous souhaitez modifier vos coordonnées de contact ou obtenir une autre information ?</h2>
            <p>
              Accédez à ce 
              &nbsp;
              <a
                href="https://labonneboite.pole-emploi.fr/informations-entreprise/action"
                target="_blank"
                className=""
                rel="noopener noreferrer"
                >
                <img className="mt-n1" src="/images/square_link.svg" alt="Lien formulaire la bonne boîte" />
                <span className="ml-1">formulaire</span>
              </a>
              &nbsp;
              pour nous transmettre votre demande.
            </p>  
          </section>
        </div>
      </div>
    </div>
    <div className="mb-3">&nbsp;</div>
    <Footer />
  </div>
);

export default AccesRecruteur;
