import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { csvRowSchema, CsvRowInput } from "./import-seed-csv";
import taxonomyData from "../data/taxonomy.json";

interface ExtractedItem {
  title: string;
  url: string;
  category: string;
  subcategory: string;
  topic: string;
  source_name: string;
  description: string;
  cost: "free" | "paid" | "unknown";
  region?: string;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (u.includes(" • ")) {
    u = u.split(" • ")[0].trim();
  }
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u;
}

function truncateDesc(desc: string, maxLen = 270): string {
  let d = desc.trim().replace(/\s+/g, " ");
  if (d.length <= maxLen) return d;
  return d.slice(0, maxLen - 3) + "...";
}

export function parseAnswers(): ExtractedItem[] {
  const filePath = resolve(process.cwd(), "docs/answers.md");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const items: ExtractedItem[] = [];

  // 1. RSS tools (lines 7-26)
  const rssTools = [
    { title: "NewsBlur", url: "https://newsblur.com", desc: "Full-text article fetcher, intelligence trainer, and offline reading (free up to 64 feeds)." },
    { title: "Inoreader", url: "https://www.inoreader.com", desc: "Built-in full-article text view, powerful search, custom automation rules, and dark mode." },
    { title: "Feedly", url: "https://feedly.com", desc: "Magazine and card layouts, Read Later boards, keyword alerts, and fast search across subscribed outlets." },
    { title: "Feeder", url: "https://feeder.co", desc: "Free and open-source reader with zero account required, local offline storage, and OPML import/export." },
    { title: "Aggregator News", url: "https://play.google.com/store/apps/details?id=com.aggregator.news", desc: "Lightweight distraction-free reader, custom categories, offline caching, and local OPML backup." },
  ];
  for (const t of rssTools) {
    items.push({
      title: t.title,
      url: t.url,
      category: "make-and-explore",
      subcategory: "apps-tools-and-useful-websites",
      topic: "apps-productivity",
      source_name: t.title,
      description: truncateDesc(t.desc),
      cost: "free",
    });
  }

  // Helper to extract 4-line items between startLine and endLine
  function extract4LineBlock(
    startLineIdx: number,
    endLineIdx: number,
    cat: string,
    sub: string,
    topicSelector: (title: string, subcat: string, desc: string, extra: string) => string,
    costSelector: (title: string, extra: string) => "free" | "paid" | "unknown" = () => "free",
    sourceNameExtractor: (title: string, extra: string) => string = (t) => t,
    region?: string
  ) {
    let i = startLineIdx;
    while (i < endLineIdx && i < lines.length) {
      const line1 = lines[i]?.trim();
      const line2 = lines[i + 1]?.trim();
      const line3 = lines[i + 2]?.trim();
      const line4 = lines[i + 3]?.trim();

      if (!line1 || !line2 || !line3 || !line4) {
        i++;
        continue;
      }

      // Check if line4 looks like a link or starts with http or domain
      if (
        line4.startsWith("http") ||
        line4.includes(".com") ||
        line4.includes(".org") ||
        line4.includes(".ke") ||
        line4.includes(".co") ||
        line4.includes(".net") ||
        line4.includes(".digital") ||
        line4.includes(".africa") ||
        line4.includes(".fm") ||
        line4.includes(".me") ||
        line4.includes(".io") ||
        line4.includes(".tv")
      ) {
        let cleanUrl = line4;
        if (cleanUrl.startsWith("[") && cleanUrl.includes("]")) {
          // suspicious link removed placeholder
          i += 4;
          continue;
        }
        cleanUrl = normalizeUrl(cleanUrl);

        try {
          new URL(cleanUrl);
        } catch {
          i += 4;
          continue;
        }

        const topic = topicSelector(line1, line2, line3, line4);
        const cost = costSelector(line1, line2);
        const sourceName = sourceNameExtractor(line1, line2);

        items.push({
          title: line1,
          url: cleanUrl,
          category: cat,
          subcategory: sub,
          topic,
          source_name: sourceName,
          description: truncateDesc(line3),
          cost,
          region,
        });

        i += 4;
      } else {
        i++;
      }
    }
  }

  // 2. News sites (lines 33-122)
  extract4LineBlock(
    33,
    122,
    "read",
    "news-articles",
    (title) => {
      const t = title.toLowerCase();
      if (t.includes("sport") || t.includes("football")) return "news-articles-sports";
      if (t.includes("business") || t.includes("how we made it")) return "news-articles-business";
      if (t.includes("eastafrican") || t.includes("citizen") || t.includes("capital fm") || t.includes("star kenya")) return "news-articles-local";
      if (t.includes("hacker news") || t.includes("techmeme") || t.includes("ars technica") || t.includes("technology review")) return "news-articles-tech-and-science";
      if (t.includes("aeon") || t.includes("open culture")) return "news-articles-culture";
      if (t.includes("project syndicate")) return "news-articles-opinion";
      return "news-articles-world";
    },
    () => "free",
    (title) => title
  );

  // 3. Books (lines 129-242)
  extract4LineBlock(
    129,
    242,
    "read",
    "books",
    (title, genre) => {
      const g = genre.toLowerCase();
      if (g.includes("self-development") || g.includes("habits") || g.includes("subtle art")) return "books-self-development";
      if (g.includes("biography") || g.includes("mandela") || g.includes("douglass")) return "books-biography";
      if (g.includes("children")) return "books-children-and-young-adult";
      if (g.includes("comics") || g.includes("graphic")) return "books-comics-and-graphic-novels";
      if (g.includes("fiction") || g.includes("poetry")) return "books-fiction";
      return "books-non-fiction";
    },
    () => "free",
    (title, genre) => {
      const author = genre.split("—")[0].trim();
      return author.length > 0 && author.length < 50 ? author : "Author";
    }
  );

  // 4. Blogs & Newsletters (lines 250-315)
  // Format: Title, Link, Description, Type
  let i = 250;
  while (i < 315 && i < lines.length) {
    const title = lines[i]?.trim();
    const urlLine = lines[i + 1]?.trim();
    const desc = lines[i + 2]?.trim();
    const type = lines[i + 3]?.trim();
    if (title && urlLine?.startsWith("http") && desc && type) {
      const t = title.toLowerCase();
      let topic = "blogs-and-newsletters-general";
      if (t.includes("techcabal") || t.includes("pragmatic") || t.includes("tldr") || t.includes("stratechery") || t.includes("rest of world")) {
        topic = "blogs-and-newsletters-tech";
      } else if (t.includes("mwango") || t.includes("stears") || t.includes("weetracker")) {
        topic = "blogs-and-newsletters-finance";
      } else if (t.includes("brain pickings") || t.includes("marginalian") || t.includes("wait but why") || t.includes("africa is a country")) {
        topic = "blogs-and-newsletters-creative";
      } else if (t.includes("james clear") || t.includes("farnam street") || t.includes("republic")) {
        topic = "blogs-and-newsletters-lifestyle";
      } else if (t.includes("semafor")) {
        topic = "blogs-and-newsletters-industry-insights";
      }

      items.push({
        title,
        url: normalizeUrl(urlLine),
        category: "read",
        subcategory: "blogs-and-newsletters",
        topic,
        source_name: title,
        description: truncateDesc(desc),
        cost: "free",
      });
      i += 4;
    } else {
      i++;
    }
  }

  // 5. Guides and other written resources (lines 322-387)
  // Format: Title, Link, Description, Type
  i = 322;
  while (i < 387 && i < lines.length) {
    const title = lines[i]?.trim();
    const urlLine = lines[i + 1]?.trim();
    const desc = lines[i + 2]?.trim();
    const type = lines[i + 3]?.trim();
    if (title && urlLine?.startsWith("http") && desc && type) {
      const t = title.toLowerCase();
      let topic = "guides-how-to-guides";
      if (t.includes("mdn") || t.includes("archwiki") || t.includes("rtings") || t.includes("gsmarena") || t.includes("notebookcheck")) {
        topic = "guides-reference";
      } else if (t.includes("arxiv") || t.includes("scholar") || t.includes("our world in data") || t.includes("gsma")) {
        topic = "guides-research-and-reports";
      }

      items.push({
        title,
        url: normalizeUrl(urlLine),
        category: "read",
        subcategory: "guides-and-other-written-resources",
        topic,
        source_name: title,
        description: truncateDesc(desc),
        cost: "free",
      });
      i += 4;
    } else {
      i++;
    }
  }

  // 6 & 7. Movies (lines 393-561)
  extract4LineBlock(
    393,
    561,
    "watch",
    "movies",
    () => "movies-award-winners",
    () => "paid",
    (title, extra) => {
      if (extra.includes("Christopher Nolan")) return "Christopher Nolan";
      if (extra.includes("Steven Spielberg")) return "Steven Spielberg";
      if (extra.includes("Stanley Kubrick")) return "Stanley Kubrick";
      if (extra.includes("Clint Eastwood")) return "Clint Eastwood";
      if (extra.includes("Martin Scorsese")) return "Martin Scorsese";
      if (extra.includes("Quentin Tarantino")) return "Quentin Tarantino";
      return "Cinema";
    }
  );

  // 8. Series (lines 567-664)
  extract4LineBlock(
    567,
    664,
    "watch",
    "series",
    (title, tone) => {
      const t = title.toLowerCase();
      if (t.includes("severance") || t.includes("foundation") || t.includes("the boys") || t.includes("mandalorian") || t.includes("rick and morty")) {
        return "series-currently-airing";
      }
      if (t.includes("lost") || t.includes("friends") || t.includes("dark") || t.includes("the leftovers") || t.includes("modern family")) {
        return "series-completed";
      }
      return "series-binge-worthy";
    },
    () => "paid",
    (title) => title
  );

  // 9. Documentaries (lines 670-759)
  extract4LineBlock(
    670,
    759,
    "watch",
    "documentaries",
    (title, subj) => {
      const s = subj.toLowerCase();
      if (s.includes("science") || s.includes("technology")) return "documentaries-science";
      if (s.includes("nature") || s.includes("wildlife")) return "documentaries-nature";
      if (s.includes("biography") || s.includes("senna") || s.includes("amy") || s.includes("sugar man") || s.includes("jiro")) return "documentaries-biography";
      if (s.includes("society") || s.includes("rescue") || s.includes("hoop dreams") || s.includes("social dilemma") || s.includes("no other land")) return "documentaries-society";
      return "documentaries-history";
    },
    () => "paid",
    (title) => title
  );

  // 10. Videos, creators and livestreams (lines 765-854)
  extract4LineBlock(
    765,
    854,
    "watch",
    "videos-creators-and-livestreams",
    (title, fmt) => {
      const f = fmt.toLowerCase();
      if (f.includes("livestream") || f.includes("live")) return "videos-live-now";
      if (f.includes("creator") || f.includes("vlog") || f.includes("storytelling") || f.includes("podcast")) return "videos-creator-spotlights";
      if (f.includes("football") || f.includes("entertainment")) return "videos-entertainment";
      return "videos-educational";
    },
    () => "free",
    (title) => title
  );

  // 11. Online courses (lines 860-941)
  extract4LineBlock(
    860,
    941,
    "learn",
    "online-courses",
    (title, cat) => {
      const c = cat.toLowerCase();
      const t = title.toLowerCase();
      if (t.includes("harvard") || t.includes("helsinki") || t.includes("mit") || t.includes("yale")) return "online-courses-university-backed";
      if (t.includes("certificate") || t.includes("cisco") || t.includes("ibm") || t.includes("google")) return "online-courses-certificate-programs";
      return "online-courses-self-paced";
    },
    () => "free",
    (title) => title
  );

  // 12. Tutorials and practical skills (lines 947-1028)
  extract4LineBlock(
    947,
    1028,
    "learn",
    "tutorials-and-practical-skills",
    (title, medium) => {
      const m = medium.toLowerCase();
      if (m.includes("programming") || m.includes("linux") || m.includes("sql") || m.includes("code") || m.includes("ai")) return "tutorials-tech";
      if (m.includes("design") || m.includes("drawing") || m.includes("guitar") || m.includes("music")) return "tutorials-creative";
      if (m.includes("diy") || m.includes("cooking") || m.includes("electronics")) return "tutorials-trades";
      if (m.includes("language")) return "tutorials-languages";
      return "tutorials-life-skills";
    },
    () => "free",
    (title) => title
  );

  // 13. Career & professional development (lines 1035-1116)
  extract4LineBlock(
    1035,
    1116,
    "learn",
    "career-and-professional-development",
    (title, focus) => {
      const f = focus.toLowerCase();
      if (f.includes("interview") || f.includes("leetcode") || f.includes("pramp")) return "career-interview-prep";
      if (f.includes("management") || f.includes("leadership") || f.includes("mentorship")) return "career-leadership";
      return "career-skills-upgrades";
    },
    () => "free",
    (title) => title
  );

  // 14. Music (lines 1122-1195)
  extract4LineBlock(
    1122,
    1195,
    "listen",
    "music",
    () => "music-artists",
    () => "free",
    (title) => title
  );

  // 15. Podcasts (lines 1201-1290)
  extract4LineBlock(
    1201,
    1290,
    "listen",
    "podcasts",
    (title, cat) => {
      const c = cat.toLowerCase();
      if (c.includes("news")) return "podcasts-news";
      if (c.includes("comedy")) return "podcasts-comedy";
      if (c.includes("storytelling") || c.includes("culture")) return "podcasts-storytelling";
      if (c.includes("interview")) return "podcasts-interviews";
      return "podcasts-educational";
    },
    () => "free",
    (title) => title
  );

  // 16. Audiobooks, radio and other audio (lines 1296-1377)
  extract4LineBlock(
    1296,
    1377,
    "listen",
    "audiobooks-radio-and-other-audio",
    (title, fmt) => {
      const f = fmt.toLowerCase();
      if (f.includes("audiobook") || f.includes("book")) return "audio-audiobooks";
      if (f.includes("radio") || f.includes("broadcast")) return "audio-radio-stations";
      return "audio-ambient-and-focus-sounds";
    },
    () => "free",
    (title) => title
  );

  // 17. Online games (lines 1383-1472)
  extract4LineBlock(
    1383,
    1472,
    "play",
    "online-games",
    (title, genre) => {
      const g = genre.toLowerCase();
      if (g.includes("strategy") || g.includes("board")) return "online-games-strategy";
      if (g.includes("multiplayer") || g.includes("party")) return "online-games-multiplayer";
      if (g.includes("casual") || g.includes("arcade")) return "online-games-casual";
      return "online-games-single-player";
    },
    () => "free",
    (title) => title
  );

  // 18. Puzzles, quizzes, simulations, interactive stories (lines 1478-1567)
  extract4LineBlock(
    1478,
    1567,
    "play",
    "puzzles-quizzes-simulations-and-interactive-stories",
    (title, subcat) => {
      const s = subcat.toLowerCase();
      if (s.includes("quiz") || s.includes("trivia") || s.includes("geography")) return "puzzles-quizzes";
      if (s.includes("simulation") || s.includes("physics") || s.includes("sandbox")) return "puzzles-simulations";
      if (s.includes("interactive fiction") || s.includes("narrative") || s.includes("rpg") || s.includes("adventure")) return "puzzles-interactive-fiction";
      return "puzzles-puzzles";
    },
    () => "free",
    (title) => title
  );

  // 19. Social media accounts (lines 1573-1654)
  extract4LineBlock(
    1573,
    1654,
    "connect",
    "social-media-accounts",
    (title, platform) => {
      const p = platform.toLowerCase();
      if (p.includes("creator") || p.includes("reviewer")) return "social-media-creators";
      if (p.includes("brand") || p.includes("news") || p.includes("nasa") || p.includes("reuters")) return "social-media-brands";
      return "social-media-experts";
    },
    () => "free",
    (title) => title.split("(@")[0].trim()
  );

  // 20. Discussion groups and clubs (lines 1660-1741)
  extract4LineBlock(
    1660,
    1741,
    "connect",
    "discussion-groups-and-clubs",
    (title, focus) => {
      const f = focus.toLowerCase();
      if (f.includes("book") || f.includes("literary")) return "discussion-groups-book-clubs";
      if (f.includes("study") || f.includes("language") || f.includes("speaking")) return "discussion-groups-study-groups";
      return "discussion-groups-interest-clubs";
    },
    () => "free",
    (title) => title
  );

  // 21. Online events (lines 1747-1828)
  extract4LineBlock(
    1747,
    1828,
    "attend-and-experience",
    "online-events",
    (title, type) => {
      const t = type.toLowerCase();
      if (t.includes("conference") || t.includes("keynote")) return "online-events-conferences";
      if (t.includes("stream") || t.includes("concert")) return "online-events-live-streams";
      return "online-events-workshops";
    },
    () => "free",
    (title) => title
  );

  // 22. Apps, tools and useful websites (lines 1843-1932)
  extract4LineBlock(
    1843,
    1932,
    "make-and-explore",
    "apps-tools-and-useful-websites",
    (title, cat) => {
      const c = cat.toLowerCase();
      if (c.includes("productivity") || c.includes("password") || c.includes("notes") || c.includes("sync")) return "apps-productivity";
      if (c.includes("creative") || c.includes("image") || c.includes("editor") || c.includes("diagram") || c.includes("writing")) return "apps-creative-tools";
      return "apps-utilities";
    },
    () => "free",
    (title) => title
  );

  // 23. Wellness & fitness (lines 1939-1980)
  extract4LineBlock(
    1939,
    1980,
    "improve-and-contribute",
    "wellness-and-fitness",
    (title, cat) => {
      const c = cat.toLowerCase();
      if (c.includes("running") || c.includes("workout") || c.includes("exercise")) return "wellness-exercise";
      if (c.includes("nutrition") || c.includes("food") || c.includes("supplement")) return "wellness-nutrition";
      if (c.includes("sleep")) return "wellness-sleep";
      return "wellness-mental-wellbeing";
    },
    () => "free",
    (title) => title
  );

  // 24. Kisumu fitness and stadiums (lines 1988-2065)
  // These are physical locations in Kisumu!
  // e.g. AFROFIT, Health Hub Oasis, Crossroads Spa, Powerflex Gym, Fit One Gym, Jomo Kenyatta Stadium, Kenyatta Sports Ground, Kisumu City Run
  const kisumuVenues = [
    { title: "AFROFIT Kisumu", url: "https://afrofit.life/", desc: "Modern gym floor with free weights, strength machines, cardio zones, and structured group fitness classes in Kisumu.", cost: "paid" as const, topic: "local-activities-general" },
    { title: "Health Hub Oasis (H2O) Kisumu", url: "https://h2o.co.ke/", desc: "Strength and conditioning facilities, aerobics, spin sessions, and wellness recovery services at Cosmopolitan Club.", cost: "paid" as const, topic: "local-activities-general" },
    { title: "Crossroads Spa and Fitness Centre", url: "https://www.crossroadspafitnesscenter.co.ke/", desc: "Daytime gym studio training paired with spa and physical recovery facilities in Kisumu.", cost: "paid" as const, topic: "local-activities-general" },
    { title: "Powerflex Gym Kisumu", url: "https://maps.google.com/?q=Powerflex+Gym+Kisumu", desc: "Dedicated free-weight stations, resistance gear, and early-morning opening hours in Kisumu.", cost: "paid" as const, topic: "local-activities-general" },
    { title: "Fit One Gym Kisumu", url: "https://maps.google.com/?q=Fit+One+Gym+Kisumu", desc: "Daily gym floor access seven days a week for strength and general conditioning on Sekou Toure Road.", cost: "paid" as const, topic: "local-activities-general" },
    { title: "Jomo Kenyatta International Sport Center", url: "https://maps.google.com/?q=Jomo+Kenyatta+International+Sport+Center+Kisumu", desc: "Regulation athletics track suitable for interval speed work, middle-distance pacing, and outdoor conditioning in Mamboleo.", cost: "free" as const, topic: "local-activities-outdoors" },
    { title: "Jomo Kenyatta Stadium Kisumu", url: "https://maps.google.com/?q=Jomo+Kenyatta+Stadium+Mamboleo+Kisumu", desc: "Spacious outdoor running perimeter and athletic pitch facilities adjacent to Mamboleo Showground.", cost: "free" as const, topic: "local-activities-outdoors" },
    { title: "Kenyatta Sports Ground", url: "https://maps.google.com/?q=Kenyatta+Sports+Ground+Kisumu", desc: "Central open green space on Achieng Oneko Road for outdoor jogging, bodyweight calisthenics, and team sports.", cost: "free" as const, topic: "local-activities-outdoors" },
    { title: "Jomo Kenyatta Grounds (CBD)", url: "https://maps.google.com/?q=Jomo+Kenyatta+Grounds+Angawa+Avenue+Kisumu", desc: "24-hour open public grounds near the CBD on Angawa Avenue for morning/evening cardio runs and calisthenics.", cost: "free" as const, topic: "local-activities-outdoors" },
    { title: "Kisumu City Run", url: "https://maps.google.com/?q=Kisumu+City+Run+Kenya", desc: "Community road-running initiatives and local endurance fitness events centered around Jomo Kenyatta Sports Ground.", cost: "free" as const, topic: "local-activities-outdoors" },
  ];
  for (const v of kisumuVenues) {
    items.push({
      title: v.title,
      url: v.url,
      category: "attend-and-experience",
      subcategory: "local-activities",
      topic: v.topic,
      source_name: "Kisumu Local",
      description: truncateDesc(v.desc),
      cost: v.cost,
      region: "Kenya, Kisumu",
    });
  }

  // 25. Civic Tech, Governance & Accountability (lines 2071-2152)
  extract4LineBlock(
    2071,
    2152,
    "improve-and-contribute",
    "civic-or-environmental-participation",
    () => "civic-community-projects",
    () => "free",
    (title) => title,
    "Kenya"
  );

  // 26. Environmental & Conservation Initiatives (lines 2157-2218)
  extract4LineBlock(
    2157,
    2218,
    "improve-and-contribute",
    "civic-or-environmental-participation",
    (title, focus) => {
      const f = focus.toLowerCase();
      if (f.includes("cleanup") || f.includes("waste") || f.includes("plastic")) return "civic-clean-ups";
      return "civic-campaigns";
    },
    () => "free",
    (title) => title,
    "Kenya"
  );

  // 27. Global Open Data & Citizen Science (lines 2223-2284)
  extract4LineBlock(
    2223,
    2284,
    "improve-and-contribute",
    "volunteering-and-community-causes",
    () => "volunteering-remote",
    () => "free",
    (title) => title
  );

  return items;
}

function escapeCsvField(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCsv(items: ExtractedItem[]): string {
  const headers = [
    "title",
    "url",
    "category",
    "subcategory",
    "topic",
    "source_name",
    "description",
    "cost",
    "starts_at",
    "ends_at",
    "timezone",
    "region",
  ];

  const rows = [headers.join(",")];
  for (const item of items) {
    const row = [
      escapeCsvField(item.title),
      escapeCsvField(item.url),
      escapeCsvField(item.category),
      escapeCsvField(item.subcategory),
      escapeCsvField(item.topic),
      escapeCsvField(item.source_name),
      escapeCsvField(item.description),
      escapeCsvField(item.cost),
      escapeCsvField(item.starts_at || ""),
      escapeCsvField(item.ends_at || ""),
      escapeCsvField(item.timezone || ""),
      escapeCsvField(item.region || ""),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n") + "\n";
}

async function main() {
  console.log("Parsing answers.md...");
  const items = parseAnswers();
  console.log(`Extracted ${items.length} items from answers.md`);

  // Validate each item against Zod schema and taxonomy
  const validCatSlugs = new Set(taxonomyData.categories.map((c) => c.slug));
  const validSubSlugs = new Set();
  const validTopicSlugs = new Set();

  for (const c of taxonomyData.categories) {
    for (const s of c.subcategories) {
      validSubSlugs.add(`${c.slug}:${s.slug}`);
      for (const t of s.topics) {
        validTopicSlugs.add(`${s.slug}:${t.slug}`);
      }
    }
  }

  let validCount = 0;
  const validItems: ExtractedItem[] = [];
  const seenUrls = new Set<string>();

  for (const item of items) {
    if (seenUrls.has(item.url)) {
      continue;
    }
    seenUrls.add(item.url);

    if (!validCatSlugs.has(item.category)) {
      console.warn(`Invalid cat: ${item.category} on ${item.title}`);
      continue;
    }
    if (!validSubSlugs.has(`${item.category}:${item.subcategory}`)) {
      console.warn(`Invalid sub: ${item.subcategory} in ${item.category} on ${item.title}`);
      continue;
    }
    if (!validTopicSlugs.has(`${item.subcategory}:${item.topic}`)) {
      console.warn(`Invalid topic: ${item.topic} in ${item.subcategory} on ${item.title}`);
      continue;
    }

    const zodCheck = csvRowSchema.safeParse(item);
    if (!zodCheck.success) {
      console.warn(`Zod error on ${item.title}:`, zodCheck.error.issues);
      continue;
    }

    validItems.push(item);
    validCount++;
  }

  console.log(`Validated ${validCount} unique items matching taxonomy!`);

  const csvContent = generateCsv(validItems);
  const outPath = resolve(process.cwd(), "data/seed/seed-library.csv");
  writeFileSync(outPath, csvContent, "utf-8");
  console.log(`Saved library CSV to ${outPath}`);

  // Also update offline-survey.csv with this complete seed
  const offlinePath = resolve(process.cwd(), "data/seed/offline-survey.csv");
  writeFileSync(offlinePath, csvContent, "utf-8");
  console.log(`Updated ${offlinePath}`);
}

if (process.argv[1]?.endsWith("parse-answers.ts")) {
  main().catch(console.error);
}
