.PHONY: build
build: setup
	bun run -- ./script/build.ts

.PHONY: check
check: lint build

.PHONY: dev
dev: setup
	bun run -- ./script/dev.ts

.PHONY: setup
setup:
	bun install --frozen-lockfile

.PHONY: lint
lint: lint-biome lint-typescript

.PHONY: lint-biome
lint-biome: setup
	bun x @biomejs/biome check

.PHONY: lint-typescript
lint-typescript:
	bun x -- bun-dx --package typescript tsc -- --project ./tsconfig.json
	bun x -- bun-dx --package typescript tsc -- --project ./tsconfig.web.json

.PHONY: format
format: setup
	bun x @biomejs/biome check --write

.PHONY: deploy
deploy: build
	bun x @cubing/deploy

RM_RF = bun -e 'process.argv.slice(1).map(p => process.getBuiltinModule("node:fs").rmSync(p, {recursive: true, force: true, maxRetries: 5}))' --

.PHONY: clean
clean:
	${RM_RF} ./dist/

.PHONY: reset
reset: clean
	${RM_RF} ./node_modules/
