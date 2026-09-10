# ABC Nursery and Primary School Portal

Student and teacher login portal for ABC Nursery and Primary School, Madurai.

## PostgreSQL setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your local PostgreSQL or hosted PostgreSQL connection string.
3. Start the app with:

```bash
npm run dev:full
```

The Vite frontend runs at `http://localhost:5173` and the Node API runs at `http://localhost:3001`.

The backend creates a `users` table with a unique role/username constraint. Passwords are stored as bcrypt hashes. New student accounts created by a teacher persist in PostgreSQL.

Demo accounts are seeded only when missing:

- Student: `arjun` / `student123`
- Teacher: `priya` / `teacher123`
