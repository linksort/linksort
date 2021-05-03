FROM golang:1.16

WORKDIR /var/www

COPY . .

RUN go get ./...

RUN go get -u github.com/cosmtrek/air

VOLUME ["/var/www"]

CMD ["/go/bin/air"]
