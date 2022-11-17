import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem } from 'reactstrap'

const Navigation = ({ currentPage, bgcolor }) => {
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)

  let main_class_name = 'c-navigation '
  main_class_name += bgcolor ?? 'is-filled'

  const getLogo = () => {
    let logo = 'logo_LBA_candidat.svg'

    if (currentPage === 'acces-recruteur') {
      logo = 'logo_LBA_recruteur.svg'
    } else if (currentPage === 'organisme-de-formation') {
      logo = 'logo_LBA_cfa.svg'
    }

    return logo
  }

  const getLogoTargetUrl = () => {
    let url = '/'
    if (currentPage === 'acces-recruteur' || currentPage === 'organisme-de-formation') {
      url += currentPage
    }

    return url
  }

  return (
    <div className={main_class_name}>
      <Navbar expand='lg' className='navbar-light'>
        <div className='container px-0'>
          <NavbarBrand
            href={getLogoTargetUrl()}
            onClick={(e) => {
              e.preventDefault()
              router.push(getLogoTargetUrl())
            }}
          >
            <img
              src='/images/marianne.svg#svgView(viewBox(12 0 162 78))'
              alt="Redirection vers la page d'accueil"
              width='162'
              height='78'
              className='c-marianne-header'
            />
            <img
              src={`/images/${getLogo()}`}
              alt="Redirection vers la page d'accueil"
              className='c-navbar-brand-img'
              width='110'
              height='76'
            />
          </NavbarBrand>
          <NavbarToggler onClick={toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav className='c-navbar-links ml-auto' navbar>
              <NavItem className={`ml-lg-5 mr-2 ${!currentPage ? 'selected' : ''}`}>
                <Link href='/'>
                  <a className='nav-link' aria-label='Accès espace candidat'>
                    <span className='mx-1'>Candidat</span>
                  </a>
                </Link>
              </NavItem>

              <div className='c-navigation__separator'></div>

              <NavItem className={`mr-2 ml-lg-2 ${currentPage === 'acces-recruteur' ? 'selected' : ''}`}>
                <Link href='/acces-recruteur'>
                  <a className='nav-link' aria-label='Accès espace recruteur'>
                    <span className='mx-1'>Recruteur</span>
                  </a>
                </Link>
              </NavItem>

              <div className='c-navigation__separator'></div>

              <NavItem className={`ml-lg-2 ${currentPage === 'organisme-de-formation' ? 'selected' : ''}`}>
                <Link href='/organisme-de-formation'>
                  <a className='nav-link' aria-label='Accès espace organisme de formation'>
                    <span className='mx-1'>Organisme de formation</span>
                  </a>
                </Link>
              </NavItem>

              {currentPage === 'acces-recruteur' || currentPage === 'organisme-de-formation' ? (
                <>
                  <div className='ml-2 c-navigation__separator'></div>
                  <NavItem className='ml-lg-2'>
                    <Link href='/espace-pro/authentification'>
                      <a className='nav-link' aria-label='Connexion'>
                        <img className='c-homecomponent-bluelock mr-2' src='/images/icons/blue_lock.svg' alt='Locking tool' />
                        <span className='mx-1'>Connexion</span>
                      </a>
                    </Link>
                  </NavItem>
                </>
              ) : (
                ''
              )}
            </Nav>
          </Collapse>
        </div>
      </Navbar>
    </div>
  )
}

export default Navigation
