.PHONY: build
build:
	# Workaround from https://github.com/parcel-bundler/parcel/issues/8005
	env NODE_OPTIONS=--no-experimental-fetch npx parcel build --public-url ./ index.html

.PHONY: dev
dev:
	npx parcel index.html --open

SFTP_PATH = "towns.dreamhost.com:~/speedlife.games"
URL       = "https://speedlife.games/"

.PHONY: deploy
deploy: build
	rsync -avz \
		--exclude .DS_Store \
		--exclude .git \
		./dist/ \
		${SFTP_PATH}
	echo "\nDone deploying. Go to ${URL}\n"
