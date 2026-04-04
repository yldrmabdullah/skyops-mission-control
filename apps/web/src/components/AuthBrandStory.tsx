/**
 * Product overview for auth screens — fleet context before role details.
 */
export function AuthBrandStory() {
  return (
    <div className="auth-shell-brand-inner">
      <div className="badge auth-shell-badge">SkyOps Mission Control</div>
      <h2 className="auth-shell-headline">
        Fleet operations, without the spreadsheet chaos.
      </h2>
      <p className="auth-shell-lede">
        Mission scheduling, maintenance compliance, and fleet health in one
        secure console. Teams work together to maintain a shared operational
        picture and ensure flight safety and compliance across the organization.
      </p>
      <ul className="auth-shell-points">
        <li>
          Live visibility across the drone registry, mission board, and
          maintenance history
        </li>
        <li>
          Rules that mirror the field: availability, overlaps, and lifecycle
          transitions
        </li>
        <li>Immutable-style audit trails for operational and compliance reviews</li>
      </ul>
    </div>
  );
}
