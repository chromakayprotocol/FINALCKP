export default function SituationPresentation({ situation, onContinue }) {
  return (
    <div className="pooi-situation">
      <div className="pooi-phone">
        <div className="pooi-phone-titlebar">{situation.app}</div>
        <div className="pooi-phone-body">
          <div className="pooi-phone-bubble pooi-phone-bubble--sent">
            <span className="pooi-phone-sender">{situation.from}</span>
            <p>{situation.message}</p>
          </div>
          <span className="pooi-phone-status">{situation.status}</span>
          <span className="pooi-phone-followup">{situation.followUp}</span>
        </div>
      </div>
      <h2 className="pooi-prompt">What do you actually know?</h2>
      <button type="button" className="pooi-btn pooi-btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
