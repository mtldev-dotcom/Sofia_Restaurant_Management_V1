# Restaurant Floor Plan Designer

A powerful web application for restaurant owners and managers to design, customize, and optimize their restaurant seating layouts with an intuitive drag-and-drop interface.

![Restaurant Floor Plan Designer](./attached_assets/image_1743708440803.png)

## Features

- **Interactive Floor Plan Editor**: Design your restaurant layout with an intuitive drag-and-drop interface
- **Multiple Element Types**: Add tables (round, square), chairs, bars, and other fixtures
- **Customization Options**: Resize, rotate, and position elements precisely
- **Capacity Management**: Define seating capacity for tables and track availability
- **Save and Load Layouts**: Save multiple floor plans for your restaurant and load them as needed
- **Background Customization**: Add custom backgrounds, adjust grid settings, and more
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable editing
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend**: React with TypeScript
- **State Management**: Zustand
- **UI Components**: Shadcn UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **API**: Express.js
- **Build Tools**: Vite

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [npm](https://www.npmjs.com/) (v8.0.0 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14.0 or later)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/restaurant-floor-plan-designer.git
cd restaurant-floor-plan-designer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_floor_plan
```

Replace `username`, `password`, with your PostgreSQL credentials.

### 4. Set up the database

Create a PostgreSQL database named `restaurant_floor_plan`:

```bash
createdb restaurant_floor_plan
```

Push the database schema:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### 5. Start the development server

```bash
npm run dev
```

This will start both the backend Express server and the frontend Vite development server concurrently.

### 6. Open in your browser

The application will be available at [http://localhost:5000](http://localhost:5000)

## Database Schema

The application uses the following main database tables:

- `users`: Store user information
- `restaurants`: Store restaurant information
- `restaurant_users`: Link users to restaurants with roles
- `floor_plans`: Store floor plan layouts
- `seating_areas`: Store individual tables and seating areas with capacity info

## Usage

1. **Create a New Floor Plan**: Click the "New" button to start with a clean canvas
2. **Add Elements**: Drag elements from the sidebar onto the canvas
3. **Customize Elements**: Click on any element to access its properties panel
4. **Save Your Layout**: Click "Save" to name and store your floor plan
5. **Load Existing Layouts**: Click "Load" to access your saved floor plans

## Project Structure

- `/client`: Frontend React application
  - `/src/components`: UI components
  - `/src/store`: Zustand state management
  - `/src/hooks`: Custom React hooks
  - `/src/pages`: Page components
- `/server`: Backend Express application
  - `/routes.ts`: API routes
  - `/storage.ts`: Database operations
  - `/db.ts`: Database connection
- `/shared`: Shared code between client and server
  - `/schema.ts`: Database schema and type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Drizzle ORM](https://orm.drizzle.team/) for database operations