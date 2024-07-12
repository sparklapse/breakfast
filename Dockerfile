FROM scratch

ADD breakfast /breakfast

EXPOSE 1234

CMD ["/breakfast", "serve", "--http=0.0.0.0:1234"]
