build:
	CGO_ENABLED=1 CC=/usr/bin/x86_64-linux-musl-gcc go build -ldflags '-linkmode external -extldflags -static' -tags "netgo embed remote" -o breakfast
	docker build -t sparklapse/breakfast:latest .

run:
	docker run -i --rm -p 8090:1234 sparklapse/breakfast:latest

push:
	docker push sparklapse/breakfast:latest

clean:
	rm breakfast
	docker image rm sparklapse/breakfast:latest
