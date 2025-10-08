# Docker Deployment Guide for Mahabaleshwer Mart

This guide explains how to deploy the Mahabaleshwer Mart Angular application using Docker.

## Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Build and run the application:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   Open your browser and navigate to: `http://localhost:8080`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Commands

1. **Build the Docker image:**
   ```bash
   docker build -t mahabaleshwer-mart:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d -p 8080:80 --name mahabaleshwer-mart-app mahabaleshwer-mart:latest
   ```

3. **Access the application:**
   Open your browser and navigate to: `http://localhost:8080`

4. **Stop and remove the container:**
   ```bash
   docker stop mahabaleshwer-mart-app
   docker rm mahabaleshwer-mart-app
   ```

## Docker Configuration

### Dockerfile

The multi-stage Dockerfile:
- **Stage 1 (Build):** Uses Node.js 20 Alpine to build the Angular application
- **Stage 2 (Production):** Uses Nginx Alpine to serve the built application

### Nginx Configuration

The `nginx.conf` file includes:
- Angular routing support (SPA fallback to index.html)
- Gzip compression for better performance
- Security headers
- Static asset caching (1 year for images, CSS, JS)
- Error handling

### Docker Compose

The `docker-compose.yml` provides:
- Easy one-command deployment
- Port mapping (8080:80)
- Automatic restart policy
- Network configuration

## Useful Commands

### View running containers
```bash
docker ps
```

### View application logs
```bash
docker-compose logs -f
# or
docker logs -f mahabaleshwer-mart-app
```

### Rebuild the application
```bash
docker-compose up -d --build
```

### Remove all containers and images
```bash
docker-compose down --rmi all
```

### Access container shell
```bash
docker exec -it mahabaleshwer-mart-app sh
```

## Port Configuration

By default, the application runs on port **8080**. To change the port:

1. Edit `docker-compose.yml`:
   ```yaml
   ports:
     - "YOUR_PORT:80"
   ```

2. Restart the container:
   ```bash
   docker-compose up -d
   ```

## Production Deployment

### Building for Production

The Dockerfile automatically builds the application with production configuration:
```bash
npm run build -- --configuration production
```

### Environment Variables

To add environment variables, edit `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - API_URL=https://your-api-url.com
```

### Deploying to Cloud Platforms

#### Docker Hub
1. **Tag your image:**
   ```bash
   docker tag mahabaleshwer-mart:latest your-dockerhub-username/mahabaleshwer-mart:latest
   ```

2. **Push to Docker Hub:**
   ```bash
   docker push your-dockerhub-username/mahabaleshwer-mart:latest
   ```

#### AWS ECS, Azure Container Instances, Google Cloud Run
- Use the Dockerfile to build and deploy on these platforms
- Configure environment variables and port mappings as needed

## Troubleshooting

### Container won't start
```bash
docker-compose logs
```

### Port already in use
Change the port in `docker-compose.yml` or stop the service using that port.

### Build fails
- Ensure you have enough disk space
- Check Docker daemon is running
- Try cleaning Docker cache:
  ```bash
  docker system prune -a
  ```

### Application not loading
- Check if the container is running: `docker ps`
- Check logs: `docker-compose logs`
- Verify port mapping: `docker port mahabaleshwer-mart-app`

## Performance Optimization

The Docker setup includes:
- Multi-stage build for smaller image size (~50MB final image)
- Nginx with gzip compression
- Static asset caching
- Optimized Angular production build

## Security Best Practices

- Security headers configured in Nginx
- No unnecessary packages in production image
- Alpine Linux base for minimal attack surface
- Non-root user can be configured if needed

## Development vs Production

For development, continue using:
```bash
npm start
```

For production deployment, use Docker as described in this guide.

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify Docker installation: `docker --version`
3. Ensure ports are not in use: `lsof -i :8080`

---

**Happy Deploying! 🚀**
