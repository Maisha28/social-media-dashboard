import type { ConnectedAccount, Insight, PlatformId, Post } from "./types";

/**
 * Everything here is generated from a fixed seed. That matters: the old code
 * called Math.random() while rendering, so the server and client produced
 * different numbers and React threw hydration mismatch errors.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAPTIONS: Array<{ title: string; content: string; platform: PlatformId }> = [
  {
    title: "Behind the scenes of our studio rebuild",
    content: "Six weeks, 400 coffees and one very patient electrician. Swipe for the before shots.",
    platform: "instagram",
  },
  {
    title: "3 hooks that doubled our watch time",
    content: "We tested 40 openings this quarter. These three beat everything else, and none of them are questions.",
    platform: "instagram",
  },
  {
    title: "Community spotlight: Priya's first launch",
    content: "She shipped in 9 days using nothing but a phone and a spreadsheet. Full story in comments.",
    platform: "facebook",
  },
  {
    title: "We were wrong about posting times",
    content: "Our 9am slot underperformed for eight straight weeks. Here is what the data actually said.",
    platform: "facebook",
  },
  {
    title: "The 60-second edit workflow",
    content: "Cut, caption, colour, cross-post. No desktop app required.",
    platform: "youtube",
  },
  {
    title: "Answering your 12 most-asked questions",
    content: "Gear, pricing, burnout, and the one tool we would not give up.",
    platform: "youtube",
  },
  {
    title: "Why we deleted 200 old posts",
    content: "Pruning the archive lifted average engagement by a third. Counterintuitive, but consistent.",
    platform: "linkedin",
  },
  {
    title: "Our full content calendar, free",
    content: "The exact template we run every month. No email required, link below.",
    platform: "linkedin",
  },
  {
    title: "A thread on small-account growth",
    content: "Reach is not the goal. Repeat viewers are. Here is how we measure it.",
    platform: "twitter",
  },
  {
    title: "Shipping notes from week 14",
    content: "Three experiments, one clear winner, and a metric we are retiring.",
    platform: "twitter",
  },
];

const REACH_BASELINE: Record<PlatformId, number> = {
  instagram: 14_000,
  facebook: 9_500,
  youtube: 22_000,
  twitter: 6_800,
  linkedin: 5_200,
  general: 8_000,
};

/**
 * @param seed change to regenerate a different but equally stable dataset
 * @param count how many posts to synthesise
 */
export function generateDemoPosts(count = 48, seed = 20260807): Post[] {
  const random = mulberry32(seed);
  const posts: Post[] = [];
  // Anchor to UTC midnight so the series buckets line up regardless of timezone.
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const template = CAPTIONS[i % CAPTIONS.length];
    const daysAgo = Math.floor((i / count) * 29);
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - daysAgo);

    // A few posts should meaningfully outperform, the way real feeds behave.
    const viral = random() > 0.86 ? 2.6 + random() * 2.2 : 1;
    const platform = template.platform;
    const reach = Math.round(REACH_BASELINE[platform] * (0.55 + random() * 0.95) * viral);

    const likeRate = 0.028 + random() * 0.045;
    const likes = Math.round(reach * likeRate);
    const comments = Math.round(likes * (0.05 + random() * 0.14));
    const shares = Math.round(likes * (0.03 + random() * 0.1));

    posts.push({
      id: `demo-${i + 1}`,
      title: template.title,
      content: template.content,
      platform,
      likes,
      comments,
      shares,
      reach,
      impressions: Math.round(reach * (1.15 + random() * 0.5)),
      created_at: date.toISOString(),
    });
  }

  return posts.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function generateDemoAccounts(): ConnectedAccount[] {
  return [
    {
      id: "demo-ig",
      platform: "instagram",
      username: "yourbrand",
      displayName: "Your Brand",
      followers: 48_200,
      connectedAt: "2026-06-01T09:00:00.000Z",
    },
    {
      id: "demo-fb",
      platform: "facebook",
      username: "yourbrandpage",
      displayName: "Your Brand Page",
      followers: 31_450,
      connectedAt: "2026-06-01T09:02:00.000Z",
    },
  ];
}

export function generateDemoInsights(): Insight[] {
  return [
    {
      id: "d1",
      text: "Carousels outperform single images by 41% on reach, but only when the first slide contains a face. Your last four face-first carousels all cleared 20K.",
      category: "Format",
      confidence: 0.91,
      created_at: "2026-08-06T10:00:00.000Z",
    },
    {
      id: "d2",
      text: "Comments per post fell 18% over the last two weeks while likes held steady — a classic sign that captions have stopped asking anything of the reader.",
      category: "Engagement",
      confidence: 0.84,
      created_at: "2026-08-05T10:00:00.000Z",
    },
    {
      id: "d3",
      text: "Tuesday 18:00-20:00 is your strongest window across both connected accounts, beating your current 09:00 default slot by 2.3x on weighted engagement.",
      category: "Timing",
      confidence: 0.88,
      created_at: "2026-08-04T10:00:00.000Z",
    },
    {
      id: "d4",
      text: "LinkedIn is your highest-efficiency channel: it drives 12% of posts but 24% of total shares. It is currently under-scheduled.",
      category: "Channel mix",
      confidence: 0.79,
      created_at: "2026-08-03T10:00:00.000Z",
    },
  ];
}
