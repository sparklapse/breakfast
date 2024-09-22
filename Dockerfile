FROM golang:1.23-bookworm AS build

RUN echo "export PATH=/usr/local/go/bin:\$PATH" >> /root/.bashrc
SHELL ["/bin/bash", "--login", "-c"]
RUN apt update && apt -yqq install build-essential musl-dev unzip
RUN curl -fsSL https://bun.sh/install | bash

WORKDIR /app
COPY . /app
RUN make install
RUN make build


FROM scratch

COPY --from=build /app/breakfast /breakfast
EXPOSE 1234

CMD ["/breakfast", "serve", "--http=0.0.0.0:1234"]

