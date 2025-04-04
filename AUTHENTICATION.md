# Authentication System Documentation

This document provides a detailed overview of the authentication system used in the Restaurant Floor Plan Designer application.

## Overview

The application uses Supabase Auth with Server-Side Rendering (SSR) patterns to handle user authentication. This approach offers several benefits:

- **Enhanced Security**: HTTP-only cookies for token storage
- **Simplified Auth Flow**: Leveraging Supabase's reliable authentication service
- **User Migration Support**: Seamless migration from legacy authentication
- **Persistent Sessions**: Better session management across page refreshes and browsers

## Architecture

### Components

1. **Server-Side**
   - `server/auth.ts`: Sets up authentication routes and middleware
   - `server/supabase.ts`: Configures Supabase client for server operations
   - Express middleware for token validation and user verification

2. **Client-Side**
   - `client/src/lib/supabase.ts`: Browser Supabase client
   - `client/src/hooks/use-auth.tsx`: React context and hook for auth state
   - `client/src/components/UserMigrationDialog.tsx`: UI for user migration

3. **Shared**
   - `shared/schema.ts`: User type definitions and validation schemas

### Authentication Flow

1. **Registration Flow**
   - User submits registration form with email, password, and restaurant details
   - Server creates user in Supabase Auth using admin client
   - Server creates matching user record in application database
   - If requested, server creates a new restaurant and links it to the user
   - Session token is returned and stored in HTTP-only cookie
   - User is navigated to dashboard using client-side routing (no page reload)

2. **Login Flow**
   - User submits email and password
   - Credentials are validated against Supabase Auth
   - If valid, session token is stored in HTTP-only cookie
   - User record is fetched from application database
   - User is navigated to dashboard using client-side routing (no page reload)

3. **Session Validation**
   - On each request to protected endpoints, token is extracted from cookies
   - Token is verified with Supabase Auth
   - User record is fetched from application database
   - If needed, user record is synchronized with Supabase Auth data
   - Request proceeds with authenticated user context

4. **Logout Flow**
   - User initiates logout
   - Supabase Auth session is terminated
   - Session cookie is cleared
   - User is navigated to home page using client-side routing (no page reload)

## Token Management

The application uses HTTP-only cookies for secure token storage:

```typescript
// Cookie configuration in server/auth.ts
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

Token extraction from requests:

```typescript
const getToken = (req: Request): string | null => {
  // Try to get from authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get from cookies
  return req.cookies?.supabase_auth_token || null;
};
```

## User Migration

The application supports migrating users from the legacy authentication system to Supabase Auth:

1. **On-demand Migration**
   - User clicks "Migrate existing account" link
   - Enters email and password
   - System verifies credentials against application database
   - Creates matching Supabase Auth user
   - Updates application database record with Supabase user ID
   - Migrates restaurant associations to the new user ID

2. **Automatic Migration**
   - When a user logs in with Supabase Auth
   - If application database has a user with matching email but different ID
   - System automatically updates the user ID in database
   - Migrates all restaurant associations

3. **Batch Migration**
   - Admin runs `scripts/migrate-users-to-supabase.js`
   - Script processes all users in application database
   - Creates matching Supabase Auth accounts
   - Updates user records with Supabase user IDs

## Error Handling

The authentication system implements comprehensive error handling:

1. **Registration Errors**
   - Duplicate email detection
   - Password validation
   - Database transaction failures

2. **Login Errors**
   - Invalid credentials
   - Account not found
   - Account disabled

3. **Session Errors**
   - Expired token
   - Invalid token
   - Missing authentication

4. **Migration Errors**
   - Credential verification failures
   - Duplicate user detection
   - Restaurant association conflicts

## Security Considerations

1. **Token Security**
   - HTTP-only cookies prevent JavaScript access
   - Secure flag ensures HTTPS-only transmission in production
   - SameSite policy protects against CSRF attacks

2. **Password Security**
   - Passwords are never stored in plain text
   - Legacy passwords used scrypt hashing with unique salts
   - Supabase Auth handles secure password storage now

3. **API Security**
   - Protected endpoints require valid authentication
   - Service role key is never exposed to the client
   - Auth middleware validates tokens on each request

4. **Development Features**
   - Development-only master password option (disabled in production)
   - Email auto-confirmation for easier testing (configurable)

## Code Examples

### Server Authentication Setup

```typescript
// Setting up Supabase middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
      cookies: {
        get: (name) => req.cookies?.[name],
        set: (name, value, options) => {
          res.cookie(name, value, options);
        },
        remove: (name, options) => {
          res.clearCookie(name, options);
        },
      },
    }
  );
  next();
});
```

### Client Authentication Hook

```typescript
// React hook for authentication state
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```


## Client-Side Navigation

The authentication system uses client-side navigation for a smoother user experience:

1. **SPA Navigation**
   - All authentication-related navigations (login, logout, registration) use client-side routing
   - No full page reloads when transitioning between authenticated/unauthenticated states
   - Utilizes wouter's navigation API for seamless transitions

2. **Benefits**
   - Faster perceived performance with instant state changes
   - Preserves application state during navigation
   - Reduces server load by eliminating unnecessary page reloads
   - Provides a more app-like user experience

3. **Implementation**
   ```typescript
   // Using wouter navigation instead of window.location redirects
   const { navigate } = useNavigate();
   
   // In login/registration success handlers
   onSuccess: (user: User) => {
     // Update client state
     queryClient.setQueryData(["/api/auth/user"], user);
     
     // Navigate programmatically without page reload
     navigate("/dashboard");
   }
   ```


## Future Improvements

1. **Social Login Integration**
   - Add support for Google, GitHub, and other OAuth providers
   - Implement account linking between social and email accounts

2. **Multi-factor Authentication**
   - Add support for MFA using Supabase Auth features
   - Implement recovery options and backup codes

3. **Role-based Authorization**
   - Enhance permission system based on restaurant roles
   - Implement fine-grained access control for floor plan operations

4. **Session Management**
   - Add ability to view and revoke active sessions
   - Implement remember me functionality with different token lifetimes

5. **Performance Optimizations**
   - Cache frequent user lookups
   - Optimize user data synchronization between Supabase and application database

## Troubleshooting

Common issues and their solutions:

1. **"Not authenticated" errors**
   - Check that cookies are being properly set and sent
   - Verify CORS configuration if accessing API from a different domain
   - Check token expiration time

2. **User migration failures**
   - Ensure user exists in application database
   - Check for email conflicts in Supabase Auth
   - Verify database connection is working properly

3. **Session persistence issues**
   - Verify cookie settings (httpOnly, secure, sameSite)
   - Check browser cookie storage limitations
   - Ensure client and server Supabase configurations match

4. **Restaurant association problems**
   - Check database constraints on restaurant_users table
   - Verify user IDs are being correctly updated during migration
   - Ensure proper error handling during association updates

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Auth Documentation](https://supabase.com/docs/guides/auth/server-side/hello-world)
- [Express.js Session Documentation](https://expressjs.com/en/resources/middleware/session.html)
- [HTTP Cookie Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)