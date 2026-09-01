/**
 * Screen-transition container. Its whole job is mounting the current stage
 * and giving it a consistent entrance — the stage components themselves
 * hold no transition logic.
 */
export default function PillarStage({ stageKey, children }) {
  return (
    <div className="pooi-stage" key={stageKey}>
      {children}
    </div>
  );
}
