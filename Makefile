
install: hooks
	yarn --cwd server install --frozen-lockfile
	yarn --cwd ui install --frozen-lockfile

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

clean:
	docker-compose kill && docker system prune --force --volumes

hooks:
	git config core.hooksPath misc/git-hooks
	chmod +x misc/git-hooks/*

ci: install lint coverage
