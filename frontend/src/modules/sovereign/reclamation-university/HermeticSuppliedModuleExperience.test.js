import { describe, expect, it, test } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useContext } from "react";
import { SovereignProvider, SovereignContext } from "../../../sovereign/runtime";
import HermeticSuppliedModuleExperience, { MODULE_COPY } from "./HermeticSuppliedModuleExperience";

const expectedSections = [
  "INTRO", "PRINCIPLE", "KEY CONCEPTS", "WHY IT MATTERS", "DOMAINS",
  "RECLAMATION", "2026 LENS", "REFLECTION", "PROTOCOL", "ARTIFACT", "SUMMARY",
];

describe("supplied Hermetic module copy", () => {
  it.each([
    ["mentalism", "Who was shaping your mind", "Mental Model Map"],
    ["correspondence", "What can the patterns", "Correspondence Map"],
  ])("populates every tab for %s", (slug, introCopy, artifactCopy) => {
    expect(Object.keys(MODULE_COPY[slug].sections)).toEqual(expectedSections);
    expect(MODULE_COPY[slug].sections.INTRO).toContain(introCopy);
    expect(MODULE_COPY[slug].sections.ARTIFACT).toContain(artifactCopy);
    expectedSections.forEach((section) => expect(MODULE_COPY[slug].sections[section]).not.toBe("") );
  });
});

/* Real, in-project verification of the deliberately narrower slice this
   module got (docs/ARCHITECTURE.md, "Ninth slice"): no KEY_CONCEPTS
   array or PROTOCOL_STEPS checklist exists here at all, so unlike the
   other five modules there's no concept-graph or protocol-log wiring to
   test -- just that navigating tabs really does advance the runtime
   step engine, and the one real reflection prompt really does commit. */
function StateProbe({ onState }) {
  const { state } = useContext(SovereignContext);
  onState(state);
  return null;
}

function renderMentalism() {
  let latestState = null;
  render(
    <SovereignProvider>
      <HermeticSuppliedModuleExperience moduleSlug="mentalism" onComplete={() => {}} />
      <StateProbe onState={(s) => { latestState = s; }} />
    </SovereignProvider>
  );
  return { getState: () => latestState };
}

describe('HermeticSuppliedModuleExperience — real Sovereign Runtime wiring', () => {
  test('registers itself as the active module and marks the initial tab viewed on mount', () => {
    const { getState } = renderMentalism();
    const state = getState();

    expect(state.curriculum.activeModuleId).toBe('hermetic-hall/mentalism');
    // Default activeTab is "PRINCIPLE", not "INTRO" -- deliberately
    // unchanged existing behavior, verified rather than assumed.
    expect(state.curriculum.modules['hermetic-hall/mentalism'].viewedSteps).toContain('02-principle');
  });

  test('clicking a sidebar tab advances the real step engine', () => {
    const { getState } = renderMentalism();

    fireEvent.click(screen.getByRole('button', { name: /reflection/i }));

    const module = getState().curriculum.modules['hermetic-hall/mentalism'];
    expect(module.currentStep).toBe('08-reflection');
    expect(module.viewedSteps).toContain('08-reflection');
  });

  test('Reflection: writing real text and committing dispatches a real, committed entry', () => {
    // Mentalism's REFLECTION tab renders the interactive "reflection" exercise
    // (getMentalismInteraction) instead of the plain textarea + commit button
    // every other supplied-module reflection uses -- CopyScreen hides its own
    // textarea whenever an interaction is defined for the active tab.
    const { getState } = renderMentalism();
    fireEvent.click(screen.getByRole('button', { name: /reflection/i }));

    const textarea = screen.getByPlaceholderText(/name the pattern, the trigger/i);
    fireEvent.change(textarea, { target: { value: 'I keep mistaking a rehearsed thought for a fact.' } });
    fireEvent.click(screen.getByRole('button', { name: /^record reflection$/i }));

    const entry = getState().reflection.entries['hermetic-hall/mentalism:08-reflection'];
    expect(entry.status).toBe('committed');
    expect(entry.response).toBe('I keep mistaking a rehearsed thought for a fact.');
  });
});
