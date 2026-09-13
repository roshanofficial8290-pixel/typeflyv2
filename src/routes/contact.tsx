import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact TypeFly — Feedback & Support" },
      {
        name: "description",
        content: "Questions, bugs or ideas for TypeFly? Send us a note and we'll get back to you.",
      },
      { property: "og:title", content: "Contact TypeFly" },
      {
        property: "og:description",
        content: "Get in touch with the TypeFly team about feedback, bugs or ideas.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Contact us</h1>
        <p className="mt-1 text-muted-foreground">
          Found a bug, or have a lesson idea? We read everything. You can also email
          hello@typefly.app.
        </p>

        <form
          className="panel mt-6 space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label className="block text-sm font-bold">
            Your name
            <input
              required
              className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm font-bold">
            Message
            <textarea
              required
              rows={5}
              className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <button type="submit" className="btn-primary">
            Send message
          </button>
          {sent && (
            <p className="text-sm font-bold text-success-foreground">
              Thanks! Your message is on its way. 🐦
            </p>
          )}
        </form>
      </div>
    </SiteLayout>
  );
}
