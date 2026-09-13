export type TypingPassage = {
  id: string;
  category: "facts" | "nature" | "technology" | "stories" | "everyday" | "quotes" | "pangrams";
  title: string;
  text: string;
};

export const FALLBACK_PASSAGES: TypingPassage[] = [
  // Interesting Facts
  {
    id: "fact-swifts",
    category: "nature",
    title: "The Ten-Month Flight",
    text: "Common swifts can stay airborne for ten consecutive months without landing once. They feed, preen, and even drift into micro-sleep high up on warm night air currents.",
  },
  {
    id: "fact-honey",
    category: "facts",
    title: "Eternal Honey",
    text: "Pure honey never spoils. Archaeologists excavating ancient tombs in Egypt have unearthed pots of honey over three thousand years old that remain completely edible.",
  },
  {
    id: "fact-octopuses",
    category: "nature",
    title: "Three Hearts in the Deep",
    text: "Octopuses have three hearts and blue blood. Two hearts pump blood to the gills, while a third circulates it to the rest of the body using copper-rich hemocyanin.",
  },
  {
    id: "fact-trees",
    category: "nature",
    title: "The Forest Network",
    text: "Trees in an old-growth forest communicate through underground mycorrhizal networks of fungi, sharing nutrients, water, and warning signals about approaching pests.",
  },
  {
    id: "fact-clouds",
    category: "facts",
    title: "Weight of a Cloud",
    text: "An average cumulus cloud floating quietly across a sunny sky weighs roughly five hundred thousand kilograms, which is equivalent to about one hundred elephants.",
  },

  // Technology & Work
  {
    id: "tech-keyboard",
    category: "technology",
    title: "The Home Row Habit",
    text: "Touch typing is like playing the piano. When your fingers instinctively know where each key lives, your mind can focus entirely on the ideas taking shape on the screen.",
  },
  {
    id: "tech-clean-code",
    category: "technology",
    title: "Clarity in Code",
    text: "Clean code reads like well-crafted prose. Great developers write programs that are effortless for other humans to read and reason about six months from now.",
  },
  {
    id: "tech-flow-state",
    category: "technology",
    title: "Finding Flow",
    text: "Deep work happens when distractions fade into silence. A rhythm of steady keystrokes can pull you straight into a focused flow state where hours slip past peacefully.",
  },
  {
    id: "tech-hummingbird",
    category: "technology",
    title: "Swift Iteration",
    text: "Small, consistent improvements compound over time. Practicing five minutes of deliberate typing every morning will quietly double your typing speed by next month.",
  },

  // Famous Quotes & Wisdom
  {
    id: "quote-hemingway",
    category: "quotes",
    title: "Hemingway on Motion",
    text: "Never confuse movement with action. The real art of living lies in purposeful strides and deliberate craftsmanship, keeping your eyes on the open horizon.",
  },
  {
    id: "quote-curie",
    category: "quotes",
    title: "Marie Curie on Courage",
    text: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
  },
  {
    id: "quote-woolf",
    category: "quotes",
    title: "Virginia Woolf on Words",
    text: "Words do not live in dictionaries; they live in the mind. They take flight with nuance and cadence whenever human imagination sets them free.",
  },

  // Pangrams & Keyboard Drills
  {
    id: "pangram-classic",
    category: "pangrams",
    title: "The Quick Brown Fox",
    text: "The quick brown fox jumps over the lazy dog while five boxing wizards jump quickly through misty valleys and dazzling autumn rain.",
  },
  {
    id: "pangram-sphynx",
    category: "pangrams",
    title: "The Sphynx of Quartz",
    text: "Sphinx of black quartz, judge my vow! Cozy sphinxes pack my box with five dozen liquor jugs under warm golden lantern light.",
  },

  // Cozy Stories & Everyday
  {
    id: "story-morning-sparrow",
    category: "stories",
    title: "The Morning Sparrow",
    text: "A cheerful golden sparrow dipped from the pine branch, racing past misty rooftops as the first rays of sunlight warmed the sleepy cobblestone streets below.",
  },
  {
    id: "story-tea-window",
    category: "everyday",
    title: "Rain on the Glass",
    text: "Raindrops drummed against the glass while steam rose from a freshly brewed mug of spiced tea. Sometimes the most productive choice is simply to slow down and listen.",
  },
  {
    id: "story-paper-airplane",
    category: "stories",
    title: "The Paper Glider",
    text: "Folded carefully from thick cream paper, the little glider caught a draft from the open library window and soared effortlessly over the courtyard gardens.",
  },
  {
    id: "story-night-sky",
    category: "nature",
    title: "Starlight Navigation",
    text: "Night-migrating songbirds use the pattern of stars and the Earth's magnetic field to navigate across oceans, guided by instincts millions of years in the making.",
  },
  {
    id: "story-artisan",
    category: "everyday",
    title: "The Woodworker's Table",
    text: "Smooth cedar shavings curled onto the workshop floor as the carpenter carved a curved armrest, inspecting every grain with quiet, experienced patience.",
  },
];

export function getRandomPassage(category?: string): TypingPassage {
  const pool =
    category && category !== "all"
      ? FALLBACK_PASSAGES.filter((p) => p.category === category)
      : FALLBACK_PASSAGES;
  const list = pool.length > 0 ? pool : FALLBACK_PASSAGES;
  return list[Math.floor(Math.random() * list.length)]!;
}
