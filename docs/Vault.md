## VAULT

Il est vivement recommander de stocker toutes les variables d'environnement sensibles (ex: token) dans un vault Ansible.
Le fichier `.infra/vault/vault.yaml` contient déjà les données jugées sensibles.

Le vault ansible `./infra/vault/vault.yml` contient les variables d'environnement du server et de l'ui. Le vault est séparé par environnements:

- `production` : environnement de production
- `recette` : environnement de recette
- `preview` : environnement de prévisualisation
- `local` : environnement de développement local

## Vault édition

Édition du vault ansible.

```bash
  yarn vault:edit
```

### Variables du vault

Toutes les variables du vault sont préfixées par `vault`

```yaml
vault:
  APP_VERSION: "1.0.0"
  APP_ENV: "recette"
```

Pour y faire référence dans un fichier il suffit d'utiliser la syntaxe `{{ vault.APP_VERSION }}`

Pour créer une variable spécifique à un environnement, le plus simple est d'ajouter une section dans le vault :

```yaml
vault:
  APP_VERSION: "1.0.0"
  production:
    APP_ENV: "production"
  recette:
    APP_ENV: "recette"
```

Pour référencer cette variable dans un fichier, il faut utiliser la syntaxe `{{ vault[env_type].APP_ENV }}`
La variable `env_type` qui est définie dans le fichier `env.ini` sera automatiquement valorisée en fonction de
l'environnement cible.

## Vault git diff & merge

Pour résoudre les conflits git sur le vault, il est possible de configurer git avec un mergetool custom. L'idée du custom merge tool est de décrypter le fichier pour appliquer le merge automatique de fichier.

Pour l'installer il faut exécuter les commandes suivantes

```bash
git config --local merge.merge-vault.driver ".bin/scripts/merge-vault.sh %O %A %B"
git config --local merge.merge-vault.name "ansible-vault merge driver"
git config --local diff.diff-vault.textconv "ansible-vault decrypt --vault-password-file='.bin/scripts/get-vault-password-client.sh' --output -"
git config --local diff.diff-vault.cachetextconv "false"
```

Ensuite lors du merge, vous serez invité à entrer votre passphrase (3 fois) pour décrypter les fichiers (distant, local et resultat). Il sera également affiché un le `git diff` dans le stdout.

```bash
git merge master
```
