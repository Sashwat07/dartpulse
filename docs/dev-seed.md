# Development Seed

Minimal seed data for manually testing the live scoring engine.

## Prerequisites: MongoDB replica set

Prisma requires MongoDB to be run as a **replica set** (even for single-node local dev). A standalone `mongod` will fail with:

```text
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set. (P2031)
```

**Option A — Docker (single-node replica set):**

```bash
# Start MongoDB 7 with replica set name
docker run -d -p 27017:27017 --name mongo-prisma mongo:7 --replSet rs0

# Initialize the replica set (once)
docker exec -it mongo-prisma mongosh --eval "rs.initiate()"
```

Then set in `.env` (database name is required):

```text
MONGODB_URL=mongodb://127.0.0.1:27017/dartpulse
```

**Option B — Local MongoDB already installed:**

```bash
# Stop existing mongod, then start with replica set
mongod --port 27017 --replSet rs0
```

In another terminal:

```bash
mongosh
rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] })
```

**Option C — MongoDB Atlas:** Use a cluster URL from Atlas; Atlas runs as a replica set by default.

---

## What it creates

- **2 players:** Dev Alice, Dev Bob (with avatar colors)
- **1 active match:** "Dev live match", casual, 3 rounds, status `roundActive`
- **2 MatchPlayer records** linking the match to both players (turn order = creation order)
- **1 Round** for round 1
- **No ThrowEvents** (so the first turn is player 1)

## How to run

1. Ensure MongoDB is running **as a replica set** (see Prerequisites above) and `MONGODB_URL` in `.env` includes a database name (e.g. `mongodb://127.0.0.1:27017/dartpulse`).

2. From the project root:

   ```bash
   pnpm run seed:dev
   ```

3. The script prints the created `matchId`. Open that match in the browser:

   ```
   http://localhost:3000/match/<matchId>
   ```

4. With the app running (`pnpm dev`), you can add throws, undo, and refresh to verify recovery.

## Safety

- Intended for **local development only**. In production the script exits unless `SEED_DEV_ALLOW=1` is set.
- Re-running the seed creates **additional** players and a new match; it does not clear existing data.

## Script location

- **Script:** `scripts/seed-dev.ts`
- **Repositories used:** `createPlayer`, `createRound` (from `lib/repositories`)
- **Prisma used directly:** `Match` and `MatchPlayer` (no app API for match creation yet)
