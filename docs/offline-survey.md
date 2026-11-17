# Offline Content Survey & Owner Seed Workbook

This document is the **offline survey workbook** for building Rada's foundational content library independently of the public browser survey (`/survey`).

- **Owner curation (offline):** Use this workbook and its companion spreadsheet [`data/seed/offline-survey.csv`](../data/seed/offline-survey.csv) to fill in as many items and fields as possible on your own, without the public survey's per-subcategory cap. (For broad platforms spanning multiple topics, use `<subcategory-slug>-general` for `General / All topics`.)
- **Public contributions (online):** The browser survey at `/survey` (linked from the landing page) remains open for other people to submit their own suggestions into the human review queue (`/review`).
- **Launch coverage target:** At least **10 approved items per subcategory** across all 34 subcategories (340+ items minimum).

---

## 1. Field Reference (Full Library Schema)

Unlike the public `/survey` form (which only collects `title`, `url`, `pick_type`, optional `topic`, and optional `note`), this offline workbook lets you fill in **all** library item fields directly:

| Field | Required? | Format / Allowed Values | Notes |
| :--- | :--- | :--- | :--- |
| `title` | **Yes** | Plain text | Clear, descriptive title of the content. |
| `url` | **Yes** | Valid `http://` or `https://` URL | Canonical link; strip tracking params (`utm_*`, `fbclid`, etc.). |
| `category` | **Yes** | Exact Category slug (Level 1) | Must match [`data/taxonomy.json`](../data/taxonomy.json). |
| `subcategory` | **Yes** | Exact Subcategory slug (Level 2) | Must belong to the chosen `category`. |
| `topic` | **Yes** | Exact Topic slug (Level 3) | Must belong to the chosen `subcategory`. |
| `source_name` | Optional (default `Curated`) | Plain text | Creator, publisher, or platform name (e.g., `BBC`, `MIT Tech Review`). *(If content has multiple sources, see Open Question `O12` in [`open-questions.md`](./product/open-questions.md).)* |
| `description` | Optional | Plain text, **max 280 characters** | Concise, factual, non-promotional summary. |
| `cost` | Optional (default `unknown`) | `free` \| `paid` \| `unknown` | Used by the **Free/Paid** filter toggle (`free` includes freemium/free-tier items; `paid` for paywalled/paid-only, per `D28`). |
| `starts_at` | Optional (dated items) | ISO 8601 UTC/offset datetime (e.g., `2026-12-01T18:00:00Z`) | Required if the item is an upcoming event/release. |
| `ends_at` | Optional (dated items) | ISO 8601 UTC/offset datetime | Past-dated items are automatically marked `expired` on import. |
| `timezone` | Optional (dated items) | IANA timezone (e.g., `Africa/Nairobi`, `UTC`) | Display timezone for events. |
| `region` | Optional | Country/city/region string | Used by the **Local** filter toggle. |

> **Optional survey-style notes (workbook only):** While drafting in Markdown below, you may also note `pick_type` (`useful` | `impactful` | `favorite`) or personal notes, though only the 12 columns above are imported by `scripts/import-seed-csv.ts`.

---

## 2. How to Fill & Import

1. **Draft here or in [`data/seed/offline-survey.csv`](../data/seed/offline-survey.csv):**
   - Add as many rows as you want in any category/subcategory.
   - Use the exact slugs from Section 3 below so every row passes strict taxonomy validation (`AGENTS.md` Rule 5).
2. **Validate & import into the database:**
   - Run the seed importer against your CSV:
     ```bash
     pnpm tsx scripts/import-seed-csv.ts data/seed/offline-survey.csv
     ```
   - To approve your own curated entries immediately on import (instead of leaving them `pending` in `/review`), pass `--approve`:
     ```bash
     pnpm tsx scripts/import-seed-csv.ts data/seed/offline-survey.csv --approve
     ```
   - Duplicate URLs are automatically skipped (and when public survey duplicates are merged in `/review`, `popularity_count` increments on the canonical item).

---

## 3. Offline Survey Sections by Category & Subcategory

Fill in your entries under each category below (or directly in [`data/seed/offline-survey.csv`](../data/seed/offline-survey.csv) using the exact slugs in parentheses).

### 1. Read (`read`)

- **News and articles** (`news-articles`): `news-articles-world` (World), `news-articles-local` (Local), `news-articles-business` (Business), `news-articles-tech-and-science` (Tech and science), `news-articles-culture` (Culture), `news-articles-opinion` (Opinion), `news-articles-sports` (Sports), `news-articles-general` (General / All topics)
- **Books** (`books`): `books-fiction` (Fiction), `books-non-fiction` (Non-fiction), `books-biography` (Biography), `books-self-development` (Self-development), `books-children-and-young-adult` (Children and young adult), `books-comics-and-graphic-novels` (Comics and graphic novels)
- **Blogs and newsletters** (`blogs-and-newsletters`): `blogs-and-newsletters-tech` (Tech), `blogs-and-newsletters-finance` (Finance), `blogs-and-newsletters-creative` (Creative), `blogs-and-newsletters-lifestyle` (Lifestyle), `blogs-and-newsletters-industry-insights` (Industry insights)
- **Guides and other written resources** (`guides-and-other-written-resources`): `guides-how-to-guides` (How-to guides), `guides-research-and-reports` (Research and reports), `guides-reference` (Reference), `guides-templates-and-checklists` (Templates and checklists)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 2. Watch (`watch`)

- **Movies** (`movies`): `movies-now-showing` (Now showing), `movies-classics` (Classics), `movies-hidden-gems` (Hidden gems), `movies-award-winners` (Award winners)
- **Series** (`series`): `series-currently-airing` (Currently airing), `series-completed` (Completed), `series-binge-worthy` (Binge-worthy), `series-hidden-gems` (Hidden gems)
- **Documentaries** (`documentaries`): `documentaries-nature` (Nature), `documentaries-history` (History), `documentaries-science` (Science), `documentaries-society` (Society), `documentaries-biography` (Biography)
- **Videos, creators and livestreams** (`videos-creators-and-livestreams`): `videos-educational` (Educational), `videos-entertainment` (Entertainment), `videos-creator-spotlights` (Creator spotlights), `videos-live-now` (Live now)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 3. Listen (`listen`)

- **Music** (`music`): `music-new-releases` (New releases), `music-playlists` (Playlists), `music-artists` (Artists), `music-live-sessions` (Live sessions)
- **Podcasts** (`podcasts`): `podcasts-interviews` (Interviews), `podcasts-educational` (Educational), `podcasts-storytelling` (Storytelling), `podcasts-news` (News), `podcasts-comedy` (Comedy)
- **Audiobooks, radio and other audio** (`audiobooks-radio-and-other-audio`): `audio-audiobooks` (Audiobooks), `audio-radio-stations` (Radio stations), `audio-ambient-and-focus-sounds` (Ambient and focus sounds), `audio-guided-audio` (Guided audio)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 4. Learn (`learn`)

- **Online courses** (`online-courses`): `online-courses-university-backed` (University-backed), `online-courses-certificate-programs` (Certificate programs), `online-courses-self-paced` (Self-paced), `online-courses-cohort-based` (Cohort-based)
- **Tutorials and practical skills** (`tutorials-and-practical-skills`): `tutorials-tech` (Tech), `tutorials-creative` (Creative), `tutorials-trades` (Trades), `tutorials-life-skills` (Life skills), `tutorials-languages` (Languages)
- **Career and professional development** (`career-and-professional-development`): `career-interview-prep` (Interview prep), `career-skills-upgrades` (Skills upgrades), `career-leadership` (Leadership), `career-industry-certifications` (Industry certifications)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 5. Play (`play`)

- **Online games** (`online-games`): `online-games-single-player` (Single player), `online-games-multiplayer` (Multiplayer), `online-games-casual` (Casual), `online-games-strategy` (Strategy)
- **Puzzles, quizzes, simulations and interactive stories** (`puzzles-quizzes-simulations-and-interactive-stories`): `puzzles-puzzles` (Puzzles), `puzzles-quizzes` (Quizzes), `puzzles-simulations` (Simulations), `puzzles-interactive-fiction` (Interactive fiction)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 6. Connect (`connect`)

- **Social media accounts** (`social-media-accounts`): `social-media-creators` (Creators), `social-media-experts` (Experts), `social-media-brands` (Brands), `social-media-public-figures` (Public figures)
- **Forums and online communities** (`forums-and-online-communities`): `forums-hobby` (Hobby), `forums-professional` (Professional), `forums-support` (Support), `forums-local` (Local)
- **Discussion groups and clubs** (`discussion-groups-and-clubs`): `discussion-groups-book-clubs` (Book clubs), `discussion-groups-study-groups` (Study groups), `discussion-groups-interest-clubs` (Interest clubs)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 7. Make and Explore (`make-and-explore`)

- **Hobbies, crafts and DIY projects** (`hobbies-crafts-and-diy-projects`): `hobbies-crafts` (Crafts), `hobbies-home-projects` (Home projects), `hobbies-cooking` (Cooking), `hobbies-gardening` (Gardening)
- **Creative prompts and projects** (`creative-prompts-and-projects`): `creative-prompts-writing` (Writing), `creative-prompts-art-and-design` (Art and design), `creative-prompts-music` (Music), `creative-prompts-photography` (Photography)
- **Apps, tools and useful websites** (`apps-tools-and-useful-websites`): `apps-productivity` (Productivity), `apps-creative-tools` (Creative tools), `apps-learning-tools` (Learning tools), `apps-utilities` (Utilities)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 8. Attend and Experience (`attend-and-experience`)

- **Online events** (`online-events`): `online-events-webinars` (Webinars), `online-events-workshops` (Workshops), `online-events-conferences` (Conferences), `online-events-live-streams` (Live streams)
- **In-person events** (`in-person-events`): `in-person-events-concerts` (Concerts), `in-person-events-meetups` (Meetups), `in-person-events-festivals` (Festivals), `in-person-events-exhibitions` (Exhibitions)
- **Virtual tours and places to explore** (`virtual-tours-and-places-to-explore`): `virtual-tours-museums` (Museums), `virtual-tours-landmarks` (Landmarks), `virtual-tours-nature` (Nature)
- **Local activities** (`local-activities`): `local-activities-outdoors` (Outdoors), `local-activities-food-and-drink` (Food and drink), `local-activities-family` (Family), `local-activities-arts-and-culture` (Arts and culture)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 9. Improve and Contribute (`improve-and-contribute`)

- **Wellness and fitness** (`wellness-and-fitness`): `wellness-exercise` (Exercise), `wellness-mental-wellbeing` (Mental wellbeing), `wellness-nutrition` (Nutrition), `wellness-sleep` (Sleep)
- **Volunteering and community causes** (`volunteering-and-community-causes`): `volunteering-local` (Local), `volunteering-remote` (Remote), `volunteering-skills-based` (Skills-based), `volunteering-one-off` (One-off)
- **Civic or environmental participation** (`civic-or-environmental-participation`): `civic-clean-ups` (Clean-ups), `civic-community-projects` (Community projects), `civic-campaigns` (Campaigns)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |

---

### 10. Earn and Build (`earn-and-build`)

- **Passive-income activities** (`passive-income-activities`): `passive-income-digital-products` (Digital products), `passive-income-investing-basics` (Investing basics), `passive-income-content-based` (Content-based)
- **Scholarships and grants** (`scholarships-and-grants`): `scholarships-students` (Students), `scholarships-creatives` (Creatives), `scholarships-small-business` (Small business), `scholarships-research` (Research)
- **Hackathons and competitions** (`hackathons-and-competitions`): `hackathons-coding` (Coding), `hackathons-writing` (Writing), `hackathons-design` (Design), `hackathons-business` (Business)
- **Side projects and small businesses** (`side-projects-and-small-businesses`): `side-projects-ideas` (Ideas), `side-projects-starter-guides` (Starter guides), `side-projects-funding` (Funding)
- **Money and career resources** (`money-and-career-resources`): `money-budgeting` (Budgeting), `money-taxes` (Taxes), `money-job-boards` (Job boards), `money-freelancing` (Freelancing)

| title | url | subcategory | topic | source_name | description | cost | starts_at | ends_at | timezone | region |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | | |
