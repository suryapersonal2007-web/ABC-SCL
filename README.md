# ABC Nursery and Primary School Portal

Student and teacher login portal for ABC Nursery and Primary School, Madurai.

## MongoDB setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your local MongoDB or MongoDB Atlas connection string.
3. Start the app with:

```bash
npm run dev:full
```

The Vite frontend runs at `http://localhost:5173` and the Node API runs at `http://localhost:3001`.

The backend creates a `users` collection and a unique index for each role/username pair. Passwords are stored as bcrypt hashes. New student accounts created by a teacher persist in MongoDB.

Demo accounts are seeded only when missing:

- Student: `arjun` / `student123`
- Teacher: `priya` / `teacher123`
