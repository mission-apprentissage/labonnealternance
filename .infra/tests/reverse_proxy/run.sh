#!/usr/bin/env bash
#
# Test de non-régression des limites de débit du reverse proxy (zones LBA et zone `flood` de l'image).
#
# Envoie des rafales simultanées depuis une seule IP et vérifie, pour chaque URI, quelle zone la
# limite, ou qu'aucune ne la limite. Les cas /_next/static/ verrouillent l'issue 5939. Une seconde passe,
# avec toutes les IP dans la denylist, vérifie le refus sur chaque location.
#
# Le reverse proxy est construit depuis le repo infra (public), au tag de la version déployée en
# prod (`reverse_proxy_version` de .infra/inventories/env.ini), avec la zone `flood` de infra/main.
#
# Divergences assumées avec la prod :
#   - seules les locations et zones de l'UI sont montées ;
#   - les templates jinja sont rendus en supprimant leurs boucles (listes d'IP vides) ;
#   - les plages d'IP privées sont retirées des listes blanches : le client du test arrive par le
#     réseau docker, qui serait sinon exempté de toutes les limites et rendrait le test vacuous.
#
# Pour vérifier que le test n'est pas vacuous, chaque manipulation doit le faire échouer :
#   - retirer `limit_req zone=lba_static_unlimited;` de la location /_next/static/ → assets en 429
#   - retirer le bloc `if ($request_uri !~ ...)` de la même location → cas %2E%2E servis en 200
#   - retirer `limit_req zone=lba_fiche_recherche` de la location des fiches → fiches limitées par `flood`
#   - vider locations/00_denylist.conf.template → passe denylist servie en 200
#
# Volontairement écrit pour bash 3.2 (bash système de macOS).
#
# Usage : ./run.sh   (nécessite Docker et curl ≥ 7.66)

set -uo pipefail
cd "$(dirname "$0")"

readonly BASE=http://127.0.0.1:18082
readonly INFRA_RAW=https://raw.githubusercontent.com/mission-apprentissage/infra/main
readonly RP=../../files/configs/reverse_proxy

# "attendu|nombre de requêtes simultanées|uri"
#   unlimited : que des 200, aucun rejet journalisé
#   refused   : que des 404 du reverse proxy (l'amont répond 200 à tout), aucun rejet journalisé
#   denied    : que des 403 (passe denylist uniquement)
#   <zone>    : des 200 puis des 429, rejets journalisés dans cette seule zone
readonly CASES=(
  "unlimited|200|/_next/static/chunks/a.js"
  "unlimited|200|/_next/static/chunks/app/%5Btype%5D/page.js"
  # URI brute hors /_next/static/, normalisée dedans : Next la rendrait comme une page.
  "refused|200|/recherche/%2E%2E/_next/static/chunks/a.js"
  "refused|200|//_next/static/chunks/a.js"
  "flood|200|/"
  "flood|200|/?_rsc=abc"
  "flood|200|/_next/staticX"
  "flood|200|/_next/image?url=x"
  "flood|200|/_next/static/%2E%2E/x"
  "lba_partner_links|20|/monmaster/x"
  "lba_rendu_recherche|200|/recherche"
  "lba_fiche_recherche|200|/emploi/recruteurs_lba/12345678900011/x"
  "lba_fiche_recherche|200|/emploi/offres_emploi_lba/x/y?_rsc=abc"
  "lba_fiche_recherche|200|/formation/x/y"
)

# Passe denylist : toutes les IP refusées, sur chaque location montée (préfixe, regex, imbriquée).
readonly DENIED_CASES=(
  "denied|20|/"
  "denied|20|/_next/static/chunks/a.js"
  "denied|20|/recherche"
  "denied|20|/emploi/recruteurs_lba/12345678900011/x"
  "denied|20|/monmaster/x"
  "denied|20|/bff/v1/search"
  "denied|20|/bff/_private/web-vitals"
)

fail() { echo "ECHEC : $*" >&2; exit 2; }

BENCH_DIR=$(mktemp -d) || fail "mktemp"
export BENCH_DIR
cleanup() { docker compose down --remove-orphans >/dev/null 2>&1; rm -rf "$BENCH_DIR"; }
trap cleanup EXIT

version=$(curl -sf "$INFRA_RAW/.infra/inventories/env.ini" | sed -n 's/^reverse_proxy_version=//p')
[ -n "$version" ] || fail "reverse_proxy_version introuvable dans infra/.infra/inventories/env.ini"
export REVERSE_PROXY_IMAGE="lba-reverse-proxy-test:$version"

echo "Construction du reverse proxy $version depuis le repo infra..."
mkdir -p "$BENCH_DIR/src"
curl -sfL "https://codeload.github.com/mission-apprentissage/infra/tar.gz/refs/tags/reverse_proxy%40$version" \
  | tar -xz -C "$BENCH_DIR/src" --strip-components=3 '*/docker/reverse_proxy' \
  || fail "téléchargement du tag reverse_proxy@$version"
docker build -q -t "$REVERSE_PROXY_IMAGE" "$BENCH_DIR/src" >/dev/null || fail "build de l'image"

render() { # $1=source  $2=destination : boucles jinja et plages privées retirées
  sed -E -e '/\{[%{]/d' -e '/^[[:space:]]+(127|10|172|192)\.[0-9]/d' "$1" > "$2" || fail "rendu de $1"
}
mkdir -p "$BENCH_DIR/locations" "$BENCH_DIR/extra-conf.d" "$BENCH_DIR/extra-includes" "$BENCH_DIR/log"
curl -sf "$INFRA_RAW/.infra/files/app/configs/reverse_proxy/extra-conf.d/limit_req.conf.template.jinja2" \
  > "$BENCH_DIR/flood.jinja2" || fail "téléchargement de la zone flood"
grep -q 'zone=flood' "$BENCH_DIR/flood.jinja2" || fail "zone flood absente du fichier infra"
render "$BENCH_DIR/flood.jinja2" "$BENCH_DIR/extra-conf.d/limit_req.conf.template"
render "$RP/extra-conf.d/rate-limit.conf.template" "$BENCH_DIR/extra-conf.d/rate-limit.conf.template"
render "$RP/extra-conf.d/denylist.conf.template" "$BENCH_DIR/extra-conf.d/denylist.conf.template"
cp "$RP/locations/00_denylist.conf.template" "$RP/locations/90_location_ui.conf.template" "$BENCH_DIR/locations/"
cp "$RP/extra-includes/proxy-iframe.conf.template" "$BENCH_DIR/extra-includes/"
# L'image tourne sous un utilisateur non root : il doit pouvoir lire les montages et écrire le journal.
chmod -R a+rX "$BENCH_DIR" && chmod a+w "$BENCH_DIR/log"

docker compose down --remove-orphans >/dev/null 2>&1
sortie=$(docker compose up -d 2>&1) || { echo "$sortie" >&2; fail "la stack de test n'a pas démarré (port 18082 déjà pris ?)"; }

# Redémarrer le proxy vide ses zones : chaque cas part d'un compteur à zéro.
restart() {
  docker compose restart reverse_proxy >/dev/null 2>&1
  local i
  for i in $(seq 30); do
    # Toute réponse HTTP vaut disponibilité : la passe denylist répond 403 à tout.
    [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$BASE/")" != "000" ] && { : > "$BENCH_DIR/log/error.log"; return 0; }
    sleep 1
  done
  docker compose logs reverse_proxy >&2
  fail "le reverse proxy de test ne répond pas sur $BASE"
}

burst() { # $1=n  $2=uri  -> un code HTTP par ligne
  local args=() i
  for i in $(seq "$1"); do args+=(-o /dev/null "$BASE$2"); done
  curl -s -Z --parallel-max 300 -w '%{http_code}\n' "${args[@]}"
}

ko=0
check() { # $1=cas "attendu|n|uri"
  local c=$1 attendu reste n uri codes n200 n403 n404 n429 zones obtenu verdict
  attendu=${c%%|*}; reste=${c#*|}; n=${reste%%|*}; uri=${reste#*|}
  restart
  codes=$(burst "$n" "$uri")
  sleep 0.5
  n200=$(grep -c '^200$' <<< "$codes"); n403=$(grep -c '^403$' <<< "$codes")
  n404=$(grep -c '^404$' <<< "$codes"); n429=$(grep -c '^429$' <<< "$codes")
  zones=$(grep -o 'limiting requests.*by zone "[a-z0-9_]*"' "$BENCH_DIR/log/error.log" | sed -E 's/.*zone "([a-z0-9_]*)"/\1/' | sort -u | tr '\n' ' ')
  obtenu="200:$n200 403:$n403 404:$n404 429:$n429 zones:[${zones% }]"
  case $attendu in
    unlimited) [ "$n200" = "$n" ] && [ -z "$zones" ] ;;
    refused)   [ "$n404" = "$n" ] && [ -z "$zones" ] ;;
    denied)    [ "$n403" = "$n" ] && [ -z "$zones" ] ;;
    *)         [ "$n200" -gt 0 ] && [ "$n429" -gt 0 ] && [ $((n200 + n429)) = "$n" ] && [ "${zones% }" = "$attendu" ] ;;
  esac && verdict=OK || { verdict=ECHEC; ko=1; }
  printf '%-58s %-20s %s %s\n' "$uri × $n" "$attendu" "$obtenu" "$verdict"
}

printf '%-58s %-20s %s\n' "URI × requêtes" ATTENDU OBTENU
for c in "${CASES[@]}"; do check "$c"; done

# Le cache proxy doit rester actif sur les assets servis par la location dédiée.
restart
statuts=""
for _ in 1 2; do
  statuts="$statuts$(curl -s -o /dev/null -D - "$BASE/_next/static/chunks/cache.js" | tr -d '\r' | sed -n 's/^[Xx]-[Cc]ache-[Ss]tatus: //p') "
done
[ "$statuts" = "MISS HIT " ] && verdict=OK || { verdict=ECHEC; ko=1; }
printf '%-58s %-20s %s %s\n' "/_next/static/chunks/cache.js × 2 (X-Cache-Status)" "MISS HIT" "$statuts" "$verdict"

# Passe denylist, en dernier : elle remplace la denylist rendue pour le reste du test.
printf 'geo $lba_denied {\n    default 1;\n}\n' > "$BENCH_DIR/extra-conf.d/denylist.conf.template"
for c in "${DENIED_CASES[@]}"; do check "$c"; done

echo
if [ $ko -eq 0 ]; then echo "Tous les cas passent."; else echo "Au moins un cas échoue."; fi
exit $ko
