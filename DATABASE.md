# Database Setup

This project uses PostgreSQL as the database. You can start the database using Docker Compose.

## Quick Start

1. **Start the database:**

   ```bash
   docker compose up postgres -d
   ```

2. **Set your DATABASE_URL environment variable:**

   ```bash
   # In your .env file
   DATABASE_URL="postgresql://postgres:password@localhost:5432/turbo_insta"
   ```

3. **Run database migrations:**
   ```bash
   pnpm db:push
   # or
   pnpm db:migrate
   ```

## Environment Variables

The Docker Compose setup supports the following environment variables:

- `DB_PASSWORD` - PostgreSQL password (default: `password`)
- `DB_PORT` - PostgreSQL port (default: `5432`)
- `DB_NAME` - Database name (default: `turbo_insta`)

## Database URL Format

```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

**Example:**

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/turbo_insta"
```

## Available Commands

- **Start database:** `docker compose up postgres -d`
- **Stop database:** `docker compose down`
- **Start with pgAdmin:** `docker compose --profile tools up -d`
- **View logs:** `docker compose logs postgres`
- **Reset database:** `docker compose down -v && docker compose up postgres -d`

## pgAdmin (Optional)

pgAdmin is included for database management:

1. **Start with pgAdmin:**

   ```bash
   docker compose --profile tools up -d
   ```

2. **Access pgAdmin:** http://localhost:5050

   - Email: `admin@admin.com`
   - Password: `admin`

3. **Connect to PostgreSQL in pgAdmin:**
   - Host: `postgres` (container name)
   - Port: `5432`
   - Username: `postgres`
   - Password: Your DB_PASSWORD

## Switching from start-database.sh

If you were using the `start-database.sh` script before, you can switch to Docker Compose:

1. Stop the old container: `docker stop turbo-insta-postgres && docker rm turbo-insta-postgres`
2. Use Docker Compose: `docker compose up postgres -d`

The container name remains the same (`turbo-insta-postgres`) for compatibility.
