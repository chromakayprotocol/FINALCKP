/**
 * Standalone mount for UniversityNexus, used only by the Playwright
 * viewport/zoom suite. Not part of the application bundle: it has its own
 * Vite config (vite.harness.config.js) and its own entry, so nothing here
 * can reach a production build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import UniversityNexus from '../../src/modules/sovereign/reclamation-university/nexus/UniversityNexus';
import '../../src/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter>
      <UniversityNexus />
    </MemoryRouter>
  </StrictMode>
);
