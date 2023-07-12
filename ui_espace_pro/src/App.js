import { Box } from "@chakra-ui/react"
import { useEffect } from "react"
import { Helmet } from "react-helmet"
import { Navigate, Route, Routes } from "react-router-dom"
import { AUTHTYPE } from "./common/contants"
import useAuth from "./common/hooks/useAuth"
import { isUserAdmin } from "./common/utils/rolesUtils"
import { Layout, MailActionsOnOffre } from "./components"
import DashboardPage from "./pages/Admin/DashboardPage"
import WidgetParametersEditPage from "./pages/Admin/widgetParameters/pages/EditPage"
import WidgetParametersSearchPage from "./pages/Admin/widgetParameters/pages/SearchPage"
import {
  Account,
  AdministrationOpco,
  CreationEntreprise,
  CreationEntrepriseDetail,
  CreationOffre,
  DetailEntreprise,
  EditionEntrepriseContact,
  ListeEntreprise,
  ListeOffre,
  Users,
} from "./pages/Administration"
import {
  AuthValidation,
  CompteEnAttente,
  ConfirmationCreationCompte,
  ConfirmationValidationEmail,
  Connexion,
  CreationCompte,
  InformationCreationCompte,
  OptOutValidation,
  RedirectAfterAuth,
} from "./pages/Authentification"
import { FormCreatePage } from "./pages/Candidat/FormCreatePage"
import { FormRecapPage } from "./pages/Candidat/FormRecapPage"
import { CfaCandidatInformationPage } from "./pages/CfaCandidatInformationPage/CfaCandidatInformationPage"
import { DepotRapide_AjouterVoeux, DepotRapide_AjouterVoeuxMiseEnRelation, DepotRapide_Fin } from "./pages/Formulaire"
import Layout2 from "./pages/Layout"
import LoginPage from "./pages/LoginPage"
import OptOutUnsubscribe from "./pages/OptOutUnsubscribe"
import PremiumForm from "./pages/PremiumForm"
import PremiumAffelnetForm from "./pages/PremiumAffelnetForm"
import { PropositionOffreId } from "./pages/Proposition/Offre/PropositionOffreId"
import Widget from "./pages/Widget"

function RedirectTo404() {
  useEffect(() => {
    window.location.replace("/404")
  }, [])
  return null
}

function RedirectToLba() {
  useEffect(() => {
    window.location.replace("/")
  }, [])
  return null
}

function PrivateRoute({ children }) {
  let [auth] = useAuth()

  return auth.sub !== "anonymous" ? children : <Navigate to="/" />
}
function AdminRoute({ children }) {
  let [auth] = useAuth()

  return auth.type === AUTHTYPE.ADMIN ? children : <Navigate to="/" />
}

const AdminRdvaRoute = ({ children }) => {
  const [auth] = useAuth()
  const isAdmin = isUserAdmin(auth)

  return isAdmin ? <Layout2>{children}</Layout2> : <Navigate to="/admin/login" />
}

const App = () => {
  return (
    <Box>
      <Helmet>
        <script defer data-domain={window.location.hostname} src="https://plausible.io/js/script.local.hash.outbound-links.js" />
      </Helmet>
      <Routes>
        <Route
          path="/compte"
          element={
            <PrivateRoute>
              <Account />
            </PrivateRoute>
          }
        />
        <Route
          path="/administration"
          element={
            <PrivateRoute>
              <Layout footer={false} />
            </PrivateRoute>
          }
        >
          <Route
            path="users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="users/:userId"
            element={
              <AdminRoute>
                <DetailEntreprise />
              </AdminRoute>
            }
          />
          <Route index element={<ListeEntreprise />} />
          <Route path="opco" element={<AdministrationOpco />} />
          <Route path="opco/entreprise/:userId" element={<DetailEntreprise />} />
          <Route path="opco/entreprise/:siret/:establishment_id" element={<ListeOffre />} />
          <Route path="opco/entreprise/:siret/:establishment_id/offre/:jobId" element={<CreationOffre />} />
          <Route path="entreprise" element={<CreationEntreprise />} />
          <Route path="entreprise/:establishment_id" element={<ListeOffre />} />
          <Route path="entreprise/:establishment_id/offre/:jobId" element={<CreationOffre />} />
          <Route path="entreprise/detail" element={<CreationEntrepriseDetail />} />
          <Route path="entreprise/:establishment_id/edition" element={<EditionEntrepriseContact />} />
        </Route>
        <Route path="/authentification" element={<Connexion />} />
        <Route path="/creation/entreprise" element={<CreationCompte type={AUTHTYPE.ENTREPRISE} widget={false} />} />
        <Route path="/creation/entreprise/:origin" element={<CreationCompte type={AUTHTYPE.ENTREPRISE} widget={false} />} />
        <Route path="/creation/cfa" element={<CreationCompte type={AUTHTYPE.CFA} />} />
        <Route path="/creation/cfa/:origin" element={<CreationCompte type={AUTHTYPE.CFA} />} />
        <Route path="/creation/detail" element={<InformationCreationCompte />} />
        <Route path="/creation/offre" element={<DepotRapide_AjouterVoeux />} />
        <Route path="/creation/mise-en-relation" element={<DepotRapide_AjouterVoeuxMiseEnRelation />} />
        <Route path="/creation/fin" element={<DepotRapide_Fin />} />
        {/* Deprecated route, can be deleted on 03/2023 */}
        <Route path="/proposition/formulaire/:idFormulaire/offre/:jobId" element={<Layout displayNavigationMenu={false} />}>
          <Route index element={<PropositionOffreId />} />
        </Route>
        <Route path="/proposition/formulaire/:idFormulaire/offre/:jobId/siret/:siretFormateur" element={<Layout displayNavigationMenu={false} />}>
          <Route index element={<PropositionOffreId />} />
        </Route>
        <Route path="/authentification/confirmation" element={<ConfirmationCreationCompte />} />
        <Route path="/authentification/validation/:id" element={<ConfirmationValidationEmail />} />
        <Route path="/authentification/verification" element={<AuthValidation />} />
        <Route path="/authentification/validation" element={<RedirectAfterAuth />} />
        <Route path="/authentification/optout/verification" element={<OptOutValidation />} />
        <Route path="/authentification/en-attente" element={<CompteEnAttente />} />
        <Route path="/" element={<RedirectToLba />} />
        <Route path="/offre/:jobId/:option" element={<MailActionsOnOffre />} />
        <Route path="/widget/:origin" element={<CreationCompte type={AUTHTYPE.ENTREPRISE} widget={true} />} />
        {/* RDVA */}
        <Route path="/form" element={<FormCreatePage />} />
        <Route path="/form/confirm/:id" element={<FormRecapPage />} />
        <Route path="/form/opt-out/unsubscribe/:id" element={<OptOutUnsubscribe />} />
        <Route path="/form/premium/affelnet/:id" element={<PremiumAffelnetForm />} />
        <Route path="/form/premium/:id" element={<PremiumForm />} />
        <Route path="/widget/tutorial" element={<Widget />} />
        <Route path="/establishment/:establishmentId/appointments/:appointmentId" element={<CfaCandidatInformationPage />} />
        <Route
          path="/admin"
          element={
            <AdminRdvaRoute>
              <DashboardPage />
            </AdminRdvaRoute>
          }
        />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin/widget-parameters/search"
          element={
            <AdminRdvaRoute>
              <WidgetParametersSearchPage />
            </AdminRdvaRoute>
          }
        />
        <Route
          path="/admin/widget-parameters/edit/:id"
          element={
            <AdminRdvaRoute>
              <WidgetParametersEditPage />
            </AdminRdvaRoute>
          }
        />
        <Route path="*" element={<RedirectTo404 />} />
      </Routes>
    </Box>
  )
}

export default App
