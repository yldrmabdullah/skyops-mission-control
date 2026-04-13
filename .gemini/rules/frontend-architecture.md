# Frontend Architecture Rules

## Technology Stack

- **React 18** + **TypeScript** + **Vite**
- **React Router** (v6) for routing
- **TanStack React Query** for server state
- **Axios** (`lib/api/client.ts`) for HTTP
- **Vanilla CSS** (`index.css`) — no Tailwind, no CSS modules
- **No component library** — all components are hand-built

## Application Structure

### Provider Hierarchy (main.tsx)

```
StrictMode
  └── QueryClientProvider
      └── BrowserRouter
          └── AuthProvider
              └── NotificationProvider
                  └── App (Routes)
```

### Route Structure (App.tsx)

```
/sign-in              → SignInPage (public)
/sign-up              → SignUpPage (public)
/workspace/bootstrap  → SignUpPage (public, alias)

RequireAuth wrapper:
  /account/change-password → ChangePasswordPage (no layout)
  
  AppLayout wrapper:
    /dashboard         → DashboardPage
    /drones            → DronesPage
    /drones/:droneId   → DroneDetailPage
    /missions          → MissionsPage
    /settings          → SettingsPage
    /audit             → AuditLogPage
    *                  → NotFoundPage
```

## State Management

### Server State → React Query

- All API data fetched via React Query (`useQuery`, `useMutation`).
- Query keys follow the pattern: `['drones']`, `['drones', droneId]`, `['missions']`.
- After mutations, **invalidate** related queries via `queryClient.invalidateQueries()`.
- Global `queryClient` instance is in `lib/query-client.ts`.

### Auth State → React Context

- `AuthProvider` manages JWT token, user profile, and auth status.
- `signIn()`, `signOut()`, `bootstrapWorkspace()`, `refreshProfile()` methods on context.
- Token stored in localStorage, attached to requests via axios interceptor.
- `RequireAuth` wrapper redirects unauthenticated users to `/sign-in`.
- If `user.mustChangePassword`, redirect to `/account/change-password`.

### UI State → Component-local useState

- Form state, modal open/close, selected items → `useState` inside the component.
- No global state management library (Redux, Zustand, etc.).

## API Client Pattern

### Request Functions (`lib/api/*-requests.ts`)

Each domain has a dedicated request file:

```typescript
// drones-requests.ts
export async function fetchDrones(params?: DronesListParams) {
  const res = await apiClient.get<PaginatedResponse<Drone>>('/drones', { params });
  return res.data;
}

export async function createDrone(dto: CreateDronePayload) {
  const res = await apiClient.post<Drone>('/drones', dto);
  return res.data;
}
```

### Error Handling

- **Global** axios response interceptor handles 401 (force sign-out), 403 (toast), generic errors.
- **Per-mutation** error handling uses `useApiErrorHandler()` hook for contextual error toasts.
- `getErrorMessage(error)` extracts human-readable message from axios error response.

```typescript
const { handleError } = useApiErrorHandler();

const mutation = useMutation({
  mutationFn: createDrone,
  onSuccess: () => { queryClient.invalidateQueries(['drones']); },
  onError: (err) => handleError(err, 'Failed to register drone'),
});
```

## Component Patterns

### Page Components (`pages/*.tsx`)

- Each page is a full route view.
- Pages compose feature components and manage page-level queries.
- Pages should NOT contain complex business logic — delegate to feature components.

### Feature Components (`features/{domain}/*.tsx`)

- Domain-specific UI components (forms, tables, panels, cards).
- Colocated with their domain logic (sort helpers, form state, constants).
- Can contain `useMutation` and `useQuery` calls.

### Shared Components (`components/*.tsx`)

- Reusable across domains: `AppLayout`, `AuthShell`, `DateInput`, `FormNotice`.
- No domain-specific logic.

## CSS Conventions

- Single `index.css` file with all styles.
- Classes use BEM-inspired naming: `.card`, `.card--header`, `.card--body`.
- Responsive design with CSS custom properties for theming.
- No inline styles except for truly dynamic values (e.g., `style={{ width: percent + '%' }}`).
- Dark, operations-console aesthetic — not marketing/consumer UI.

## TypeScript Types

### Domain Types (`types/domains/*.ts`)

- Each domain has its own types file: `drone.types.ts`, `mission.types.ts`, etc.
- API response shapes match these types.
- Enums are string unions or replicated from the backend enum values.

### Rules

- **Never use `any`** — use `unknown` and narrow, or define proper types.
- **Never use `as` type assertions** except when working with library types that require it.
- All function parameters and return types must be typed.
- Use `interface` for object shapes, `type` for unions/intersections.

## Forms

- Forms use controlled components with `useState`.
- Validation happens both client-side (basic checks) and server-side (authoritative).
- Success feedback: toast notification via `useNotifications()` hook.
- Error feedback: toast notification via `useApiErrorHandler()` hook.
- After successful create/update: invalidate relevant React Query cache.

## Test IDs

- All interactive elements that Playwright needs to target must have `data-testid`.
- Format: `{feature}-{element}-{type}` — e.g., `signin-email-input`, `create-drone-submit`.
- Tables: use semantic HTML (`<table>`, `<tr>`, `<td>`) with `role` attributes for Playwright locators.
