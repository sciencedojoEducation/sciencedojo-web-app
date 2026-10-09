export type DemoChoice =
  | "clarify"
  | "promise"
  | "forward"
  | "align"
  | "assume"
  | "escalate"
  | "confirm"
  | "handoff"
  | "notes";

export type DemoDecision = {
  choice: DemoChoice;
  label: string;
  feedback: string;
};

export type DemoState = {
  step: 0 | 1 | 2;
  selected: DemoChoice | null;
  decisions: DemoDecision[];
  checked: boolean;
  complete: boolean;
};

type DemoOption = DemoDecision;

export type DemoScenario = {
  title: string;
  context: string;
  question: string;
  options: DemoOption[];
};

export const demoSteps = ["The request", "The trade-off", "The handover"];

export function createDemoState(): DemoState {
  return { step: 0, selected: null, decisions: [], checked: false, complete: false };
}

export function getDemoScenario(state: Pick<DemoState, "step" | "decisions">): DemoScenario {
  const firstChoice = state.decisions[0]?.choice;
  const secondChoice = state.decisions[1]?.choice;

  if (state.step === 0) {
    return {
      title: "Clarify the request.",
      context: "You’re a new project coordinator at a fictional studio. A client emails: “Can we have an onboarding guide by Friday? Keep it simple — similar to the last one.”",
      question: "What do you do before passing the request to delivery?",
      options: [
        {
          choice: "clarify",
          label: "Ask about the audience, essential content, approver, and exact deadline.",
          feedback: "The client names Maya as approver and confirms a first-day checklist with policy links for 20 new hires, due Friday at 4 pm. You now have a brief to test with delivery.",
        },
        {
          choice: "promise",
          label: "Promise Friday and ask delivery to start a guide.",
          feedback: "Delivery starts a handbook. The client meant a first-day checklist. You’ve committed to a deadline before agreeing what needs to be built.",
        },
        {
          choice: "forward",
          label: "Forward the email and ask delivery how long it will take.",
          feedback: "Delivery estimates two days, but the format, essential content, and approver are still open. An estimate alone does not make this request actionable.",
        },
      ],
    };
  }

  if (state.step === 1) {
    const context = firstChoice === "clarify"
      ? "Alex, the delivery lead, can finish the agreed checklist and policy links by Friday. Adding them to the client’s portal would take until Monday. Maya asks if “all onboarding” can still be ready on Friday."
      : firstChoice === "promise"
        ? "Alex has started a handbook, but Maya, the client approver, now explains that she needs a first-day checklist and policy links. Portal integration would take until Monday. Your Friday promise needs to be revisited."
        : "Alex’s two-day estimate did not include portal integration, which would take until Monday. You learn that Maya is the client approver and Friday is the target. The actual deliverable still needs agreement.";

    return {
      title: "Resolve the trade-off.",
      context,
      question: "How do you resolve the mismatch between scope and time?",
      options: [
        {
          choice: "align",
          label: "Agree a Friday checklist with Maya; confirm portal work as a separate follow-up.",
          feedback: "Maya approves the checklist and policy links for Friday at 4 pm. Portal work is separate and has no promised date. Alex confirms capacity for the agreed deliverable.",
        },
        {
          choice: "assume",
          label: "Keep the Friday target and let Alex interpret “all onboarding.”",
          feedback: "Alex flags that portal work cannot fit by Friday. Maya has not approved a smaller deliverable. The team still has two different expectations.",
        },
        {
          choice: "escalate",
          label: "Ask your manager to choose the scope without checking with Maya.",
          feedback: "Your manager chooses a checklist, but Maya has not approved that change. Internal agreement helps with capacity; it does not replace agreement with the client.",
        },
      ],
    };
  }

  const scopeAgreed = secondChoice === "align";
  return {
    title: "Make the handover usable.",
    context: scopeAgreed
      ? "The Friday checklist and policy links are approved. Alex has capacity. Portal work is separate. Delivery needs a clear record of who owns the work and when to check progress."
      : secondChoice === "assume"
        ? "Alex and Maya still have different expectations about Friday. Before delivery can proceed confidently, the scope needs client approval and a named owner."
        : "Your manager has proposed a checklist. Maya’s approval is still missing. Before handing over, you need to confirm the scope with her and make ownership explicit.",
    question: "What should happen before you mark this handover complete?",
    options: [
      {
        choice: "confirm",
        label: scopeAgreed
          ? "Assign Alex the approved checklist; record Maya’s approval, Friday 4 pm, and a Thursday check-in."
          : "Confirm scope with Maya and Friday 4 pm with Alex; name Alex as owner and record a Thursday check-in.",
        feedback: scopeAgreed
          ? "Alex is the named delivery owner, Maya is the approver, and the scope, deadline, and checkpoint are written down. The handover is actionable."
          : "Maya approves the checklist and policy links. Alex confirms capacity for Friday at 4 pm and accepts delivery ownership. You record the approved scope, owner, deadline, and Thursday checkpoint; portal work is separate.",
      },
      {
        choice: "handoff",
        label: "Mark it complete and let delivery contact the client if anything is unclear.",
        feedback: scopeAgreed
          ? "The scope is agreed, but ownership and the progress check are not recorded. Delivery has to reconstruct the handover instead of using one shared brief."
          : "The open scope is passed downstream. Delivery may start work the client has not approved, and no one has a shared record of ownership or the checkpoint.",
      },
      {
        choice: "notes",
        label: "Send the email thread and assume everyone knows their next step.",
        feedback: "The thread contains context, but it is not an agreed handover. A brief should make the deliverable, owner, approver, deadline, and next checkpoint easy to find.",
      },
    ],
  };
}

export type DemoAction =
  | { type: "select"; choice: DemoChoice }
  | { type: "check" }
  | { type: "continue" }
  | { type: "reset" };

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return createDemoState();
  if (state.complete) return state;

  if (action.type === "select") {
    if (state.checked || !getDemoScenario(state).options.some((option) => option.choice === action.choice)) return state;
    return { ...state, selected: action.choice };
  }

  if (action.type === "check") {
    if (state.checked || state.selected === null) return state;
    const decision = getDemoScenario(state).options.find((option) => option.choice === state.selected);
    if (!decision) return state;
    return { ...state, decisions: [...state.decisions, decision], checked: true };
  }

  if (!state.checked) return state;
  if (state.step === 2) return { ...state, complete: true };
  return { ...state, step: (state.step + 1) as 1 | 2, selected: null, checked: false };
}

export function getDemoReview(decisions: DemoDecision[]) {
  const practice: string[] = [];
  if (decisions[0]?.choice !== "clarify") practice.push("Clarify audience, scope, approver, and deadline before making a commitment.");
  if (decisions[1]?.choice !== "align") practice.push("Resolve scope and capacity with the client; make any follow-up work explicit.");
  if (decisions[2]?.choice !== "confirm") practice.push("Record the deliverable, owner, approver, deadline, and checkpoint in one brief.");

  return {
    outcome: decisions[2]?.choice === "confirm"
      ? "You finished with an actionable handover."
      : "Your handover still leaves work for others to clarify.",
    practice: practice.length > 0
      ? practice
      : ["Use the scope–owner–deadline–checkpoint checklist on your next handover."],
  };
}
