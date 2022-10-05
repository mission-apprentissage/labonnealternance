set -euo pipefail

mkdir build
docker build . -t mna-template
docker run -i -v $(pwd):/template \
-e PUID="$(id -u)" -e PGID="$(id -g)" \
mna-template bash -c 'cd /template && bash /template/generate.sh doctrina'
rm build/.../Dockerfile