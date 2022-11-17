
install: init
	yarn --cwd server install --frozen-lockfile
	yarn --cwd ui install --frozen-lockfile
	yarn --cwd ui_espace_pro install --frozen-lockfile

init: 
	yarn install

start:
	docker-compose up --build --force-recreate

stop:
	docker-compose stop

test:
	yarn --cwd server test
	yarn --cwd ui test:ci

coverage:
	yarn --cwd server coverage
	yarn --cwd ui coverage

lint:
	yarn --cwd server lint
	yarn --cwd ui lint
	yarn --cwd ui_espace_pro lint

clean:
	docker-compose kill && docker system prune --force --volumes

ci: install lint coverage
