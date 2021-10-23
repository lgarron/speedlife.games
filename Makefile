.PHONY: build
build:
	npx parcel build --public-url ./ index.html

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
