import React, { useState } from "react"
import Link from "next/link"
import { Collapse, NavbarToggler, Nav, NavItem, NavLink } from "reactstrap"

const SatisfactionFormNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)

  return (
    <div className="c-navigation is-filled">
      <nav className="navbar-light navbar navbar-expand-lg">
        <div className="container">
          <Link href="/">
            <a className="navbar-brand">
              <img src="/images/logo_lba.svg" alt="Retournez à la page d'accueil de La bonne alternance" className="c-navbar-brand-img" width="110" height="76" />
            </a>
          </Link>
          <NavbarToggler onClick={toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav className="c-navbar-links ml-auto" navbar>
              <NavItem className="ml-lg-5">
                <NavLink href="/" className="ml-1 c-formulaire-satisfaction-navlink">
                  Page d&apos;accueil La bonne alternance
                </NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </div>
      </nav>
    </div>
  )
}

export default SatisfactionFormNavigation
