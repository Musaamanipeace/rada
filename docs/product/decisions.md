# Product & Architectural Decisions Log

*Source of truth (#1 in `AGENTS.md` Rule 1).*
*Statuses: `LOCKED` = decided by the owner (do not change without explicit owner instruction). `PROPOSED` = suggested, awaiting owner confirmation.*

| ID | Decision | Status |
| :--- | :--- | :--- |
| **D1** | Responsive PWA first; native apps only if needed later | `LOCKED` |
| **D2** | Categories act as filters. Every item has one category, subcategory and topic; items that fail this are rejected, never shown | `LOCKED` |
| **D3** | Variety is a feed mode, not an eleventh category | `LOCKED` |
| **D4** | My Catalogues = the user's private saved items, organised by category; un-save allowed | `LOCKED` |
| **D5** | Future-dated items (unreleased movies, events, launches) offer Add to calendar | `LOCKED` |
| **D6** | Users can hide image thumbnails | `LOCKED` |
| **D7** | No ads in the feed; ads live only in the Watch Ads tab | `LOCKED` |
| **D8** | Cold start uses the interests the user states. Only in-app interactions are tracked; no browser history, cookies or cache are read for tracking | `LOCKED` |
| **D9** | A pre-launch survey collects suggestions per category and subcategory, then prompts signup | `LOCKED` |
| **D10** | Library grows in stages: hand-curated seed plus survey, then automated imports for dated content, then open user submissions | `PROPOSED` |
| **D11** | Browsing is open; saving, calendar, portfolio and advertiser accounts need an account | `PROPOSED` |
| **D12** | Calendar entries keep a link to the source item; a changed date shows a notice instead of silently editing | `PROPOSED` |
| **D13** | Free/Paid, Upcoming and Local are toggles, not categories | `PROPOSED` |
| **D14** | Level 3 topics (`docs/taxonomy.md` / `data/taxonomy.json`) and the technology stack ([ADR-0001](../architecture/adr/0001-stack.md) confirmed in Phase 0) | `LOCKED` |
| **D15** | Discarded from the first chatbot draft: weather tiles, AI-vs-human badges, save-interruption anchoring | `LOCKED` |
| **D16** | Watch Ads is voluntary and user-initiated: people go to the tab when they want to watch ads, instead of waiting for ads to pop up elsewhere. Ads are never pushed, popped up or inserted into any other tab. Viewers get no compensation of any kind, and the tab is not framed as supporting the site | `LOCKED` |
| **D17** | Ads are meant to be informative or entertaining, so people choose to watch them of their own will | `LOCKED` |
| **D18** | Ads are direct-sold only at launch: advertisers use the Advertiser portal, and no third-party ad network or tracking script is used. A network such as AdSense is reconsidered only once Rada has real content and traffic | `LOCKED` |
| **D19** | Each approved advertiser gets a free allowance of qualified views; after that they pay per qualified view at a fixed rate card, from a prepaid balance. No auctions in the MVP | `LOCKED` |
| **D20** | A person reviews every advertiser and every ad before it goes live | `PROPOSED` |
| **D21** | MVP ad formats: story (1 to 5 image slides with text and a call to action), then video of up to 60 seconds | `PROPOSED` |
| **D22** | Ad targeting uses only the categories a viewer chooses to browse in Watch Ads, plus an optional region; no personal data is shared with advertisers | `PROPOSED` |
| **D23** | Watch Ads is behind a switch that is off at launch. It is turned on when the first advertiser is approved | `LOCKED` |
| **D24** | Payments start manual: the owner agrees payment with each advertiser and adds credit by hand in an admin screen. A payment provider is added later only if self-serve top-ups become worthwhile | `LOCKED` |
| **D25** | The site is called Rada | `LOCKED` |
| **D26** | Pre-launch survey suggestions require both Title and valid URL; rendered in summary and reviewer queue as clickable titles with external links | `LOCKED` |

---

## Architecture Decision Records (ADRs)

| ADR | Title | Status | Linked Decision |
| :--- | :--- | :--- | :--- |
| [ADR-0001](../architecture/adr/0001-stack.md) | Modular Monolith Technology Stack (Next.js App Router, TypeScript, Tailwind, PostgreSQL/Prisma, Auth.js, TanStack, Zustand, Serwist) | `PROPOSED` | D1, D14 |
