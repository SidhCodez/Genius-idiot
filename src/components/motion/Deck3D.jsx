/**
 * Stacks two quiet planes behind a surface so the queue reads as a deck of
 * days. Pairs with Tilt3D, which supplies the shared perspective.
 */
export default function Deck3D({ children, className = '' }) {
  return (
    <div className={`deck3d ${className}`}>
      <span className="deck3d__plane deck3d__plane--back" aria-hidden="true" />
      <span className="deck3d__plane deck3d__plane--mid" aria-hidden="true" />
      <div className="deck3d__surface">{children}</div>
    </div>
  );
}
