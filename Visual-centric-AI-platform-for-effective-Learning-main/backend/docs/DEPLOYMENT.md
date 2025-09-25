# Deployment Guide

This guide covers how to deploy the RAG Educational AI Backend in various environments.

## Development Deployment

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my_RAG/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp config/.env.example config/.env
   # Edit config/.env with your actual values
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

   Or use the run script:
   ```bash
   python run.py
   ```

## Production Deployment

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   EXPOSE 8000

   CMD ["python", "main.py"]
   ```

2. **Build and run**
   ```bash
   docker build -t rag-backend .
   docker run -p 8000:8000 --env-file config/.env rag-backend
   ```

### Docker Compose

```yaml
version: '3.8'

services:
  rag-backend:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - config/.env
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Cloud Deployment

#### AWS ECS

1. **Create task definition**
2. **Set up load balancer**
3. **Configure auto-scaling**
4. **Set environment variables in ECS**

#### Google Cloud Run

```bash
gcloud run deploy rag-backend \
  --image gcr.io/PROJECT_ID/rag-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name rag-backend \
  --image myregistry.azurecr.io/rag-backend:latest \
  --dns-name-label rag-backend \
  --ports 8000
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GEMINI_API_KEY=your_gemini_key
YOUTUBE_API_KEY=your_youtube_key

# Application
DEBUG=False
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

### Optional Environment Variables

```bash
# Performance
MAX_REQUESTS_PER_MINUTE=100
MAX_FILE_SIZE_MB=50

# Features
ENABLE_VOICE=true
ENABLE_YOUTUBE=true
ENABLE_QUIZ=true
```

## Health Checks

The application provides health check endpoints:

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

## Monitoring

### Logging

Configure logging in production:

```python
LOG_LEVEL=WARNING
LOG_FORMAT=json
```

### Metrics

The application exposes metrics at `/metrics` for Prometheus monitoring.

### Error Tracking

Integrate with Sentry for error tracking:

```bash
SENTRY_DSN=your_sentry_dsn
```

## Security

### SSL/TLS

Always use HTTPS in production. Configure SSL certificates:

```bash
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### API Security

- Enable rate limiting
- Use API keys for authentication
- Implement CORS properly
- Validate all inputs

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

```yaml
replicas: 3
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Database Scaling

- Use connection pooling
- Implement read replicas
- Consider database sharding for large datasets

## Backup and Recovery

### Database Backup

```bash
# Automated backups in Supabase
# Configure backup retention policies
```

### Application State

- User profiles are stored in `/data/user_profiles/`
- Ensure this directory is backed up
- Consider using object storage for large files

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

2. **Memory issues**
   ```bash
   # Increase container memory limits
   # Monitor memory usage with htop
   ```

3. **Database connection issues**
   ```bash
   # Check network connectivity
   # Verify credentials
   # Check firewall settings
   ```

### Debug Mode

Enable debug mode for development:

```bash
DEBUG=True
LOG_LEVEL=DEBUG
```

## Performance Optimization

### Caching

Implement caching for frequently accessed data:

```python
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

### Database Optimization

- Use appropriate indexes
- Optimize vector search queries
- Monitor query performance

### Resource Management

- Set appropriate worker counts
- Configure memory limits
- Use async operations where possible

## Maintenance

### Regular Updates

1. Update dependencies regularly
2. Monitor security advisories
3. Test updates in staging environment
4. Perform rolling updates in production

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Use logrotate or similar tools
# Set appropriate retention policies
```
