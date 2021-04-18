.PHONY: build
build:
	npx parcel build --public-url ./ index.html

.PHONY: dev
dev:
	npx parcel index.html --open

SFTP_PATH = "towns.dreamhost.com:~/garron.net/app/manual-game-of-life"
URL       = "https://garron.net/app/manual-game-of-life/"

.PHONY: deploy
deploy: build
	rsync -avz \
		--exclude .DS_Store \
		--exclude .git \
		./dist/ \
		${SFTP_PATH}
	echo "\nDone deploying. Go to ${URL}\n"
