# Sofia Restaurant Floor Plan Designer

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
- **User Authentication**: Secure authentication using Supabase Auth
- **Multi-tenant**: Support for multiple restaurants per user
6. **Improved Navigation Experience**: Seamless client-side routing for authentication flows without page reloads

## Tech Stack

- **Frontend**: React with TypeScript
- **State Management**: Zustand
- **UI Components**: Shadcn UI (built on Radix UI)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth with SSR
- **API**: Express.js
- **Build Tools**: Vite

## Prerequisites

Before you begin, ensure you have the following:

- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [npm](https://www.npmjs.com/) (v8.0.0 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14.0 or later)
- [Supabase](https://supabase.com/) account (free tier works fine)

## Environment Setup

### 1. Create a Supabase Project

1. Sign up at [Supabase](https://supabase.com/) if you haven't already
2. Create a new project
3. Go to Project Settings → API to get your API keys:
   - `SUPABASE_URL`: Your project URL (e.g., https://abcdefghijklm.supabase.co)
   - `SUPABASE_KEY`: Your public anon key (safe to use in browser)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep this secret, server-only)

### 2. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_floor_plan

# Supabase configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App configuration
SESSION_SECRET=your_session_secret_key
APP_URL=http://localhost:5000
```

Replace the placeholder values with your actual credentials.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/restaurant-floor-plan-designer.git
cd restaurant-floor-plan-designer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

Create a PostgreSQL database (if not using the provided Replit database):

```bash
createdb restaurant_floor_plan
```

Push the database schema:

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### 4. Start the development server

```bash
npm run dev
```

This will start both the backend Express server and the frontend Vite development server.

### 5. Open in your browser

The application will be available at [http://localhost:5000](http://localhost:5000)

## Authentication System

The application uses Supabase Auth with server-side rendering (SSR) for authentication:

- **Login/Registration**: Users can sign in with email/password or register new accounts
- **User Migration**: Existing users with password-based authentication can be migrated to Supabase Auth
- **Session Management**: Authentication state is maintained across page refreshes and browser sessions
- **Protected Routes**: Certain routes require authentication to access
- **Restaurant Creation**: New users automatically create a restaurant during registration

### Authentication Flow

1. User logs in or registers via the web interface
2. Credentials are validated against Supabase Auth
3. A session token is stored in HTTP-only cookies
4. The token is validated on each request to protected endpoints
5. User information is synchronized between Supabase Auth and our database
6. During registration, a new restaurant is created and linked to the user

### Implementation Details

- The application uses Supabase's Server-Side Rendering (SSR) auth pattern
- Authentication state is managed through HTTP-only cookies for improved security
- User IDs from Supabase Auth are linked to our application database records
- The authentication flow checks both Supabase Auth and our database to ensure data integrity
- Restaurant creation happens automatically during user registration

### User Migration

For existing users in the database who need to migrate to Supabase Auth:

1. Use the "Migrate existing account to Supabase" link on the login page
2. Enter credentials for verification
3. A Supabase Auth account will be created with the same email
4. The user record in the database is updated with the Supabase User ID

For batch migration, there's a script available:

```bash
node scripts/migrate-users-to-supabase.js
```

### Authentication Script Utilities

The project includes several utility scripts for authentication management:

1. **User Migration**: `scripts/migrate-users-to-supabase.js` - Batch migrates existing users to Supabase Auth
2. **Supabase Cleanup**: `scripts/clean-supabase-users.js` - Removes test users from Supabase (development only)
3. **User Creation**: `scripts/create-user.js` - Creates a test user for development purposes

## Database Schema

The application uses the following main database tables:

- `users`: Store user information (synchronized with Supabase Auth)
- `restaurants`: Store restaurant information
- `restaurant_users`: Link users to restaurants with roles (owner, manager, staff, etc.)
- `floor_plans`: Store floor plan layouts with associated metadata
- `seating_areas`: Store individual tables and seating areas with capacity info

## Codebase Structure

```
/
├── .env                 # Environment variables
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   │   ├── ui/      # Shadcn UI components
│   │   │   └── ...      # Application-specific components
│   │   ├── hooks/       # Custom React hooks
│   │   │   ├── use-auth.tsx     # Authentication hook
│   │   │   └── ...
│   │   ├── lib/         # Utility functions and configuration
│   │   ├── pages/       # Page components
│   │   ├── store/       # Zustand state management
│   │   └── ...
├── server/              # Backend Express application
│   ├── auth.ts          # Authentication setup and routes
│   ├── db.ts            # Database connection
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations interface
│   └── supabase.ts      # Supabase client setup
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema and type definitions
└── scripts/             # Utility scripts
    ├── migrate-users-to-supabase.js  # Batch migration script
    └── ...
```

## Key Components and Files

### Authentication

- `server/auth.ts`: Sets up authentication routes and middleware
- `server/supabase.ts`: Configures Supabase client for server
- `client/src/lib/supabase.ts`: Configures Supabase client for browser
- `client/src/hooks/use-auth.tsx`: React hook for authentication state and operations
- `client/src/pages/auth-page.tsx`: Login/registration page
- `client/src/components/UserMigrationDialog.tsx`: UI for migrating existing users

### Floor Plan Designer

- `client/src/store/floorPlanStore.ts`: Zustand store for floor plan state
- `client/src/components/CanvasElement.tsx`: Draggable element component
- `client/src/components/EditorPanel.tsx`: Main editing interface
- `client/src/components/Sidebar.tsx`: Element palette and properties panel
- `client/src/components/PropertiesPanel.tsx`: Element property editing

### Restaurant Management

- `server/storage.ts`: Database operations for restaurants and users
- `shared/schema.ts`: Database schema definitions
- `client/src/pages/Dashboard.tsx`: Main dashboard for restaurant management

## Usage Guide

### User Registration and Login

1. Visit the home page and click "Register" to create a new account
2. Fill in your details and choose to create a new restaurant
3. After registration, you'll be automatically logged in
4. For existing users, use the "Login" tab with your email and password

### Creating a Floor Plan

1. After logging in, you'll be directed to your dashboard
2. Click "New Floor Plan" to start creating a new layout
3. Use the left sidebar to drag elements onto the canvas
4. Click on elements to select them and edit their properties
5. Use the properties panel to adjust settings for the selected element

### Saving and Loading Floor Plans

1. Click "Save" to name and save your current floor plan
2. Your saved floor plans will appear in the "Load" dialog
3. Select any saved floor plan to continue editing it
4. You can also set a floor plan as the default for your restaurant

### User and Restaurant Management

1. Administrators can add users to a restaurant with different permission levels
2. Restaurant owners can create and manage multiple floor plans
3. Staff members can view and use floor plans based on their permissions

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your Supabase credentials are correctly set in the `.env` file
2. **Database Connection Issues**: Verify your PostgreSQL connection string is correct
3. **User Migration Problems**: Make sure the user exists in the database before migration

### Logs and Debugging

- Check server logs for authentication and database errors
- Browser console logs for frontend issues
- Supabase dashboard for authentication activity

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Drizzle ORM](https://orm.drizzle.team/) for database operations
- [Supabase](https://supabase.com/) for authentication services
## Recent Updates: Supabase Authentication Integration

We have recently migrated the authentication system from a custom implementation to use Supabase Authentication with Server-Side Rendering (SSR). This update brings several improvements:

1. **Enhanced Security**: Using Supabase Auth provides industry-standard security practices
2. **Simplified Authentication Flow**: Authentication is now managed through Supabase's reliable authentication service
3. **Seamless User Migration**: Existing users can easily migrate their accounts to Supabase
4. **Automatic Restaurant Creation**: New users automatically create a restaurant during registration
5. **Persistent Sessions**: Better session management across page refreshes and browser tabs
6. **Smooth Navigation Experience**: Client-side routing for authentication flows without jarring page reloads

### Implementation Details

- The application uses Supabase's Server-Side Rendering (SSR) auth pattern
- Authentication state is managed through HTTP-only cookies for improved security
- User IDs from Supabase Auth are linked to our application database records
- The authentication flow checks both Supabase Auth and our database to ensure data integrity
- Restaurant creation happens automatically during user registration

### Migration Tools

The project includes several utility scripts for authentication management:

1. **User Migration Dialog**: A UI component for on-demand user migration
2. **Batch Migration Script**: `scripts/migrate-users-to-supabase.js` for migrating all users
3. **Cleanup Tool**: `scripts/clean-supabase-users.js` for removing test users (development only)

For detailed implementation, see `server/auth.ts`, `server/supabase.ts`, and `client/src/hooks/use-auth.tsx`.
