#!/bin/bash
#deploy.sh
#chmod +x deploy.sh
# Setează tag-ul pentru imaginea Docker
IMAGE_NAME="siaamp-receptie:latest"
REGISTRY="192.168.0.120:5000"
TARGET_IMAGE="$REGISTRY/$IMAGE_NAME"

# Construiește imaginea Docker
echo "Building Docker image..."
docker build -t $IMAGE_NAME .

# Etichetează imaginea cu adresa registry-ului
echo "Tagging image with registry..."
docker tag $IMAGE_NAME $TARGET_IMAGE

# Trimite imaginea la registry
echo "Pushing image to registry..."
docker push $TARGET_IMAGE

echo "Deployment complete."
