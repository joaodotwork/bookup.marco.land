# Bookup

Bookup, formerly spelled as *Boockup*, is a web-based tool built with Nuxt 3 that allows users to generate a spinning preview of a book with multiple design options.

## Features

- Upload and visualize your book cover design in 3D
- Create multiple design variations (A/B testing)
- Adjust book dimensions and proportions
- Customize lighting and background colors
- Animate and rotate book for dynamic presentations
- Share designs via URL without requiring accounts
- Responsive design for mobile and desktop

## Setup

```bash
# Install the dependencies
pnpm install

# Start the development server on `http://localhost:3000`
pnpm run dev

# Build the application for production
pnpm run build

# Run lint
pnpm run lint
```

## Deployment

This project is configured for deployment on Vercel:

### Vercel Blob Integration

For shared design persistence, the project uses Vercel Blob:

1. In your Vercel project, set up Blob storage:
   - Go to Storage > Blob
   - Create a new Blob store named "bookup-designs"
   - Follow the prompts to connect it to your project

2. Vercel will automatically add the required environment variables:
   - `BLOB_READ_WRITE_TOKEN`
   - `VERCEL_BLOB_READ_WRITE_TOKEN` (in production)

3. During development, the app will fall back to in-memory storage if these environment variables are not present.

4. Designs are stored as JSON files with a 30-day automatic expiration to prevent unlimited growth.

## Acknowledgments
- [Nuxt 3](https://nuxt.com/)
- [Nuxt UI](https://ui.nuxt.com/)
- [Vercel Blob](https://vercel.com/storage/blob)
- [DeSandro's Intro to CSS 3D Transforms](https://3dtransforms.desandro.com/)
