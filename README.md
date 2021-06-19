# Linksort

## Development

You'll need a access to a mongodb endpoint that supports replica sets. You can build and run a docker image that provides such an endpoint by running the following commands.

```
# Build the image.
docker build -f docker/mongo-dockerfile -t mongo-rs .

# Run it in the background.
docker run -p 27017:27017 -d mongo-rs
```

Run `air` to start the backend server. This also starts a watcher that automatically rebuilds and runs the server whenever changes are detected.

```
air
```

Open another terminal window and start the frontend. This server also starts a watcher that supports hot module replacement.

```
cd frontend
yarn start
```

Go to localhost:8080.
