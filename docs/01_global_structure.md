# CTS Global Structure

## Main Routes

- `/`  
  Landing / Homepage

- `/services`  
  Services overview

- `/gallery`  
  Visual gallery / experiments / selected works

- `/case-study/:slug`  
  Individual case study pages

- `/project/:slug`  
  Heavy interactive or custom project pages

## Architecture Rule

The landing page can be visually connected and lightweight.

Heavy pages must be independent routes:
- separate loading
- separate UI logic
- separate visual direction when needed
- lazy-loaded media/assets
- no global heavy systems loaded on homepage

## Responsive Rule

Every page must be mobile-first:
- mobile
- tablet
- desktop
- wide desktop

No page is approved unless it works correctly across all breakpoints.