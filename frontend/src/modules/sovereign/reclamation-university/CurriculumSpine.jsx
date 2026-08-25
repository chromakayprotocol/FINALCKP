import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CURRICULUM_SECTIONS, sectionState } from './curriculumSections';
import './curriculumSpine.css';

/* CurriculumSpine — the learner's persistent index through a module.
 *
 * This component owns navigation and nothing else. It never renders lesson
 * content, so a module can restructure its stage without touching its spine.
 *
 * Desktop: a vertical archival index that stays with the learner.
 * Mobile:  a compact "02 / 11 · PRINCIPLE" control that opens the same index.
 *          The horizontal tab strip it replaced is deliberately not kept as a
 *          fallback — at eleven sections it was unreadable on a phone.
 */

const STATE_WORD = {
  active: 'Current section',
  completed: 'Completed',
  locked: 'Locked',
  available: 'Available',
};

export default function CurriculumSpine({
  sections = CURRICULUM_SECTIONS,
  activeIndex = 0,
  maxIndex = 0,
  completedIds = [],
  onSelect,
  moduleTitle = '',
  stageId,
  enforceLocks = true,
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const baseId = useId();
  const listId = `${baseId}-spine`;

  const active = sections[activeIndex] || sections[0];

  const stateFor = useCallback(
    (index) => sectionState({ index, activeIndex, maxIndex, completedIds }),
    [activeIndex, maxIndex, completedIds]
  );

  const select = useCallback(
    (index) => {
      if (enforceLocks && stateFor(index) === 'locked') return;
      setOpen(false);
      if (onSelect) onSelect(index);
    },
    [enforceLocks, onSelect, stateFor]
  );

  /* Roving focus. Arrow keys move along the spine because it is vertical;
     Home/End jump to the ends of the curriculum. */
  const onKeyDown = (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = activeIndex;
    if (event.key === 'ArrowDown') next = Math.min(sections.length - 1, activeIndex + 1);
    if (event.key === 'ArrowUp') next = Math.max(0, activeIndex - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = sections.length - 1;
    if (next === activeIndex) return;
    if (enforceLocks && stateFor(next) === 'locked') return;
    select(next);
    const node = listRef.current?.querySelector(`[data-spine-index="${next}"]`);
    if (node) node.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={`rus${open ? ' is-open' : ''}`}>
      {/* Compact control — the mobile/tablet representation of the same index. */}
      <button
        type="button"
        className="rus-current"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rus-current-module">{moduleTitle}</span>
        <span className="rus-current-row">
          <span className="rus-current-count">
            {active?.n} / {String(sections.length).padStart(2, '0')}
          </span>
          <span className="rus-current-sep" aria-hidden="true">·</span>
          <span className="rus-current-label">{active?.label}</span>
          <span className="rus-current-chev" aria-hidden="true" />
        </span>
      </button>

      <nav
        id={listId}
        ref={listRef}
        className="rus-list"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Module curriculum"
        onKeyDown={onKeyDown}
      >
        <span className="rus-thread" aria-hidden="true" />
        {sections.map((section, index) => {
          const state = stateFor(index);
          const isActive = state === 'active';
          const locked = state === 'locked';
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              data-spine-index={index}
              data-state={state}
              id={`${baseId}-tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={stageId}
              aria-disabled={enforceLocks && locked ? true : undefined}
              tabIndex={isActive ? 0 : -1}
              className={`rus-item is-${state}`}
              onClick={() => select(index)}
            >
              <i className="rus-mark" aria-hidden="true" />
              <span className="rus-num">{section.n}</span>
              <span className="rus-label">{section.label}</span>
              {/* State is carried by a glyph and a word, never by colour alone. */}
              <span className="rus-state" aria-hidden="true">
                {state === 'completed' ? '✓' : state === 'locked' ? '✕' : ''}
              </span>
              <span className="rus-sr">{STATE_WORD[state]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
