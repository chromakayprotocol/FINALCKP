/**
 * Reclamation University Curriculum Registry
 * 
 * This is the single source of truth for all Reclamation University content.
 * Each faculty contains metadata and modules. Each module contains all necessary
 * content for the interactive engine to render scenes, manage progression, and save state.
 * 
 * Faculty order follows the natural progression from foundational concepts to advanced practice.
 */

const LEARNING_OBJECTIVES = {
  'module-fractured-veil': [
    'Distinguish the witnessing self from the narrating self, and identify one pattern currently run by the narrator.',
    'Trace one inherited identity label, perceptual filter, or unexamined belief to its actual source.',
    'Map the architecture holding one recurring pattern in place and name the single hinge you can move first.',
  ],
  'module-thought-form-studio': [
    'Identify a recurring pattern and distinguish its visible outcome from the hidden law beneath it.',
    'Trace one inherited or absorbed thought form to its source using concrete evidence.',
    'Author a replacement law and describe one behavior that demonstrates the new thought form.',
  ],
  'module-voice-recovery': [
    'Identify a suppressed truth and explain the anticipated consequence that kept it unspoken.',
    'Differentiate reactive speech from a clear, evidence-based declaration.',
    'Author a concise declaration that names the truth and the change its signal is intended to create.',
  ],
  'module-manifestation-lab': [
    'Identify where thought, feeling, action, and identity are misaligned around one desired outcome.',
    'Trace a limiting assumption to the behavior or decision it currently produces.',
    'Design one observable action that aligns present behavior with the authored future identity.',
  ],
  'module-sovereign-training': [
    'Identify a conditioned response and trace it to a specific source or repeated experience.',
    'Apply the witness position to separate an observed trigger from an automatic reaction.',
    'Author and rehearse a sovereign alternative that can be used when the trigger recurs.',
  ],
  'module-teaching-transmission': [
    'Identify a repeatable system pattern within a personal reclamation experience.',
    'Translate lived experience into a teachable protocol with clear recognition and response steps.',
    'Author a practical map that another learner can apply without needing the author present.',
  ],
};

const ADVANCED_MODULES = {
  foundations: [
    ['pressure-audit', 'Module 2: Pressure Audit', 'Applied Practice', 'Convert a lived pressure event into a documented Shadow-to-Light map.'],
    ['authorship-covenant', 'Module 3: Authorship Covenant', 'Mastery Practice', 'Create a durable authorship covenant and a repeatable boundary practice.'],
  ],
  identity: [
    ['pattern-excavation', 'Module 2: Pattern Excavation', 'Applied Practice', 'Test a hidden law against evidence from repeated decisions and outcomes.'],
    ['identity-blueprint', 'Module 3: Identity Blueprint', 'Mastery Practice', 'Build an identity blueprint that replaces inherited architecture with chosen law.'],
  ],
  language: [
    ['clean-speech-lab', 'Module 2: Clean Speech Lab', 'Applied Practice', 'Practice converting reactive language into precise, accountable declaration.'],
    ['public-record', 'Module 3: Public Record', 'Mastery Practice', 'Author a truth record that preserves context, evidence, and intended impact.'],
  ],
  'thought-forms': [
    ['alignment-prototype', 'Module 2: Alignment Prototype', 'Applied Practice', 'Prototype one aligned behavior across thought, feeling, action, and identity.'],
    ['reality-architecture', 'Module 3: Reality Architecture', 'Mastery Practice', 'Build and evaluate a thirty-day authored-reality practice.'],
  ],
  'sovereign-mind': [
    ['witness-practice', 'Module 2: Witness Practice', 'Applied Practice', 'Use the witness position to interrupt a conditioned response in real time.'],
    ['choice-protocol', 'Module 3: Choice Protocol', 'Mastery Practice', 'Author a reusable decision protocol for recurring triggers.'],
  ],
  aftermath: [
    ['pattern-literacy', 'Module 2: Pattern Literacy', 'Applied Practice', 'Teach another learner to recognize a systemic pattern without relying on personal context.'],
    ['torch-transfer', 'Module 3: Torch Transfer', 'Mastery Practice', 'Publish a clear teaching map with safeguards, actions, and measures of transfer.'],
  ],
};

const buildAdvancedModules = (faculty) => {
  const base = faculty.modules[0];
  if (!base) return [];

  return (ADVANCED_MODULES[faculty.slug] || []).map(([slug, title, stage, outcome], index) => {
    const codeOffset = (index + 1) * 10;
    const renumber = (id) => `${id.slice(0, 3)}${String(Number(id.slice(3)) + codeOffset).padStart(2, '0')}`;
    return {
      ...base,
      id: `module-${slug}`,
      slug,
      order: index + 2,
      title,
      subtitle: outcome,
      initiationCopy: [
        `${stage}: ${title}.`,
        `This module extends ${base.title} from recognition into ${index === 0 ? 'applied practice' : 'independent mastery'}.`,
        outcome,
        'Use the signal keys as evidence, select the pattern that is active now, retrieve its replacement law, and document an observable next action.',
      ],
      learningObjectives: [
        `Identify one current situation in which the faculty concept is operating.`,
        `Apply the faculty method to produce a specific Shadow-to-Light analysis.`,
        `${index === 0 ? 'Demonstrate' : 'Evaluate'} the result through one observable action and a written reflection.`,
      ],
      shadowCodes: base.shadowCodes.map((code) => ({ ...code, id: renumber(code.id) })),
      lightMappings: base.lightMappings.map((mapping) => ({
        ...mapping,
        shadowId: renumber(mapping.shadowId),
        lightId: renumber(mapping.lightId),
      })),
      declarationFields: [
        { key: 'currentContext', label: 'What current situation will you work with?', placeholder: 'Name one specific setting, event, or decision...' },
        { key: 'evidence', label: 'What evidence reveals the active pattern?', placeholder: 'Describe what was said, chosen, repeated, or observed...' },
        { key: 'application', label: 'How will you apply the retrieved law?', placeholder: 'State the action you will take...' },
        { key: 'measure', label: 'What observable result will show integration?', placeholder: 'I will know this is integrated when...' },
      ],
      integrationKey: outcome,
      xpReward: base.xpReward + ((index + 1) * 150),
      estimatedMinutes: base.estimatedMinutes + ((index + 1) * 10),
    };
  });
};

const buildRubricCriteria = (field) => [
  `Specificity: directly answers “${field.label}” with a concrete example or commitment.`,
  'Evidence: connects the response to an observed pattern, event, decision, or behavior.',
  'Application: states what the learner will recognize, choose, or do differently next.',
];

const enrichCurriculum = (curriculum) => ({
  ...curriculum,
  faculties: curriculum.faculties.map((faculty) => ({
    ...faculty,
    artworkAlt: `${faculty.title} faculty module artwork`,
    modules: [...faculty.modules, ...buildAdvancedModules(faculty)].map((module) => ({
      ...module,
      learningObjectives: module.learningObjectives || LEARNING_OBJECTIVES[module.id] || [],
      shadowCodes: module.shadowCodes.map((code) => ({
        ...code,
        id: `${faculty.slug}-${code.id}`,
        displayId: code.id,
        collectiveDiagnostic: `Collective or ancestral frame: ${code.diagnostic
          .replace(/\bI\b/g, 'we')
          .replace(/\bmy\b/gi, 'our')
          .replace(/\bme\b/gi, 'us')}`,
      })),
      lightMappings: module.lightMappings.map((mapping) => ({
        ...mapping,
        shadowId: `${faculty.slug}-${mapping.shadowId}`,
      })),
      declarationFields: module.declarationFields.map((field) => ({
        ...field,
        feedbackCopy: `A strong response names a specific example, explains why it matters, and states the authored choice that follows.`,
        rubricCriteria: buildRubricCriteria(field),
      })),
    })),
  })),
});

const BASE_RECLAMATION_CURRICULUM = {
  faculties: [
    {
      id: 'foundations-of-reclamation',
      slug: 'foundations',
      order: 1,
      title: 'Foundations of Reclamation',
      subtitle: 'Understand the war for consciousness and the nature of power.',
      description: 'Learn the core principles of Reclamation: how to identify Shadow Codes, recover Light Codes, and understand fire as ordered pressure rather than chaos.',
      accent: 'green',
      artwork: null,
      modules: [
        {
          id: 'module-fractured-veil',
          slug: 'fractured-veil',
          order: 1,
          title: 'Module 1: The Fractured Veil',
          subtitle: 'Understand yourself before the veil can be seen — the floor every other faculty is built on.',
          sourceTrackIds: ['the-fractured-veil', 'chroma-key', 'axiomatic'],
          initiationCopy: [
            'Welcome to the Foundations of Reclamation, Rising Seeker.',
            'Before the veil can be seen as a veil, the self looking at it has to be understood. This is the grounding faculty — no reclamation, no depths, no code-breaking until the foundation under your feet is actually mapped.',
            'Every code in this module answers one question: what, exactly, is the "I" about to do this work?',
            'The dominant movement here is diagnostic. Name the extraction, the script, the Watcher, the serpentine contract, or the counterfeit light. Only after the naming does the Light Code stabilize.',
            'Do not rush to the generative work. Complete the accounting first. The soil phase is not optional — the flower that tries to bloom before the roots are formed collapses under its own weight.',
            'When you complete this module, you will have named Shadow Codes across five pillars — Consciousness, Identity, Perception, Belief, and Architecture — retrieved their Light counterparts, and sealed a declaration that becomes the floor the rest of Reclamation University is built on.',
          ],
          lyricAnchors: [
            { key: 'planted-whole', label: 'The Fractured Veil', teaching: 'Dark grows roots in the shape of soul — the Seeker does not hunt light, they become it.', line: 'Stay in the soil phase.' },
            { key: 'scripted-burial', label: 'Overture to Act One', teaching: 'The system rehearses the Seeker’s erasure — name buried, shame rehearsed.', line: 'Stand in the rubble. Read the cracks.' },
            { key: 'the-watcher', label: 'Fractures', teaching: 'An intelligence has catalogued the Seeker since childhood, mapping every fissure.', line: 'Locate the silent archivist.' },
            { key: 'counterfeit-light', label: 'Throw It Away', teaching: 'Not every glow is a key. Test every transmission before you keep it.', line: 'If it does not plant peace, throw it away.' },
            { key: 'the-hinge', label: 'The Prometheus Protocol', teaching: 'Carrying fire before the weight is earned collapses the architecture.', line: 'Carry the weight before you claim the crown.' },
          ],
          shadowCodes: [
            {
              id: 'SC-01',
              title: 'Parasitic Presence',
              definition: 'The grin that appears when the soul is unmasked by substance or crisis — it does not knock, it does not ask, it shows the moment awareness leaves the room.',
              diagnostic: 'When do you leave the room of your own awareness — substance, scroll, rage, collapse, performance? What sits down in your place?',
            },
            {
              id: 'SC-02',
              title: 'The Scripted Burial',
              definition: 'The system rehearses the Seeker’s erasure — name buried, shame rehearsed, contracts written with invisible pens, false friends breathing like a policy.',
              diagnostic: 'Which names, diagnoses, or roles were installed in you without your consent — and who handed them over?',
            },
            {
              id: 'SC-03',
              title: 'The Watcher',
              definition: 'An intelligence that has catalogued the Seeker since childhood, mapping every fissure and waiting for the spirit to bleed — freedom as pre-assigned theater.',
              diagnostic: 'Whose footage are you calling reality — a parent’s, an institution’s, a feed’s, a former love’s? What would you see if you took the camera back?',
            },
            {
              id: 'SC-04',
              title: 'The Serpentine Contract',
              definition: 'Contracts signed in comfort and pride — crowning your demons, dressing them in pride, then calling the one who names the contract sick.',
              diagnostic: 'What were you rewarded for not saying? What is the contract: I will not speak X, and in return I receive Y?',
            },
            {
              id: 'SC-05',
              title: 'Orchestrated Extraction',
              definition: 'Coordinated betrayal, false flags, lethal scripting, institutional silencing — the attempt to rewrite a life into non-existence.',
              diagnostic: 'Without politeness, name a system, person, or pattern that has been farming your attention, labor, or soul. What does it take, and what happens if you stop paying?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-01', shadowTitle: 'Parasitic Presence', lightId: 'LC-01', lightTitle: 'Planted Whole', activation: 'The fall is planting. Dark grows roots in the shape of soul — the Seeker does not hunt light, they become it.', replacementLaw: 'I stay in the soil phase. Presence is the floor; I will not outsource this sitting.' },
            { shadowId: 'SC-02', shadowTitle: 'The Scripted Burial', lightId: 'LC-02', lightTitle: 'Architect’s Hand', activation: 'The creator is the full process — write, build, cut, mix, master, direct. Intention shapes the form.', replacementLaw: 'I can separate "I am" from "I was told I am." I will not defend a burial as a self.' },
            { shadowId: 'SC-03', shadowTitle: 'The Watcher', lightId: 'LC-03', lightTitle: 'Schematic Transmission', activation: 'These are not just songs, they are schematics — each track a key, each bar a breath, a ritual roadmap through rebirth and death.', replacementLaw: 'I will not confuse the map with the ground. Perception is an instrument I can retune.' },
            { shadowId: 'SC-04', shadowTitle: 'The Serpentine Contract', lightId: 'LC-04', lightTitle: 'Sovereign Ledger', activation: 'The soul’s frequency is unbreakable calculus — a sovereign ledger no audit can amend, truth rooted where bones refuse to bend.', replacementLaw: 'I will not run unexamined software. Beliefs that cannot survive a question are not mine to keep.' },
            { shadowId: 'SC-05', shadowTitle: 'Orchestrated Extraction', lightId: 'LC-05', lightTitle: 'Non-Transferable Essence', activation: 'Style can be copied. The blood-coded soul cannot be transmitted — the architecture you rebuild will not be a replica of anyone else’s cathedral.', replacementLaw: 'The structure is mapped. I will not skip the soil. I carry the weight before I claim the crown.' },
          ],
          declarationFields: [
            { key: 'witnessFloor', label: 'What am I, before any story about what I am?', placeholder: 'Write what remains when you stop identifying with the commentary...' },
            { key: 'handedIdentity', label: 'Who do I believe I am, and who handed me that belief?', placeholder: 'Name the label and who installed it...' },
            { key: 'trainedPerception', label: 'Am I seeing what is real, or what I was trained to see?', placeholder: 'Name the footage you have been calling reality...' },
            { key: 'unexaminedBelief', label: 'What do I treat as true without ever checking?', placeholder: 'Name the belief and the cost of testing it...' },
            { key: 'actualArchitecture', label: 'What is the actual structure holding all of this up?', placeholder: 'Name the loop: trigger, belief, perception, identity move, cost...' },
          ],
          integrationKey: 'Presence is the floor. The self is not a burial to defend. The eyes are an instrument, not a camera that cannot lie. The beliefs you run are a choice, not a verdict. Once the architecture is mapped, you are no longer trapped inside a weather system you cannot name — you are its author. Carry the weight. You have earned the crown.',
          xpReward: 650,
          estimatedMinutes: 70,
        },
      ],
    },
    {
      id: 'architecture-of-identity',
      slug: 'identity',
      order: 2,
      title: 'The Architecture of Identity',
      subtitle: 'Deconstruct the false self and reclaim your divine architecture.',
      description: 'Explore how hidden laws become walls. Learn to identify the thought forms that build your reality and rewrite the instruction beneath the pattern.',
      accent: 'blue',
      artwork: '/ui/reclamation/Module_Cards/reclamation_university/module_two_card.svg',
      modules: [
        {
          id: 'module-thought-form-studio',
          slug: 'thought-form-studio',
          order: 1,
          title: 'Module 2: Thought Form Studio',
          subtitle: 'The mind is a medium. Learn to author the structure beneath the pattern.',
          sourceTrackIds: ['thought-form', 'emerald-mode-online', 'i-create-as-i-speak'],
          initiationCopy: [
            'Welcome to the Thought Form Studio, Rising Seeker.',
            'Begin the deeper work of understanding how the mind itself becomes architecture.',
            'A thought form is not positive thinking. It is not affirmation. It is the precise structure beneath a repeated pattern. It is the hidden law that keeps building the same wall.',
            'In this module, you will learn to trace a recurring outer wall back to its inner instruction. You will identify what thought you inherited and what thought you chose. You will dissolve what is not yours and install what you author.',
            'The work is precision. The work is not speed. The work is not force. The work is clarity.',
            'When you complete this module, you will have named one thought form, traced its source, and written a new law to replace it. That new law becomes a Code Card in your archive.',
          ],
          lyricAnchors: [
            { key: 'mind-medium', label: 'The Mind as Medium', teaching: 'Consciousness is not a passenger. It is the architect.', line: 'The mind is a medium.' },
            { key: 'frequency-leak', label: 'Frequency Leak', teaching: 'Inherited programs continue to broadcast until consciously dissolved.', line: 'What frequency am I still broadcasting?' },
            { key: 'authorship-returns', label: 'Authorship Returns', teaching: 'When you name the hidden law, the old script loses jurisdiction.', line: 'When authorship returns, the old script loses jurisdiction.' },
            { key: 'i-create', label: 'I Create As I Speak', teaching: 'Speech is creative law. Thought precedes form.', line: 'I create as I speak.' },
          ],
          shadowCodes: [
            {
              id: 'SC-05',
              title: 'Frequency Leak',
              definition: 'Inherited thoughts, foreign programs, and fear loops transmit through speech and decision.',
              diagnostic: 'What thought am I still broadcasting that is not mine?',
            },
            {
              id: 'SC-06',
              title: 'Self-Sabotage Architecture',
              definition: 'The hidden law that keeps building the same wall, even when circumstances change.',
              diagnostic: 'What pattern keeps repeating? What law might be building it?',
            },
            {
              id: 'SC-07',
              title: 'Muted Voltage',
              definition: 'The dimming of creative power through doubt, inherited shame, or false humility.',
              diagnostic: 'Where am I playing small? What full voltage am I withholding?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-05', shadowTitle: 'Frequency Leak', lightId: 'LC-05', lightTitle: 'Thought Form Architecture', activation: 'The student learns to identify the blueprint before the building repeats.', replacementLaw: 'I now author the structure beneath this pattern.' },
            { shadowId: 'SC-06', shadowTitle: 'Self-Sabotage Architecture', lightId: 'LC-06', lightTitle: 'Mind as Medium', activation: 'Consciousness is not a victim of its own architecture. It is the architect.', replacementLaw: 'I dissolve what is not mine and install what I author.' },
            { shadowId: 'SC-07', shadowTitle: 'Muted Voltage', lightId: 'LC-07', lightTitle: 'Full Voltage', activation: 'The student reclaims creative power by naming it, claiming it, and speaking it into form.', replacementLaw: 'I now broadcast at full voltage.' },
          ],
          declarationFields: [
            { key: 'patternName', label: 'Name one repeated pattern in your life.', placeholder: 'What keeps happening?' },
            { key: 'hiddenLaw', label: 'What hidden law might be building this pattern?', placeholder: 'What instruction is beneath the wall?' },
            { key: 'sourceTrace', label: 'Where did this law originate? Who taught it?', placeholder: 'Inherited, chosen, or absorbed?' },
            { key: 'newLaw', label: 'Write the new law you now author.', placeholder: 'I now...' },
          ],
          integrationKey: 'The mind is not your master. The mind is your medium. When you author the structure, the pattern dissolves.',
          xpReward: 600,
          estimatedMinutes: 50,
        },
      ],
    },
    {
      id: 'language-protocol',
      slug: 'language',
      order: 3,
      title: 'The Language Protocol',
      subtitle: 'Words are weapons. Master the code you create with your voice.',
      description: 'Discover how speech is creative law. Learn to move from silence to clean declaration and understand the power of naming.',
      accent: 'red',
      artwork: '/ui/reclamation/Module_Cards/reclamation_university/module_three_card.svg',
      modules: [
        {
          id: 'module-voice-recovery',
          slug: 'voice-recovery',
          order: 1,
          title: 'Module 3: Voice Recovery',
          subtitle: 'The voice cannot be confiscated. Learn to speak the truth that reshapes fate.',
          sourceTrackIds: ['reclamation', 'weapons-grade-transmission', 'fire-in-my-veins'],
          initiationCopy: [
            'Welcome to Voice Recovery, Rising Seeker.',
            'In this module, you will learn that voice is not permission. Voice is not approval. Voice is not agreement.',
            'Voice is evidence. Voice is signal. Voice is the frequency that moves through time and space and reshapes what listens.',
            'They can chain your body. They can delay your process. They can obscure your record. But they cannot chain your truth. Your truth moves through voice, and voice is mobile.',
            'The work of this module is to move from silence to clean declaration. Not anger. Not accusation. Not performance. Clean declaration.',
            'When you complete this module, you will have named a truth you thought was confiscated and spoken it into the record. That declaration becomes part of your archive.',
          ],
          lyricAnchors: [
            { key: 'voice-weapon', label: 'Voice as Weapon', teaching: 'Truth is a weapon. Speech is creative law.', line: 'The voice is a weapon of truth.' },
            { key: 'truth-reshapes', label: 'Truth Reshapes Fate', teaching: 'What is named can be studied. What is spoken can be reclaimed.', line: 'Truth reshapes fate.' },
            { key: 'cannot-chain', label: 'Cannot Chain Truth', teaching: 'Circumstances can limit movement. Truth remains mobile.', line: 'They can chain your body, but they will never chain your truth.' },
            { key: 'signal', label: 'Signal and Transmission', teaching: 'The voice is the signal. The signal is the transmission.', line: 'I am the signal. I am the transmission.' },
          ],
          shadowCodes: [
            {
              id: 'SC-01',
              title: 'Witness Suppression',
              definition: 'Truth is known but not spoken. Silence becomes an accomplice.',
              diagnostic: 'What truth am I still not speaking?',
            },
            {
              id: 'SC-02',
              title: 'Silenced Voice',
              definition: 'The belief that speaking the truth will result in punishment, abandonment, or erasure.',
              diagnostic: 'What am I afraid will happen if I speak?',
            },
            {
              id: 'SC-03',
              title: 'Confiscated Signal',
              definition: 'The experience of being heard but not believed, or speaking but not being recorded.',
              diagnostic: 'When have I spoken and been erased?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-01', shadowTitle: 'Witness Suppression', lightId: 'LC-01', lightTitle: 'Public Record', activation: 'Silence does not erase the record. It delays the reveal until the evidence has matured.', replacementLaw: 'I now speak the truth into the record.' },
            { shadowId: 'SC-02', shadowTitle: 'Silenced Voice', lightId: 'LC-02', lightTitle: 'Unconfiscatable Voice', activation: 'Truth and voice cannot be chained even when the body, platform, or room is constrained.', replacementLaw: 'My voice is mobile. My truth cannot be confiscated.' },
            { shadowId: 'SC-03', shadowTitle: 'Confiscated Signal', lightId: 'LC-03', lightTitle: 'Signal Transmission', activation: 'The voice is the signal. The signal moves through time and space and reshapes what listens.', replacementLaw: 'I am the signal. I am the transmission.' },
          ],
          declarationFields: [
            { key: 'silencedTruth', label: 'What truth have you been afraid to speak?', placeholder: 'The truth I have not named...' },
            { key: 'fearOfSpeaking', label: 'What are you afraid will happen if you speak?', placeholder: 'I fear...' },
            { key: 'cleanDeclaration', label: 'Write the clean declaration of this truth.', placeholder: 'I now declare...' },
            { key: 'signalIntent', label: 'What do you want this signal to reshape?', placeholder: 'By speaking this, I reshape...' },
          ],
          integrationKey: 'Your voice is not permission. Your voice is evidence. Speak it into the record.',
          xpReward: 600,
          estimatedMinutes: 50,
        },
      ],
    },
    {
      id: 'thought-forms-reality',
      slug: 'thought-forms',
      order: 4,
      title: 'Thought Forms & Reality',
      subtitle: 'Decode the mechanics of thought and how realities are built.',
      description: 'Master the mechanics of manifestation. Learn how thought precedes form and how to align your inner architecture with your desired reality.',
      accent: 'amber',
      artwork: '/ui/reclamation/Module_Cards/reclamation_university/module_four_card.svg',
      modules: [
        {
          id: 'module-manifestation-lab',
          slug: 'manifestation-lab',
          order: 1,
          title: 'Module 4: Manifestation Lab',
          subtitle: 'Align thought, feeling, action, and identity to build the future you author.',
          sourceTrackIds: ['i-create-as-i-speak', 'emerald-mode-online', 'blueprint-of-the-divine'],
          initiationCopy: [
            'Welcome to the Manifestation Lab, Rising Seeker.',
            'Bridge from Identity: in Identity, you dissolved the walls built by hidden laws; here, you use that cleared ground to build authored architecture.',
            'You have learned that the mind is a medium. You have learned that thought forms build walls. Now you will learn the inverse: how to use thought forms to build what you author.',
            'Manifestation is not fantasy. It is not positive thinking. It is the precise alignment of thought, feeling, action, and identity into a coherent signal.',
            'The work is to identify the thought you want to live into form. Then to feel it as if it is already true. Then to take action as if it is already true. Then to become the identity that naturally lives that truth.',
            'This is not magic. This is mechanics. This is how reality is built.',
            'When you complete this module, you will have authored one thought form, aligned it with feeling, action, and identity, and begun to live it into form.',
          ],
          lyricAnchors: [
            { key: 'i-create', label: 'I Create As I Speak', teaching: 'Speech is creative law. Thought precedes form.', line: 'I create as I speak.' },
            { key: 'blueprint', label: 'Divine Blueprint', teaching: 'There is a blueprint beneath the chaos. You can learn to read it and build from it.', line: 'The blueprint of the divine teaches acknowledge, ascend, release, and return.' },
            { key: 'emerald-mode', label: 'Emerald Mode', teaching: 'The mind can shift into a mode of creation rather than reaction.', line: 'Emerald mode online.' },
            { key: 'thought-becomes-scene', label: 'Thought Becomes Scene', teaching: 'What you think becomes the scene you live in.', line: 'What I think becomes scene.' },
          ],
          shadowCodes: [
            {
              id: 'SC-01',
              title: 'Doubt and Underestimation',
              definition: 'Being sold low, doubted, underestimated, or subject to market panic about your value.',
              diagnostic: 'Where am I still doubting my power to build?',
            },
            {
              id: 'SC-02',
              title: 'Fragmented Alignment',
              definition: 'Thought, feeling, action, and identity are misaligned. The signal is scattered.',
              diagnostic: 'Where are my thought, feeling, action, and identity not aligned?',
            },
            {
              id: 'SC-03',
              title: 'Inherited Limitation',
              definition: 'The belief that you are not allowed to build, create, or manifest at full power.',
              diagnostic: 'What inherited belief limits what I can build?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-01', shadowTitle: 'Doubt and Underestimation', lightId: 'LC-01', lightTitle: 'Speech as Law', activation: 'Speech is creative law. Acting as if the future is already built.', replacementLaw: 'I speak my future into form. I act as if it is already true.' },
            { shadowId: 'SC-02', shadowTitle: 'Fragmented Alignment', lightId: 'LC-02', lightTitle: 'Aligned Signal', activation: 'Thought, feeling, action, and identity align into a coherent signal.', replacementLaw: 'My thought, feeling, action, and identity are now aligned.' },
            { shadowId: 'SC-03', shadowTitle: 'Inherited Limitation', lightId: 'LC-03', lightTitle: 'Full Creative Power', activation: 'You are authorized to build, create, and manifest at full power.', replacementLaw: 'I am now authorized to build and create at full power.' },
          ],
          declarationFields: [
            { key: 'thoughtToLiveInto', label: 'What thought do you want to live into form?', placeholder: 'I want to live into the thought that...' },
            { key: 'feelingAlignment', label: 'How does this thought feel when it is true?', placeholder: 'When this is true, I feel...' },
            { key: 'actionAlignment', label: 'What action proves this thought is being lived?', placeholder: 'I take action by...' },
            { key: 'identityAlignment', label: 'Who are you when you live this thought?', placeholder: 'I am someone who...' },
          ],
          integrationKey: 'Thought precedes form. When you align thought, feeling, action, and identity, you become the architect of your reality.',
          xpReward: 700,
          estimatedMinutes: 60,
        },
      ],
    },
    {
      id: 'sovereign-mind',
      slug: 'sovereign-mind',
      order: 5,
      title: 'The Sovereign Mind',
      subtitle: 'Train the mind beyond conditioned limits and programmed patterns.',
      description: 'Transcend inherited programming and conditioned responses. Develop the mental discipline to choose your thoughts and author your consciousness.',
      accent: 'gold',
      artwork: '/ui/reclamation/Module_Cards/reclamation_university/module_five_card.svg',
      modules: [
        {
          id: 'module-sovereign-training',
          slug: 'sovereign-training',
          order: 1,
          title: 'Module 5: Sovereign Training',
          subtitle: 'Reclaim dominion over your own consciousness.',
          sourceTrackIds: ['consecrated', 'second-edition', 'elemental-orchestra'],
          initiationCopy: [
            'Welcome to Sovereign Training, Rising Seeker.',
            'You have learned the mechanics of thought. You have learned to align your inner architecture. Now comes the mastery: training your mind to move beyond conditioned limits.',
            'A sovereign mind is not a mind without pain. A sovereign mind is a mind that can witness pain without being owned by it.',
            'A sovereign mind is not a mind without fear. A sovereign mind is a mind that can move through fear without being stopped by it.',
            'A sovereign mind is not a mind without conditioning. A sovereign mind is a mind that can recognize conditioning and choose differently.',
            'The work of this module is to train your mind to become sovereign. To become the witness of your own thoughts rather than the prisoner of them.',
            'When you complete this module, you will have identified one conditioned pattern, traced it to its source, and practiced choosing a different response.',
          ],
          lyricAnchors: [
            { key: 'consecrated', label: 'Consecrated', teaching: 'What fire leaves is sovereign, whole, and consecrated.', line: 'I am consecrated.' },
            { key: 'second-edition', label: 'Second Edition', teaching: 'You can rewrite yourself. You can become a new edition of yourself.', line: 'I am the second edition.' },
            { key: 'witness', label: 'The Witness', teaching: 'The witness does not panic. The witness records. Become the witness of your own mind.', line: 'I am the witness.' },
            { key: 'bloom', label: 'Bloom', teaching: 'The final student does not wait for outside validation. The student becomes the witness and blooms.', line: 'I bloom.' },
          ],
          shadowCodes: [
            {
              id: 'SC-01',
              title: 'Conditioned Response',
              definition: 'The automatic reaction programmed by trauma, family, culture, or repeated experience.',
              diagnostic: 'What response do I give automatically without choosing?',
            },
            {
              id: 'SC-02',
              title: 'Fragmented Self',
              definition: 'The false self built for tolerance and survival, separate from the true self.',
              diagnostic: 'What part of me am I still hiding or fragmenting?',
            },
            {
              id: 'SC-03',
              title: 'Reactive Consciousness',
              definition: 'The state of being controlled by external circumstances rather than authoring response.',
              diagnostic: 'Where am I still reacting rather than choosing?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-01', shadowTitle: 'Conditioned Response', lightId: 'LC-01', lightTitle: 'Sovereign Choice', activation: 'The sovereign mind can recognize conditioning and choose differently.', replacementLaw: 'I now choose my response. I am not my conditioning.' },
            { shadowId: 'SC-02', shadowTitle: 'Fragmented Self', lightId: 'LC-02', lightTitle: 'Whole Self', activation: 'The false portrait burns. What fire leaves is sovereign, whole, and consecrated.', replacementLaw: 'I am now whole. I no longer fragment myself.' },
            { shadowId: 'SC-03', shadowTitle: 'Reactive Consciousness', lightId: 'LC-03', lightTitle: 'Witnessing Consciousness', activation: 'Become the witness of your own mind. The witness does not panic. The witness records.', replacementLaw: 'I am the witness of my own consciousness. I author my response.' },
          ],
          declarationFields: [
            { key: 'conditionedPattern', label: 'Name one conditioned pattern you react from.', placeholder: 'When this happens, I automatically...' },
            { key: 'sourceOfConditioning', label: 'Where did this conditioning originate?', placeholder: 'I learned this from...' },
            { key: 'witnessPosition', label: 'What does the witness notice about this pattern?', placeholder: 'The witness sees...' },
            { key: 'sovereignChoice', label: 'What choice can you make instead?', placeholder: 'I now choose to...' },
          ],
          integrationKey: 'A sovereign mind is not a mind without conditioning. A sovereign mind is a mind that recognizes conditioning and chooses differently.',
          xpReward: 700,
          estimatedMinutes: 60,
        },
      ],
    },
    {
      id: 'architect-aftermath',
      slug: 'aftermath',
      order: 6,
      title: 'Architect of the Aftermath',
      subtitle: 'Learn to build, protect, and leave a legacy beyond the system.',
      description: 'Transform your personal reclamation into service. Learn to teach what you survived and build systems that protect others from repeating the damage.',
      accent: 'purple',
      artwork: '/ui/reclamation/Module_Cards/reclamation_university/module_six_card.svg',
      modules: [
        {
          id: 'module-teaching-transmission',
          slug: 'teaching-transmission',
          order: 1,
          title: 'Module 6: Teaching Transmission',
          subtitle: 'Return as a teacher. Build the map so others need not suffer blindly.',
          sourceTrackIds: ['architect-of-the-aftermath', 'coded-open', 'fire-in-my-veins'],
          initiationCopy: [
            'Welcome to Teaching Transmission, Rising Seeker.',
            'You have named restrictions, retrieved authorship, learned the mechanics of thought, and trained your mind toward sovereignty.',
            'Now comes the final movement: returning as a teacher. Not to punish. Not to prove. Not to perform. But to teach.',
            'The cleanest win is not that they understand you. The cleanest win is that you can finally teach what you survived.',
            'In this module, you will learn to convert your personal fracture into a teachable protocol. You will learn to build maps so others need not suffer blindly. You will learn to leave a legacy beyond the system.',
            'This is the movement from survival to authorship to teaching. This is the completion of Reclamation University.',
            'When you complete this module, you will have authored a teaching protocol and begun to transmit it to the next seeker.',
          ],
          lyricAnchors: [
            { key: 'architect', label: 'Architect of the Aftermath', teaching: 'You are not the victim of the aftermath. You are the architect of it.', line: 'I am the architect of the aftermath.' },
            { key: 'torch-transfer', label: 'Torch Transfer', teaching: 'The student learns the cost of the deep and leaves a map so others need not suffer blindly.', line: 'I transfer the torch.' },
            { key: 'coded-open', label: 'Coded Open', teaching: 'What was hidden can be opened. What was coded can be deciphered.', line: 'I code it open.' },
            { key: 'fire-reclaimed', label: 'Fire Reclaimed', teaching: 'The fire that tried to destroy you becomes the fire you carry for yourself and others.', line: 'I carry the fire.' },
          ],
          shadowCodes: [
            {
              id: 'SC-01',
              title: 'Systemic Extraction',
              definition: 'The private wound becomes public literacy. The student learns to name systems, not only individuals.',
              diagnostic: 'What system extracted from you? How can you teach others to recognize it?',
            },
            {
              id: 'SC-02',
              title: 'Inherited Silence',
              definition: 'The bloodline, gendered, family, or ancestral silence mistaken for strength.',
              diagnostic: 'What silence are you breaking by teaching?',
            },
            {
              id: 'SC-03',
              title: 'Unfinished Reclamation',
              definition: 'The belief that your reclamation is not complete enough to teach.',
              diagnostic: 'What are you waiting for before you teach?',
            },
          ],
          lightMappings: [
            { shadowId: 'SC-01', shadowTitle: 'Systemic Extraction', lightId: 'LC-01', lightTitle: 'Pattern Literacy', activation: 'Red flags, repetitions, network behavior, and energetic shifts are readable data.', replacementLaw: 'I now teach pattern literacy. I teach others to see the system.' },
            { shadowId: 'SC-02', shadowTitle: 'Inherited Silence', lightId: 'LC-02', lightTitle: 'Public Reclamation', activation: 'The private wound becomes public literacy. Silence is broken by teaching.', replacementLaw: 'I now break the silence. I teach what was hidden.' },
            { shadowId: 'SC-03', shadowTitle: 'Unfinished Reclamation', lightId: 'LC-03', lightTitle: 'Teaching Authority', activation: 'You do not need to be perfect to teach. You need to be honest and precise.', replacementLaw: 'I am authorized to teach what I have reclaimed.' },
          ],
          declarationFields: [
            { key: 'systemLearned', label: 'What system did you learn to recognize?', placeholder: 'I learned to see...' },
            { key: 'teachingProtocol', label: 'What protocol would you teach others?', placeholder: 'I teach others to...' },
            { key: 'mapForOthers', label: 'What map do you leave so others need not suffer blindly?', placeholder: 'The map I leave is...' },
            { key: 'legacyIntent', label: 'What legacy do you build beyond the system?', placeholder: 'My legacy is...' },
          ],
          integrationKey: 'The cleanest win is not that they understand you. The cleanest win is that you can finally teach what you survived.',
          xpReward: 800,
          estimatedMinutes: 75,
        },
      ],
    },
  ],
};

export const RECLAMATION_CURRICULUM = enrichCurriculum(BASE_RECLAMATION_CURRICULUM);

/**
 * Helper function to get a faculty by slug
 */
export function getFacultyBySlug(slug) {
  return RECLAMATION_CURRICULUM.faculties.find((f) => f.slug === slug);
}

/**
 * Helper function to get a module by faculty slug and module slug
 */
export function getModuleBySlug(facultySlug, moduleSlug) {
  const faculty = getFacultyBySlug(facultySlug);
  if (!faculty) return null;
  return faculty.modules.find((m) => m.slug === moduleSlug);
}

/**
 * Helper function to get all faculties
 */
export function getAllFaculties() {
  return RECLAMATION_CURRICULUM.faculties;
}
