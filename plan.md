# Multi-Page Routing Implementation Plan

## Overview
Convert the single-page landing site into a multi-page app with React Router. Create 4 dedicated pages (Solutions, Platform, Research, Company) plus a Home page.

## 1. Add React Router
- Add `react-router-dom` to the importmap in `index.html` (project uses esm.sh CDN, not npm)
- Wrap app in `BrowserRouter` in `index.tsx`

## 2. Update Navbar
- Replace `<a href="#...">` with React Router `<Link to="/...">`
- Add active link highlighting based on current route
- Logo links to `/`
- Contact button links to `/company` (contact section)
- Mobile menu closes on navigation

## 3. Page Structure

### Home Page (`/`) — `pages/Home.tsx`
- Hero (reuse existing)
- BigType (reuse existing)
- New: **HomePreview** — 4 preview cards linking to each sub-page (Solutions, Platform, Research, Company) with brief descriptions and hover animations
- Footer (reuse existing)

### Solutions Page (`/solutions`) — `pages/Solutions.tsx`
- **SolutionsHero** — Page title with subtitle, GSAP fade-in
- ValueProp (reuse existing, remove `id`)
- **UseCases** — Grid of 4 industry cards (Healthcare, Finance, Government, Defense) with icons, hover effects
- **SolutionsCTA** — Call-to-action banner
- Footer

### Platform Page (`/platform`) — `pages/Platform.tsx`
- **PlatformHero** — Page title with subtitle
- Features stacking cards (reuse existing, remove `id`)
- VideoShowcase (reuse existing — currently unused in App.tsx)
- **TechSpecs** — Technical specifications grid (latency, nodes, uptime, compliance)
- Footer

### Research Page (`/research`) — `pages/Research.tsx`
- **ResearchHero** — Page title with subtitle
- Pillars (reuse existing, remove `id`)
- **Publications** — Research paper cards with titles, abstracts, tags
- **Methodology** — Deep-dive into federated learning approach with numbered steps
- Footer

### Company Page (`/company`) — `pages/Company.tsx`
- **CompanyHero** — Page title with subtitle
- AboutSection (reuse existing)
- **Mission** — Mission/vision statement with large typography
- **Team** — Team member cards with roles
- **Contact** — Contact form section
- Footer

## 4. App.tsx Changes
- Remove all section components from single-page layout
- Add React Router `<Routes>` with 5 routes
- Keep Lenis smooth scroll + ScrollTrigger setup
- Add scroll-to-top on route change

## 5. New Files
```
pages/
  Home.tsx
  Solutions.tsx
  Platform.tsx
  Research.tsx
  Company.tsx
components/
  PageHero.tsx        (reusable page hero for sub-pages)
  HomePreview.tsx     (preview cards for home page)
  UseCases.tsx        (solutions page)
  TechSpecs.tsx       (platform page)
  Publications.tsx    (research page)
  Methodology.tsx     (research page)
  Mission.tsx         (company page)
  Team.tsx            (company page)
  Contact.tsx         (company page)
```

## 6. Modified Files
- `index.html` — add react-router-dom to importmap
- `index.tsx` — wrap in BrowserRouter
- `App.tsx` — routing setup, scroll restoration
- `components/Navbar.tsx` — React Router Links
- `vite.config.ts` — add historyApiFallback for SPA routing

## Design Consistency
- All new sections follow the existing pattern: dark bg (#050a0a), lime green accents (#ccff00), Manrope font, GSAP scroll animations, glassmorphism cards, border-white/10 borders
- Every new section gets GSAP `fromTo` + `ScrollTrigger` animations matching existing stagger patterns
- Responsive: mobile-first with `md:` and `lg:` breakpoints
