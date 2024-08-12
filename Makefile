install:
	cd www; bun install

dev:
	go run main.go serve

reset:
	rm -rf pb_data

build:
	cd www; bun run build
	CGO_ENABLED=1 CC=/usr/bin/x86_64-linux-musl-gcc go build -ldflags '-linkmode external -extldflags -static' -tags "netgo embed" -o breakfast
	docker build -t sparklapse/breakfast:latest .

run:
	docker run -i --rm -p 8090:1234 sparklapse/breakfast:latest

push:
	docker push sparklapse/breakfast:latest

clean:
	rm -f breakfast
	rm -rf www/build
	docker image rm -f sparklapse/breakfast:latest
