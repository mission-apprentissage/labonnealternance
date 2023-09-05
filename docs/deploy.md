# Déploiement

## Depuis Github actions

Utiliser la Github action deployement puis renseigner les informations demandées

- Environnement cible
- version de l'application

![image](https://github.com/mission-apprentissage/bal/assets/6003532/1f1b1968-d1fe-419b-9e8e-1743dc7c2c96)

### Déploiement Manuel

```bash
yarn deploy <nom-de-lenvironnement> --user <nom_utilisateur> --extra-vars=app_version=<app_image_version>
```

> TODO: Optional user & app_version
