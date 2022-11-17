import React from "react";
import Link from "next/link";
import { Row, Col, Container } from "reactstrap";
import ExternalLink from "./externalLink";
import { useRouter } from "next/router";

const Footer = (props) => {
  const router = useRouter();

  return (
    <>
      <nav className="c-footer c-footer--one py-4 border-bottom">
        <Container>
          <Row>
            <Col className="col-12 col-lg-3">
              <img
                src="/images/marianne.svg#svgView(viewBox(0 0 162 78))"
                alt=""
                width="290"
                height="130"
              />
            </Col>
            <Col className="col-12 col-lg-3">
              <div className="c-footer-francerelance">
                <img
                  src="/images/france_relance.svg"
                  alt=""
                  width="81"
                  height="81"
                />
              </div>
            </Col>
            <Col className="col-12 col-lg-6 c-footer-text">
              <div>La bonne alternance. Trouvez votre alternance.</div>
              <div className="mt-4">La bonne alternance est proposée par les services suivants :</div>
              <div className="mt-4 c-footer-official-links">
                <ExternalLink className="c-footer-official-link" url="https://pole-emploi.fr" aria-label="Accès au site de Pôle emploi" title="pole-emploi.fr" />
                <ExternalLink
                  className="c-footer-official-link"
                  url="https://gouvernement.fr"
                  aria-label="Accès au site gouvernement.fr"
                  title="gouvernement.fr"
                />
                <ExternalLink
                  className="c-footer-official-link"
                  url="https://service-public.fr"
                  aria-label="Accès au site service-public.fr"
                  title="service-public.fr"
                />
                <ExternalLink className="c-footer-official-link" url="https://data.gouv.fr" aria-label="Accès au site data.gouv" title="data.gouv.fr" />
              </div>
            </Col>
          </Row>
        </Container>
      </nav>
      <nav className="c-footer pt-2 pb-5">
        <Container>
          <Row>
            <Col className="col-12">
              <ul className="c-footer-links">
                <li className="c-footer-links__line">
                  <Link href="/mentions-legales">
                    <a
                      className="c-footer-links__link c-footer-smallword pr-3" aria-label="Accès aux mentions légales"
                    >
                      Mentions légales
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/cgu">
                    <a
                      className="c-footer-links__link c-footer-smallword" aria-label="Accès aux conditions générales d'utilisation"
                    >
                      CGU
                    </a>
                    </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/cookies">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la page Cookies">
                      Cookies
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/stats">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès aux statistiques du service">
                      Statistiques
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/faq">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la foire aux questions">
                      FAQ
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/contact">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la page Contact">
                      Contact
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/metiers">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la page Métiers">
                      Métiers
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/a-propos">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la page A propos">
                      A propos
                    </a>
                  </Link>
                </li>

                <li className="c-footer-links__line">
                  <Link href="/developpeurs">
                    <a className="c-footer-links__link c-footer-smallword" aria-label="Accès à la page Développeurs">
                      Développeurs
                    </a>
                  </Link>
                </li>
                <li className="c-footer-links__line">
                  <a className="c-footer-links__link c-footer-smallword">Accessibilité : non conforme</a>
                </li>
              </ul>
            </Col>
            <Col className="col-12">
              <div className="c-footer-smallword c-footer-lastword">
                Sauf mention contraire, tous les contenus de ce site sont sous licence{" "}
                <ExternalLink
                  url="https://www.etalab.gouv.fr/licence-version-2-0-de-la-licence-ouverte-suite-a-la-consultation-et-presentation-du-decret"
                  aria-label="Accès au site Etalab"
                  title="etalab-2.0"
                  withPic={<img className="ml-1" src="/images/square_link.svg" alt="Ouverture dans un nouvel onglet" />}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </nav>
    </>
  );
};

export default Footer;
