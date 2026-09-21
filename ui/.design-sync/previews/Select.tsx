import { Select } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <Select label="Type de contrat souhaité" hint="Choisissez le contrat correspondant à votre projet" nativeSelectProps={{ defaultValue: "apprentissage" }}>
      <option value="apprentissage">Contrat d'apprentissage</option>
      <option value="professionnalisation">Contrat de professionnalisation</option>
      <option value="stage">Stage de découverte</option>
    </Select>
  </div>
)

export const NiveauDiplome = () => (
  <div style={{ maxWidth: 480 }}>
    <Select label="Niveau de diplôme préparé" nativeSelectProps={{ defaultValue: "5" }}>
      <option value="3">CAP, BEP (niveau 3)</option>
      <option value="4">Bac, Bac Pro (niveau 4)</option>
      <option value="5">BTS, BUT, DEUG (niveau 5)</option>
      <option value="6">Licence, Bachelor (niveau 6)</option>
      <option value="7">Master, Diplôme d'ingénieur (niveau 7)</option>
    </Select>
  </div>
)

export const Success = () => (
  <div style={{ maxWidth: 480 }}>
    <Select label="Région de l'alternance" state="success" stateRelatedMessage="12 offres disponibles dans cette région" nativeSelectProps={{ defaultValue: "ara" }}>
      <option value="idf">Île-de-France</option>
      <option value="ara">Auvergne-Rhône-Alpes</option>
      <option value="pdl">Pays de la Loire</option>
    </Select>
  </div>
)

export const Erreur = () => (
  <div style={{ maxWidth: 480 }}>
    <Select label="Rythme d'alternance" state="error" stateRelatedMessage="Veuillez sélectionner un rythme pour continuer" nativeSelectProps={{ defaultValue: "" }}>
      <option value="" disabled>
        Sélectionnez un rythme
      </option>
      <option value="1s2s">1 semaine CFA / 1 semaine entreprise</option>
      <option value="3j2j">3 jours entreprise / 2 jours CFA</option>
    </Select>
  </div>
)

export const Disabled = () => (
  <div style={{ maxWidth: 480 }}>
    <Select label="Établissement de formation (CFA)" disabled nativeSelectProps={{ defaultValue: "cfa1" }}>
      <option value="cfa1">CFA des Métiers de Lyon</option>
    </Select>
  </div>
)
