# Taxonomy Specification

*Source of truth: [`data/taxonomy.json`](../data/taxonomy.json) (Protected by `CODEOWNERS`; any change must follow `.agents/skills/change-taxonomy/SKILL.md`).*

## 1. Taxonomy Rules (`D2`, `D3`, `D13`, `D14`, Rule 5)

1. **Three-Level Hierarchy:**
   - **Level 1:** Category (10 categories)
   - **Level 2:** Subcategory (34 subcategories)
   - **Level 3:** Topic (139 exact topics across the 34 subcategories)
2. **Mandatory Complete Classification (`D2`, Rule 5):** Every item in Rada must have one valid `category_id`, `subcategory_id`, and `topic_id` that belong to the same parent-child branch. Any item or import row that fails this validation is **rejected and never shown**.
3. **Exact Topic Values:** Topic values are exact strings as listed below. *Genre* may become a separate facet later; it is **not** a topic.
4. **Non-Category Controls (`D3`, `D13`):**
   - **Variety** is a feed mode (`mode=variety`), not an 11th category.
   - **Free/Paid**, **Upcoming**, and **Local** are filter toggles, not categories.
5. **Slug Stability:** Never rename or delete a slug in `data/taxonomy.json` without a corresponding database migration.

---

## 2. Canonical Taxonomy Tree (10 Categories · 34 Subcategories)

### 1. Read (`read`)
- **News articles** (`news-articles`): World, Local, Business, Tech and science, Culture, Opinion
- **Books** (`books`): Fiction, Non-fiction, Biography, Self-development, Children and young adult, Comics and graphic novels
- **Blogs and newsletters** (`blogs-and-newsletters`): Tech, Finance, Creative, Lifestyle, Industry insights
- **Guides and other written resources** (`guides-and-other-written-resources`): How-to guides, Research and reports, Reference, Templates and checklists

### 2. Watch (`watch`)
- **Movies** (`movies`): Now showing, Classics, Hidden gems, Award winners
- **Series** (`series`): Currently airing, Completed, Binge-worthy, Hidden gems
- **Documentaries** (`documentaries`): Nature, History, Science, Society, Biography
- **Videos, creators and livestreams** (`videos-creators-and-livestreams`): Educational, Entertainment, Creator spotlights, Live now

### 3. Listen (`listen`)
- **Music** (`music`): New releases, Playlists, Artists, Live sessions
- **Podcasts** (`podcasts`): Interviews, Educational, Storytelling, News, Comedy
- **Audiobooks, radio and other audio** (`audiobooks-radio-and-other-audio`): Audiobooks, Radio stations, Ambient and focus sounds, Guided audio

### 4. Learn (`learn`)
- **Online courses** (`online-courses`): University-backed, Certificate programs, Self-paced, Cohort-based
- **Tutorials and practical skills** (`tutorials-and-practical-skills`): Tech, Creative, Trades, Life skills, Languages
- **Career and professional development** (`career-and-professional-development`): Interview prep, Skills upgrades, Leadership, Industry certifications

### 5. Play (`play`)
- **Online games** (`online-games`): Single player, Multiplayer, Casual, Strategy
- **Puzzles, quizzes, simulations and interactive stories** (`puzzles-quizzes-simulations-and-interactive-stories`): Puzzles, Quizzes, Simulations, Interactive fiction

### 6. Connect (`connect`)
- **Social media accounts** (`social-media-accounts`): Creators, Experts, Brands, Public figures
- **Forums and online communities** (`forums-and-online-communities`): Hobby, Professional, Support, Local
- **Discussion groups and clubs** (`discussion-groups-and-clubs`): Book clubs, Study groups, Interest clubs

### 7. Make and Explore (`make-and-explore`)
- **Hobbies, crafts and DIY projects** (`hobbies-crafts-and-diy-projects`): Crafts, Home projects, Cooking, Gardening
- **Creative prompts and projects** (`creative-prompts-and-projects`): Writing, Art and design, Music, Photography
- **Apps, tools and useful websites** (`apps-tools-and-useful-websites`): Productivity, Creative tools, Learning tools, Utilities

### 8. Attend and Experience (`attend-and-experience`)
- **Online events** (`online-events`): Webinars, Workshops, Conferences, Live streams
- **In-person events** (`in-person-events`): Concerts, Meetups, Festivals, Exhibitions
- **Virtual tours and places to explore** (`virtual-tours-and-places-to-explore`): Museums, Landmarks, Nature
- **Local activities** (`local-activities`): Outdoors, Food and drink, Family, Arts and culture

### 9. Improve and Contribute (`improve-and-contribute`)
- **Wellness and fitness** (`wellness-and-fitness`): Exercise, Mental wellbeing, Nutrition, Sleep
- **Volunteering and community causes** (`volunteering-and-community-causes`): Local, Remote, Skills-based, One-off
- **Civic or environmental participation** (`civic-or-environmental-participation`): Clean-ups, Community projects, Campaigns

### 10. Earn and Build (`earn-and-build`)
- **Passive-income activities** (`passive-income-activities`): Digital products, Investing basics, Content-based
- **Scholarships and grants** (`scholarships-and-grants`): Students, Creatives, Small business, Research
- **Hackathons and competitions** (`hackathons-and-competitions`): Coding, Writing, Design, Business
- **Side projects and small businesses** (`side-projects-and-small-businesses`): Ideas, Starter guides, Funding
- **Money and career resources** (`money-and-career-resources`): Budgeting, Taxes, Job boards, Freelancing
