import { JoinNowForm } from "@/components/landing/join-now-form";

export function LandingJoinModal() {
  return (
    <div className="landing-join-modal" id="landingJoinModal" hidden>
      <button
        type="button"
        className="landing-join-modal__backdrop"
        data-close-join
        aria-label="Close join form"
      />
      <div
        className="landing-join-modal__panel panel panel-strong join-modal"
        id="landingJoinPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-join-title"
        aria-describedby="landing-join-description"
        tabIndex={-1}
      >
        <div className="landing-join-modal__header">
          <div className="landing-join-modal__copy">
            <div className="eyebrow">Join now</div>
            <h2 id="landing-join-title" className="landing-title">
              Start your membership request.
            </h2>
            <p id="landing-join-description">
              Share your name and phone number. The studio team will contact you
              to complete the next step.
            </p>
          </div>
          <button
            type="button"
            className="landing-join-modal__close"
            data-close-join
          >
            Close
          </button>
        </div>

        <div className="landing-join-modal__body">
          <JoinNowForm />
        </div>
      </div>
    </div>
  );
}
