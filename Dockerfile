FROM node:19-alpine as frontend
WORKDIR /build
COPY frontend ./frontend
RUN cd frontend && yarn install && yarn build

FROM golang:1.21 as builder

RUN apt-get update && \
   apt-get install -y gcc

ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

# Move to working directory /build
WORKDIR /build

# Copy and download dependency using go mod
COPY go.mod .
COPY go.sum .
RUN go mod download

# Copy the code into the container
COPY . .

# Copy frontend dist files into the container
COPY --from=frontend /build/frontend/dist ./frontend/dist

RUN go build -o main .

RUN wget https://github.com/breez/breez-sdk-go/raw/main/breez_sdk/lib/linux-amd64/libbreez_sdk_bindings.so

# Start a new, final image to reduce size.
FROM debian as final


ENV LD_LIBRARY_PATH=/usr/lib/libbreez

#
# # Copy the binaries and entrypoint from the builder image.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/libbreez_sdk_bindings.so /usr/lib/libbreez/
COPY --from=builder /build/main /bin/

ENTRYPOINT [ "/bin/main" ]
