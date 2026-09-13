import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TypeFly — Typing Practice That Feels Like Play" },
      {
        name: "description",
        content:
          "Why we built TypeFly: a cozy, playful way to build real typing skills without boring drills.",
      },
      { property: "og:title", content: "About TypeFly" },
      {
        property: "og:description",
        content: "A cozy typing game built to make practice something you look forward to.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">About TypeFly</h1>
        <div className="panel mt-6 space-y-4 p-8 leading-relaxed">
          <p>
            TypeFly started with a simple thought: typing practice does not have to feel like
            homework. So we built a small bird that flies when you type well and dips when you rush.
          </p>
          <p>
            Every flight measures the things that matter — words per minute, accuracy, mistakes and
            consistency — but it wraps them in combos, hearts and happy sounds so practice feels
            like play.
          </p>
          <p>
            Brand new to keyboards? Beginner Mode walks you through the home row with a colour-coded
            finger guide, so you learn good habits from your very first keystroke.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/play" className="btn-primary">
              Try a flight
            </Link>
            <Link to="/contact" className="btn-ghost">
              Say hello
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
