import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TypeFly" },
      {
        name: "description",
        content: "The rules for using TypeFly, including accounts, premium plans and fair use.",
      },
      { property: "og:title", content: "Terms of Service — TypeFly" },
      {
        property: "og:description",
        content: "Accounts, premium plans, fair use and liability for TypeFly.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Terms of Service">
      <p>
        By using TypeFly you agree to these terms. If you do not agree, please do not use the site.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping your login details safe and for activity on your account.
        Please give accurate information when signing up.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Use TypeFly for personal typing practice. Do not attempt to break, scrape, overload or
        reverse engineer the service, and do not submit abusive content through our forms.
      </p>
      <h2>Premium plans</h2>
      <p>
        Premium features are billed through Razorpay. This site currently runs Razorpay in test
        mode, so no real payment is taken and no live subscription is created.
      </p>
      <h2>Availability</h2>
      <p>
        TypeFly is provided as is. We may change or pause features, and we are not liable for
        indirect losses arising from use of the game.
      </p>
      <h2>Contact</h2>
      <p>Questions about these terms: hello@typefly.app.</p>
    </LegalPage>
  ),
});
