FROM golang:1.23

WORKDIR /opt/linksort/

RUN mkdir build

COPY ./go.mod ./go.sum ./

RUN go mod download

RUN go install github.com/air-verse/air@latest

COPY . .

CMD ["air"]
