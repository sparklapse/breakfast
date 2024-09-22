install:
	bun install
	go get

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
	go run main.go serve

clean:
	rm -rf pb_data

