<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Docker Setup

This project is fully dockerized (Postgres + NestJS backend + React frontend).

### Prerequisites

- Docker Desktop (includes Docker Compose)

### One-command startup (recommended)

1. (Optional) Copy env defaults and set your OpenAI key:

```bash
copy env.example .env
```

2. Start everything:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

### Optional tooling (pgAdmin)

```bash
docker compose --profile tools up
```

### Backend dev mode (hot reload)

```bash
docker compose --profile dev up --build
```

### Notes

- Backend runs `prisma migrate deploy` automatically on startup.
- Uploaded files are persisted to `backend/uploads` (bind-mounted into the backend container).
- If you previously ran the stack and migrations got into a bad state, reset the DB with: `docker compose down -v` (⚠️ deletes local DB data).

## How to Run the Project Locally

This section explains how to run the project on your local machine without Docker.

### Prerequisites

Before running the project locally, ensure you have the following installed:

1. **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js) or **yarn**
3. **PostgreSQL** (v16 or higher) - [Download](https://www.postgresql.org/download/)
   - On Windows: Use the official installer or [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)
   - On macOS: `brew install postgresql@16` or use [Postgres.app](https://postgresapp.com/)
   - On Linux: `sudo apt-get install postgresql-16` (Ubuntu/Debian) or use your package manager

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- NestJS framework and core modules
- Prisma ORM and client
- File upload libraries (multer)
- PDF parsing library (pdf-parse-fixed)
- Validation libraries (class-validator, class-transformer)
- OpenAI SDK and LangChain
- All other project dependencies

### Step 2: Set Up PostgreSQL Database

1. **Start PostgreSQL service**:
   - Windows: PostgreSQL should run as a Windows service automatically
   - macOS: `brew services start postgresql@16` or start Postgres.app
   - Linux: `sudo systemctl start postgresql`

2. **Create the database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE learnio;
   
   # Exit psql
   \q
   ```

   **Note**: If your PostgreSQL user is not `postgres` or uses a different password, adjust the connection string accordingly.

### Step 3: Configure Environment Variables

Create a `.env` file in the project root directory:

```bash
# Copy the example (if you have one) or create manually
cp .env.example .env
```

Add the following configuration to your `.env` file:

```env
# Database Configuration - Update with your local PostgreSQL credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learnio?schema=public"

# Application Configuration
PORT=3000
NODE_ENV=development

# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your-openai-api-key-here
```

**Important**: 
- Replace `postgres:postgres` with your actual PostgreSQL username and password
- Replace `your-openai-api-key-here` with your actual OpenAI API key
- If your PostgreSQL runs on a different port, update the port in the DATABASE_URL

### Step 4: Generate Prisma Client

Prisma Client must be generated before running the application:

```bash
npm run prisma:generate
```

This command reads your Prisma schema and generates the Prisma Client that your application uses to interact with the database.

### Step 5: Run Database Migrations

Apply the database schema to your local database:

```bash
npm run prisma:migrate
```

This will:
- Apply all pending migrations to your database
- Create all tables, relationships, and indexes defined in your Prisma schema

**Note**: On first run, this will create the initial database schema. On subsequent runs, it will only apply new migrations.

### Step 6: Start the Development Server

Start the NestJS application in development mode with hot-reload:

```bash
npm run start:dev
```

The application will:
- Start on `http://localhost:3000` (or the port specified in your `.env` file)
- Watch for file changes and automatically restart
- Display Swagger API documentation at `http://localhost:3000/api`

### Step 7: Verify the Setup

1. **Check the API is running**:
   - Open your browser and navigate to `http://localhost:3000/api`
   - You should see the Swagger API documentation

2. **Test a simple endpoint**:
   ```bash
   # Using curl
   curl http://localhost:3000
   
   # Or open in browser
   open http://localhost:3000
   ```

### Additional Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
# This will open a web interface at http://localhost:5555

# Build the project for production
npm run build

# Run the production build
npm run start:prod

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Troubleshooting

**Issue: Cannot connect to database**
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
- Check your DATABASE_URL in `.env` matches your PostgreSQL credentials
- Ensure the database `learnio` exists: `psql -U postgres -l`

**Issue: Prisma Client not found**
- Run `npm run prisma:generate` to generate the client
- Ensure `node_modules/.prisma` directory exists after generation

**Issue: Port already in use**
- Change the PORT in your `.env` file
- Or stop the process using port 3000: `lsof -ti:3000 | xargs kill` (macOS/Linux)

**Issue: Module not found errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure all dependencies are listed in `package.json`

**Issue: Prisma migrations fail**
- Ensure your database user has CREATE TABLE permissions
- Check that the database exists: `psql -U postgres -l`
- Try resetting the database (⚠️ deletes all data): `npx prisma migrate reset`

### File Uploads

When running locally, uploaded files are stored in the `uploads/` directory in your project root. This directory is automatically created when the application starts.

**Note**: Make sure to add `uploads/` to your `.gitignore` file to avoid committing uploaded files to version control.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## How to Run the React Frontend

The project includes a minimal React frontend built with Vite, React, and TypeScript for interacting with the AI agent backend.

### Prerequisites

- Node.js (v18 or higher) and npm
- The NestJS backend must be running (see "How to Run the Project Locally" section above)

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Vite (build tool)
- TypeScript
- Axios (for API requests)
- All development dependencies

### Step 3: Configure Backend URL (Optional)

The frontend is configured to connect to `http://localhost:3000` by default. If your backend runs on a different URL or port, create a `.env` file in the `frontend` directory:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3000
```

**Note**: The `VITE_` prefix is required for Vite to expose the variable to your React code.

### Step 4: Start the Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or the next available port). Open this URL in your browser to see the application.

### Step 5: Use the Application

1. **Enter a prompt** in the textarea (e.g., "Explain machine learning simply")
2. **Click "Send"** to submit your prompt to the backend
3. **View the response** displayed below the textarea

**File Upload:**
- Click the **"Upload PDF"** button to upload a PDF document
- Only PDF files are accepted
- Upload status and document details will be displayed after upload

### Frontend Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── agent.ts          # API client for agent endpoints
│   ├── components/
│   │   ├── ChatBox.tsx       # Textarea and send button
│   │   └── ResponseBox.tsx    # Displays agent response
│   ├── pages/
│   │   └── LandingPage.tsx    # Main landing page
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Application entry point
│   ├── index.css              # Global styles
│   └── App.css                # App-specific styles
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
└── tsconfig.json              # TypeScript configuration
```

### Available Scripts

```bash
# Start development server with hot-reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

### Troubleshooting

**Issue: Cannot connect to backend**
- Ensure the NestJS backend is running on `http://localhost:3000`
- Check that CORS is enabled in your NestJS backend (if running on different ports)
- Verify the `VITE_API_URL` in your `.env` file matches your backend URL

**Issue: Port 5173 already in use**
- Vite will automatically try the next available port
- Or specify a different port in `vite.config.ts`

**Issue: Module not found errors**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Issue: CORS errors**
- Make sure your NestJS backend has CORS enabled in `main.ts`:
  ```typescript
  app.enableCors();
  ```

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `frontend/dist` directory. You can serve these files with any static file server or deploy them to a hosting service.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
