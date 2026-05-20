# Lanka-Spec

Lanka-Spec is a Next.js showcase for late-1990s performance cars. It gives you a curated JDM catalog, full spec sheets for each vehicle, a local compare wishlist, and a comparison studio that can generate a practical verdict with Gemini when an API key is available.

## What You Can Do

- Browse the main car gallery on the home page.
- Open a dedicated detail page for any vehicle to see its full specification sheet.
- Save cars to a compare wishlist from the cards or the comparison studio.
- Search the archive in the compare studio and compare two or more vehicles side by side.
- View saved wishlist history and any Gemini-generated vehicle profiles.
- Use the contact page for collaboration or media inquiries.

## Routes

- `/` - curated car catalog
- `/cars/[id]` - individual vehicle detail page
- `/compare` - comparison studio and wishlist manager
- `/history` - saved wishlist and generated vehicle history
- `/contact` - contact page

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `react-markdown` and `remark-gfm` for comparison output
- Local JSON persistence through `compare.json`
- Optional Gemini API integration for vehicle resolution and comparison summaries

## Getting Started

1. Install dependencies.

```bash
npm install
```

2. Start the development server.

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optional Configuration

The app works without any environment variables, but these improve the compare experience:

- `GEMINI_API_KEY` or `GOOGLE_GEMINI_API_KEY` - enables Gemini-backed vehicle resolution and comparison summaries.
- `GEMINI_MODEL` - overrides the Gemini model name. Defaults to `gemini-1.5-flash`.

If no API key is configured, the app falls back to local comparison summaries and still works normally.

## Data Storage

- `data/vehicles.ts` contains the built-in vehicle collection.
- `compare.json` stores the saved wishlist and any generated vehicle profiles.
- The compare storage file is created automatically the first time it is needed.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build the app for production
- `npm start` - run the production server
- `npm run lint` - run ESLint

## Project Structure

- `app/` - routes, layouts, and API endpoints
- `components/` - shared UI and compare workflow components
- `data/` - the seeded vehicle collection
- `lib/` - local compare storage helpers
- `public/` - static images and assets

