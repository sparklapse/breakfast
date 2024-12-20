install:
	rm -rf node_modules
	bun install
	cd packages/@brekkie/obs; bun run build
	cd packages/@brekkie/io; bun run build
	cd packages/@brekkie/overlay; bun run build
	go get

check:
	cd packages/@brekkie/obs; bun run check
	cd packages/@brekkie/io; bun run check
	cd packages/@brekkie/overlay; bun run check

overlays:
	cd www/overlay; bun run build

admin:
	cd www/admin; bun run build

www: overlays admin

build: www
	CGO_ENABLED=1 CC=/usr/bin/$$(arch)-linux-musl-gcc go build -ldflags '-linkmode external -extldflags -static' -tags "netgo embed" -o breakfast

image:
	docker build -t sparklapse/breakfast:latest .

dev:
	go run main.go --http=0.0.0.0:8090

clean:
	rm -rf pb_data
	rm -rf node_modules

