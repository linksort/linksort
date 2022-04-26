# Linksort

## Development

### Short Way

```bash
docker-compose up
```

That's it! Go to [http://localhost:8000](http://localhost:8000) to find the app up and running.

### Long Way

You'll need a access to a mongodb endpoint that supports replica sets. You can build and run a docker image that provides such an endpoint by running the following commands.

```bash
# Build the image.
docker build -f docker/mongo.Dockerfile -t mongo-rs .

# Run it in the background.
docker run -p 27017:27017 -v db-data:/data/db -d mongo-rs
```

Run [`air`](https://github.com/cosmtrek/air) to start the backend server. This also starts a watcher that automatically rebuilds and runs the server whenever changes are detected.

```bash
export PRODUCTION=0
export ANALYZER_KEY=$(cat /path/to/key)
air
```

Open another terminal window and start the frontend. This server also starts a watcher that supports hot module replacement.

```bash
cd frontend
yarn start
```

Go to [http://localhost:8080](http://localhost:8080).

### Running Tests

```bash
# Build the mongo image.
docker build -f docker/mongo.Dockerfile -t mongo-rs .

# Run it. Note db-data2 and db2.
docker run -p 27017:27017 -v db-data2:/data/db2 -d mongo-rs

# Run tests. No need to repeat the previous steps for subsequent runs.
go test ./...
```

## Running in Prod Mode Locally

```bash
docker build -f ./docker/main.Dockerfile -t ls .
docker run -e ANALYZER_KEY="$ANALYZER_KEY" -e DB_CONNECTION="mongodb://172.17.0.2:27017/?connect=direct" -p 8080:8080 ls
```
