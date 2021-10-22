# Linksort

## Development

You'll need a access to a mongodb endpoint that supports replica sets. You can build and run a docker image that provides such an endpoint by running the following commands.

```bash
# Build the image.
docker build -f docker/mongo-dockerfile -t mongo-rs .

# Run it in the background.
docker run -p 27017:27017 -v db-data:/data/db -d mongo-rs
```

Run [`air`](https://github.com/cosmtrek/air) to start the backend server. This also starts a watcher that automatically rebuilds and runs the server whenever changes are detected.

```bash
export GOPRIVATE=github.com/linksort/analyze
export PRODUCTION=0
air
```

If there are issues with resolving package `analyze`, you may have to add the following to your `~/.gitconfig`:

```
[url "ssh://git@github.com/"]
        insteadOf = https://github.com/
```

Open another terminal window and start the frontend. This server also starts a watcher that supports hot module replacement.

```bash
cd frontend
yarn start
```

Go to [http://localhost:8080](http://localhost:8080).

## Running in Prod Mode Locally

```bash
docker build -f ./docker/main-dockerfile -t ls .
docker run -e ANALYZER_KEY="$ANALYZER_KEY" -e DB_CONNECTION="mongodb://172.17.0.2:27017/?connect=direct" -p 8080:8080 ls
```
