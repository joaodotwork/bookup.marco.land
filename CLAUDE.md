# CLAUDE.md - Agent Instructions for bookup.marco.land

## Build Commands
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server (http://localhost:3000)
- `pnpm run build` - Build for production
- `pnpm run generate` - Generate static site
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint issues

## Code Style Guidelines

### Component Structure
- Use Vue 3 Composition API with `<script setup lang="ts">` syntax
- Component order: script → template → style
- UI components prefixed with 'B' (BSection, BInputFile)

### TypeScript
- Use explicit types for props: `defineProps<{ prop: Type }>()`
- Prefer interfaces over types for complex objects
- Add `!` for non-null assertions when confident about nullability

### State Management
- Use Pinia stores with `useBookStore()` and `useAppStore()`
- Extract reactive state with `storeToRefs()`
- Persist state with `pinia-plugin-persistedstate`

### Styling
- Use Tailwind CSS utility classes
- Scoped component styles when needed
- Follow Nuxt UI component patterns

### Error Handling
- Use optional chaining (`?.`) for nullable values
- Early returns for error cases
- Provide fallback values where appropriate

## Vercel Blob Integration (Design Storage)

The project uses Vercel Blob for persisting shared designs:

### Storage Implementation
- Designs are stored as JSON files with Vercel's default 30-day expiration
- Each design has a unique ID used in the file path: `designs/{id}.json`
- Files are stored with public access for easy sharing
- Implementation is in `/server/utils/designStore.ts`

### Local Development
- When Vercel Blob is not available (local development), it falls back to in-memory storage
- To test with actual Vercel Blob locally, add these environment variables:
  - `BLOB_READ_WRITE_TOKEN`

### API Endpoints
- `POST /api/designs/share` - Store a design for sharing
- `GET /api/designs/[id]` - Retrieve a shared design by ID

### Functions
- `storeDesign(id, data)` - Stores design data with the given ID
- `getDesign(id)` - Retrieves a design by ID
- `deleteDesign(id)` - Deletes a design by ID
- `listDesigns()` - Lists all stored designs (admin use)
