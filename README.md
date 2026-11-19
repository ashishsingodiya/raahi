# RideMate

A monorepo containing the Next.js web application & admin dashboard (`@ridemate/web`), Expo mobile application (`@ridemate/mobile`), and shared packages (`@ridemate/api`, `@ridemate/auth`, `@ridemate/db`, `@ridemate/ui`).

## Android MVP demo

1. Deploy the Next.js app over HTTPS with a shared PostgreSQL database. Apply `pnpm db:migrate` against that database, then check `/api/health`. Set `NEXT_PUBLIC_APP_URL` to the deployed origin and register its `/api/auth/callback/google` URL in Google OAuth. If the OAuth app is in testing, add the demo Google accounts in the Google console.
2. Set `GOOGLE_MAPS_SERVER_KEY` on the backend for Places and Routes. For the Android preview build, set `EXPO_PUBLIC_SERVER_URL` to the HTTPS origin and supply `GOOGLE_MAPS_ANDROID_KEY`. If the demo key supports Maps JavaScript only, set `GOOGLE_MAPS_WEB_KEY` on the backend and set `EXPO_PUBLIC_GOOGLE_MAPS_WEBVIEW=1` in the preview build environment.
3. From `apps/mobile`, run `eas build --platform android --profile preview` after linking the app to an EAS project and configuring the preview variables. Install the same APK on two phones. On one phone, test that the map, foreground location, place search, and route preview work before the scheduled demo.
4. Use a Google-verified `rtu.ac.in` account and a personal Google account. Finish onboarding on both phones and approve the personal account in Studio. Post a ride, find it from the second phone, request a seat with custom pins, and accept from the first phone. Check that both students now see each other's contact details.

For native Android Maps, authorize each package you build on `GOOGLE_MAPS_ANDROID_KEY` using that variant’s signing certificate SHA-1. The package IDs are `com.ridemate.app.dev` for development, `com.ridemate.app.preview` for preview, and `com.ridemate.app` for production. Deploy the backend with the matching RideMate sign-in schemes before testing Google sign-in on the new APKs.

For local Android builds, generate the native project for the target `APP_VARIANT` when switching variants. The generated `apps/mobile/android` folder contains one variant at a time.

Use a disposable database to run the booking integration test. Apply `pnpm db:migrate` with its URL in `POSTGRES_URL`, then run `pnpm --filter @ridemate/api test` with the same URL in `TEST_POSTGRES_URL`. The test uses synthetic Google Routes responses.

If the test database will stay online after the demo, schedule a daily cleanup of expired route coordinates with `UPDATE ride SET route = NULL WHERE route_expires_at <= now() AND route IS NOT NULL;`. Active routes are refreshed when requested again.

---

## Table of Contents

- [Building & Pushing Docker Images](#building--pushing-docker-images)
  - [Cross-Platform Build (Mac Apple Silicon -> Linux AMD64)](#cross-platform-build-mac-apple-silicon---linux-amd64)
  - [Pushing to GitHub Container Registry (GHCR)](#pushing-to-github-container-registry-ghcr)
- [VPS Deployment (Docker Compose)](#vps-deployment-docker-compose)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Production docker-compose.yml](#production-docker-composeyml)
- [Secure Database Access (No Exposed Ports)](#secure-database-access-no-exposed-ports)
  - [Connecting via SSH Tunnel (Zero Port Exposure)](#connecting-via-ssh-tunnel-zero-port-exposure)
  - [Running Drizzle Studio Locally for VPS DB](#running-drizzle-studio-locally-for-vps-db)
  - [Pushing Database Migrations](#pushing-database-migrations)
- [Useful Operations & Backups](#useful-operations--backups)

---

## Building & Pushing Docker Images

### Cross-Platform Build (Mac Apple Silicon -> Linux AMD64)

Building Docker images on Apple Silicon (M1/M2/M3/M4) produces `arm64` images by default. To target Linux AMD64 VPS servers, use `docker buildx` with `--platform linux/amd64`.

#### Build Next.js Web App

```bash
docker buildx build \
  --platform linux/amd64 \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -t ghcr.io/ashishsingodiya/ridemate-web:latest \
  .
```

### Pushing to GitHub Container Registry (GHCR)

1. **Log in to GHCR**:
   ```bash
   echo $CR_PAT | docker login ghcr.io -u ashishsingodiya --password-stdin
   ```
2. **Push image**:
   ```bash
   docker push ghcr.io/ashishsingodiya/ridemate-web:latest
   ```

---

## VPS Deployment (Docker Compose)

### Environment Variables (`.env`)

Create a `.env` file on your VPS in the deployment directory:

```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=ridemate

# Database Connection (Uses internal Docker service name 'postgres')
POSTGRES_URL=postgresql://postgres:your_secure_db_password@postgres:5432/ridemate

# App Config & Authentication
BETTER_AUTH_SECRET=your_better_auth_secret
AUTH_GOOGLE_CLIENT_ID=your_google_client_id
AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Production `docker-compose.yml`

Create a `docker-compose.yml` file on your VPS:

```yaml
services:
  # 1. Self-hosted PostgreSQL (No public ports exposed)
  postgres:
    image: postgres:18-alpine
    container_name: ridemate-postgres
    restart: always
    env_file:
      - .env
    volumes:
      - postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Next.js Web App
  web:
    image: ghcr.io/ashishsingodiya/ridemate-web:latest
    container_name: ridemate-web
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

#### Start Services

```bash
docker compose pull
docker compose up -d
```

---

## Secure Database Access (No Exposed Ports)

To maintain maximum security, the PostgreSQL container does **not** expose port `5432` to the public internet. You can connect to it safely from your local machine using an SSH tunnel directly targeting Docker's internal container IP.

### Connecting via SSH Tunnel (Zero Port Exposure)

1. **Find the Container IP on VPS**:
   SSH into your VPS (`ssh my-vps`) and inspect the postgres container IP:

   ```bash
   docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ridemate-postgres
   ```

   _(Example output: `172.18.0.2`)_

2. **Open SSH Tunnel on your Local Machine**:
   In a local terminal on your Mac, forward port `5433` to the internal container IP:
   ```bash
   ssh -L 5433:172.18.0.2:5432 my-vps -N
   ```
   _(Keep this terminal open while working)_

### Running Drizzle Studio Locally for VPS DB

With the SSH tunnel active in Terminal 1, open Terminal 2 on your Mac and run Drizzle Studio:

```bash
POSTGRES_URL="postgresql://postgres:your_secure_db_password@localhost:5433/ridemate" pnpm db:studio
```

Open the Drizzle Studio link in your browser to inspect or manage production data safely.

### Pushing Database Migrations

To apply schema changes to the remote database from your Mac via the active SSH tunnel:

```bash
POSTGRES_URL="postgresql://postgres:your_secure_db_password@localhost:5433/ridemate" pnpm db:push
```

---

## Useful Operations & Backups

### Container Logs & Status

```bash
# Check status
docker compose ps

# View web logs
docker logs -f ridemate-web
```

### Database Backup

Run a `pg_dump` backup directly from the container to your VPS disk:

```bash
docker exec ridemate-postgres pg_dump -U postgres ridemate | gzip > ~/backups/db-$(date +%F).sql.gz
```
