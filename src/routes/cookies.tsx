import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — TypeFly" },
      {
        name: "description",
        content:
          "The cookies and local storage TypeFly uses to keep you signed in and remember settings.",
      },
      { property: "og:title", content: "Cookie Policy — TypeFly" },
      {
        property: "og:description",
        content: "Which cookies and browser storage TypeFly uses, and why.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Cookie Policy">
      <p>
        TypeFly uses a small number of cookies and browser storage entries. We do not use
        advertising cookies.
      </p>
      <h2>Essential</h2>
      <p>
        Sign-in cookies keep your session active while you play. Without them you would be signed
        out on every page.
      </p>
      <h2>Preferences</h2>
      <p>
        Your sound on/off choice and your most recent test result are stored in your browser so the
        game remembers how you like to play.
      </p>
      <h2>Payments</h2>
      <p>Razorpay may set its own cookies during checkout to run the payment flow securely.</p>
      <h2>Managing cookies</h2>
      <p>
        You can clear or block cookies in your browser settings. Blocking essential cookies means
        you will not be able to stay signed in.
      </p>
    </LegalPage>
  ),
});
