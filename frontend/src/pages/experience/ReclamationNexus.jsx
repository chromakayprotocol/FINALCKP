import { useNavigate } from 'react-router-dom';
import './reclamationNexus.css';

export default function ReclamationNexus() {
  const navigate = useNavigate();

  return (
    <main className="nexus-scene" aria-label="Reclamation University Nexus">
      <img
        className="nexus-bg"
        src="/reclamation-university/hermetic-hall.png"
        alt=""
        aria-hidden="true"
      />
      <div className="nexus-overlay">
        <p className="nexus-eyebrow">Reclamation University</p>
        <h1>The Nexus</h1>
        <p className="nexus-dek">Every hall the University keeps opens from here.</p>
        <button
          type="button"
          className="nexus-enter"
          onClick={() => navigate('/experiencemode/sovereign/reclamation-university/hermetic-hall')}
        >
          Enter Hermetic Hall <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </main>
  );
}
