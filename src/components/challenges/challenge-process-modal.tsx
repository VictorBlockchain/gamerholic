/**
 * Challenge-facing aliases for the shared process modal.
 * Prefer `@/components/ui/gh-process-modal` + `useProcessModal` for new code.
 */

export {
  GhProcessModal as ChallengeProcessModal,
  IDLE_PROCESS,
  processBeat,
  type GhProcessState as ChallengeProcessState,
  type GhProcessStep as ChallengeProcessStep,
  type GhProcessPhase as ChallengeProcessPhase,
  type GhProcessTone,
} from "@/components/ui/gh-process-modal";
