export default function PillarHeader({ pillarIndex, pillarTitle, pillarCount, stageLabel }) {
  return (
    <header className="pooi-header">
      <div className="pooi-header-left">
        <span className="pooi-header-brand">Chroma Key Protocol</span>
        <span className="pooi-header-act">Act II / H₂O</span>
        {pillarCount ? (
          <span className="pooi-header-orientation">
            Act II · Reflection Chamber · Pillar {pillarIndex} of {pillarCount}
          </span>
        ) : null}
      </div>
      <div className="pooi-header-right">
        <span className="pooi-header-portal">Portal {String(pillarIndex).padStart(2, '0')}</span>
        <span className="pooi-header-title">{pillarTitle}</span>
        {stageLabel && <span className="pooi-header-stage">{stageLabel}</span>}
      </div>
    </header>
  );
}
