{
    "serviceName": "ls-prod",
    "containers": {
        "main": {
            "image": $LATEST_IMAGE,
            "environment": $ENV_DETAILS,
            "ports": {
                "8080": "HTTP"
            }
        }
    },
    "publicEndpoint": {
        "containerName": "main",
        "containerPort": 8080,
        "healthCheck": {
            "healthyThreshold": 2,
            "unhealthyThreshold": 2,
            "timeoutSeconds": 2,
            "intervalSeconds": 5,
            "path": "/",
            "successCodes": "200"
        }
    }
}
