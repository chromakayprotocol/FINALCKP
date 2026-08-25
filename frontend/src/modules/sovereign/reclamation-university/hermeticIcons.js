import {
  Activity, BookOpen, Brain, Building2, Check, CircleDot,
  FileText, Flame, Globe2, Lightbulb, PenLine, RefreshCw, Sparkles,
  Target, Waves,
} from "lucide-react";

/* Single source of truth for the icon (and, for principles, the fixed
   accent colour) attached to each of the seven Hermetic Hall principles
   and each of the eleven canonical curriculum sections (curriculumSections.js).
   Previously duplicated only in HermeticSuppliedModuleExperience.jsx and used
   nowhere else -- Polarity/Rhythm/Cause & Effect/Gender's own principle
   ribbons rendered no icon at all, and no sidebar rendered one either. */

export const PRINCIPLES = [
  { n: "I", slug: "mentalism", name: "Mentalism", Icon: Brain, color: "#4E9A6B" },
  { n: "II", slug: "correspondence", name: "Correspondence", Icon: Globe2, color: "#4E8FB4" },
  { n: "III", slug: "vibration", name: "Vibration", Icon: Activity, color: "#E1573F" },
  { n: "IV", slug: "polarity", name: "Polarity", Icon: CircleDot, color: "#8B6FD9" },
  { n: "V", slug: "rhythm", name: "Rhythm", Icon: Waves, color: "#3FA6A0" },
  { n: "VI", slug: "cause-and-effect", name: "Cause & Effect", Icon: Target, color: "#7CA84A" },
  { n: "VII", slug: "gender", name: "Gender", Icon: RefreshCw, color: "#D45B3E" },
];

export const SECTION_ICONS = {
  "intro": BookOpen,
  "principle": Brain,
  "key-concepts": Lightbulb,
  "why-it-matters": Sparkles,
  "domains": Building2,
  "reclamation": Flame,
  "2026-lens": Globe2,
  "reflection": PenLine,
  "protocol": Target,
  "artifact": FileText,
  "summary": Check,
};
