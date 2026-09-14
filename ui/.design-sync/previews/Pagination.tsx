import { Pagination } from "lba-ds"

export const ResultatsOffres = () => <Pagination count={12} defaultPage={3} getPageLinkProps={(page) => ({ href: `/recherche/apprentissage?page=${page}` })} />

export const AvecExtremites = () => <Pagination count={24} defaultPage={7} showFirstLast getPageLinkProps={(page) => ({ href: `/emploi/alternance?page=${page}` })} />

export const PeuDeResultats = () => <Pagination count={3} defaultPage={1} getPageLinkProps={(page) => ({ href: `/cfa/formations?page=${page}` })} />
