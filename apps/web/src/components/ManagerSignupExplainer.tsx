/**
 * Left-panel story for the Manager-only signup flow (first user / workspace bootstrap).
 */
export function ManagerSignupExplainer() {
  return (
    <div className="signup-explainer">
      <div className="badge auth-shell-badge">Workspace Manager Registration</div>
      <h2 className="auth-shell-headline">
        Open SkyOps for your operations team
      </h2>
      <p className="auth-shell-lede">
        Create a <strong>Workspace Manager</strong> account for your organization. 
        You will have full control over the fleet, mission scheduling, and maintenance logs. 
        Once registered, you can invite your crew from Settings.
      </p>

      <div className="signup-callout" role="note">
        <div className="signup-callout-mark" aria-hidden>
          <svg
            className="signup-callout-icon"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="signup-callout-body">
          <p className="signup-callout-title">You are creating a Manager account</p>
          <p className="signup-callout-text">
            Managers register drones, run the mission board, log maintenance, and
            use <strong>Settings → Team</strong> to add Pilots and Technicians
            with a secure one-time password.
          </p>
        </div>
      </div>

      <ol className="signup-steps" aria-label="What happens next">
        <li className="signup-step">
          <span className="signup-step-num" aria-hidden>
            1
          </span>
          <div>
            <strong>Fill in your details</strong>
            <p className="signup-step-desc">
              Work email and a strong password — this will be your ongoing admin
              sign-in.
            </p>
          </div>
        </li>
        <li className="signup-step">
          <span className="signup-step-num" aria-hidden>
            2
          </span>
          <div>
            <strong>Start from the dashboard</strong>
            <p className="signup-step-desc">
              Your workspace is live. Add drones, missions, and maintenance on
              your timeline.
            </p>
          </div>
        </li>
        <li className="signup-step">
          <span className="signup-step-num" aria-hidden>
            3
          </span>
          <div>
            <strong>Invite your crew</strong>
            <p className="signup-step-desc">
              Pilots and Technicians never use this page — you create their
              accounts from Settings; they sign in and set a new password on
              first login.
            </p>
          </div>
        </li>
      </ol>

      <div className="signup-footnote">
        <p className="signup-footnote-title">Looking for Pilot or Technician access?</p>
        <p className="signup-footnote-text">
          Pilots and Technicians are <strong>invited from Settings</strong>. 
          Your Manager must create your account to provide you with secure access.
        </p>
      </div>
    </div>
  );
}
