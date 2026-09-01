export default function PillarHeader({ pillarIndex, pillarTitle, stageLabel }) {
  return (
    <header className="pooi-header">
      <div className="pooi-header-left">
        <span className="pooi-header-brand">Chroma Key Protocol</span>
        <span className="pooi-header-act">Act II / H₂O</span>
      </div>
      <div className="pooi-header-right">
        <span className="pooi-header-portal">Portal {String(pillarIndex).padStart(2, '0')}</span>
        <span className="pooi-header-title">{pillarTitle}</span>
        {stageLabel && <span className="pooi-header-stage">{stageLabel}</span>}
      </div>
    </header>
  );
}
