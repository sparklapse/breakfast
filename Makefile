install:
	bun install
	cd packages/@sparklapse/breakfast; bun run build
	go get

overlays:
	cd www/overlay; bun run build
	cd www/localoverlay; bun run build

admin:
	cd www/admin; bun run build

www: overlays admin

build: www
	CGO_ENABLED=1 CC=/usr/bin/$$(arch)-linux-musl-gcc go build -ldflags '-linkmode external -extldflags -static' -tags "netgo embed" -o breakfast

image:
	docker build -t sparklapse/breakfast:latest .

dev:
	go run main.go serve --http=0.0.0.0:8090

clean:
	rm -rf pb_data
	rm -rf node_modules

