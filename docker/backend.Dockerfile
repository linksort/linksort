FROM golang:1.19

WORKDIR /opt/linksort/

RUN mkdir build

COPY ./go.mod ./go.sum ./

RUN go mod download

RUN go install github.com/cosmtrek/air@latest

COPY . .

CMD ["air"]
