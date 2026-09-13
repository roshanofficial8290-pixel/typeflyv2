import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TypeFly" },
      {
        name: "description",
        content: "How TypeFly collects, uses and protects your account and typing practice data.",
      },
      { property: "og:title", content: "Privacy Policy — TypeFly" },
      { property: "og:description", content: "What data TypeFly stores and how we keep it safe." },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>
        TypeFly is a typing practice game. We keep data collection to the minimum needed to run your
        account and show your progress.
      </p>
      <h2>What we collect</h2>
      <p>
        If you create an account we store your email address and display name. When you finish a
        test we may store your speed, accuracy and error counts so you can see your progress over
        time. Test results shown right after a flight are kept in your browser session.
      </p>
      <h2>How we use it</h2>
      <p>
        To sign you in, show your results, and improve lessons. We do not sell your data and we do
        not use your typing text for advertising.
      </p>
      <h2>Payments</h2>
      <p>
        Premium checkout is handled by Razorpay. TypeFly never sees or stores your card details. The
        current site runs Razorpay in test mode, so no real money is charged.
      </p>
      <h2>Your choices</h2>
      <p>
        You can delete your account at any time by contacting us, which removes your profile and
        stored results. For questions, email hello@typefly.app.
      </p>
    </LegalPage>
  ),
});
