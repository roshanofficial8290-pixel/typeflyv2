import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import birdImg from "@/assets/bird.png";
import skyImg from "@/assets/sky.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TypeFly — Playful Typing Practice Game" },
      {
        name: "description",
        content:
          "TypeFly is a cozy typing game. Keep your bird flying by typing words, or start from zero in Beginner Mode with a finger guide.",
      },
      { property: "og:title", content: "TypeFly — Playful Typing Practice Game" },
      {
        property: "og:description",
        content:
          "Type words to make your bird fly. 1, 2 and 5 minute tests, hearts, combos, live WPM and accuracy.",
      },
    ],
  }),
  component: Lobby,
});

const cards = [
  {
    to: "/play",
    emoji: "🐦",
    title: "Typing Bird",
    text: "Type words to keep your bird soaring. 3 hearts, combo streaks and live stats.",
  },
  {
    to: "/beginner",
    emoji: "🌱",
    title: "Beginner Mode",
    text: "Simple guided text with a keyboard that shows which finger presses each key.",
  },
  {
    to: "/pricing",
    emoji: "✨",
    title: "TypeFly Premium",
    text: "Extra lessons, custom flights and detailed progress history.",
  },
] as const;

function Lobby() {
  return (
    <SiteLayout>
      <section
        className="relative overflow-hidden border-b-2 border-border"
        style={{
          backgroundImage: `url(${skyImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-16 sm:grid-cols-2">
          <div>
            <span className="rounded-full bg-card px-3 py-1 text-sm font-bold">
              Learn typing the fun way
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              Type words. <br /> Make the bird fly.
            </h1>
            <p className="mt-4 max-w-md text-lg text-secondary-foreground">
              TypeFly turns typing practice into a cozy little game — combos, hearts, and a bird
              that soars with every word you nail.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/play" className="btn-primary text-lg">
                Play Typing Bird
              </Link>
              <Link to="/beginner" className="btn-ghost text-lg">
                I'm a beginner
              </Link>
            </div>
          </div>
          <img
            src={birdImg}
            alt="TypeFly's cheerful bird mascot flying through a sunny sky"
            width={768}
            height={768}
            className="mx-auto h-56 w-56 animate-float sm:h-80 sm:w-80"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Game lobby</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="panel p-6 transition-transform hover:-translate-y-1"
            >
              <span className="text-4xl">{c.emoji}</span>
              <h3 className="mt-3 font-display text-xl font-extrabold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </Link>
          ))}
        </div>

        <div className="panel mt-8 grid gap-4 p-6 sm:grid-cols-4">
          {[
            ["1 / 2 / 5 min", "Flight lengths"],
            ["3 hearts", "Keep flying"],
            ["Live WPM", "Speed & accuracy"],
            ["Combo streaks", "Satisfying feedback"],
          ].map(([big, small]) => (
            <div key={big} className="text-center">
              <p className="font-display text-xl font-extrabold">{big}</p>
              <p className="text-sm text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
