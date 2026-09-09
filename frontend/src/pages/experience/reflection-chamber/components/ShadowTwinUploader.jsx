import { useCallback, useRef, useState } from 'react';
import { validateShadowTwinSourceImage } from '../../../../lib/supabase/shadowTwin';

/**
 * The Shadow Twin's upload surface (design guide §5-6): a drag/drop region
 * with a glass/translucent surface and a thin blue border — extending the
 * Chamber's existing `.pooi` primitives rather than a generic
 * `<input type=file>`. Validates client-side (§6 — "Do not over-engineer
 * this into a forensic identity-validation system") and only ever hands
 * the parent a file that already passed validation; ShadowTwinInitialization
 * owns everything that happens after that (upload, generation, retry).
 */
export default function ShadowTwinUploader({ onValidFile, disabled }) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    async (file) => {
      setError(null);
      const result = await validateShadowTwinSourceImage(file);
      if (!result.valid) {
        setError(result.reason);
        setPreview(null);
        return;
      }
      setPreview(URL.createObjectURL(file));
      onValidFile(file);
    },
    [onValidFile],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  return (
    <div
      className={`shadow-twin-uploader${isDragOver ? ' is-drag-over' : ''}${error ? ' has-error' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      {preview ? (
        <img className="shadow-twin-uploader__preview" src={preview} alt="Selected reference photo" />
      ) : (
        <div className="shadow-twin-uploader__glyph" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="1.8" />
            <path d="M21 15l-5.5-5.5L4 21" />
          </svg>
        </div>
      )}

      <button
        type="button"
        className="shadow-twin-uploader__button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? 'Choose a different photograph' : 'UPLOAD YOUR IMAGE'}
      </button>
      <p className="shadow-twin-uploader__hint">Full-body photograph</p>

      {error && <p className="shadow-twin-uploader__error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="shadow-twin-uploader__input"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
