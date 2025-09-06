FROM golang:1.24-alpine3.22 AS build

RUN apk add --no-cache --update build-base

RUN adduser -u 1000 -D godev
USER 1000

ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
ENV PATH="$PATH:/go/bin/${GOOS}_${GOARCH}"

WORKDIR /app

COPY --chown=godev:godev . ./
RUN go mod download

# COPY --chown=godev:godev ./cmd ./docs ./internal ./
RUN go test ./...
RUN go build -o api ./cmd/server/main.go


FROM build AS dev

RUN go install github.com/air-verse/air@v1.62.0
EXPOSE 8000
CMD ["air", "--build.cmd", "go build -o api ./cmd/server/main.go", "--build.bin", "./api", "--build.exclude_regex", "_test.go"]


FROM alpine:3.22

RUN adduser -u 1000 -D app
USER 1000

COPY --chown=app:app --from=build /app/api /api
EXPOSE 8000
ENTRYPOINT [ "/api" ]
