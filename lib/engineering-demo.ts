export type EngineeringInterest = "workflow" | "application" | "integration" | "unsure";
export type DemoScenario = Exclude<EngineeringInterest, "unsure">;
export type DemoPhase = "ready" | "checking" | "blocked" | "complete";
export type DemoChoice = "ready" | "incomplete";

export const engineeringInterests: Record<EngineeringInterest, string> = {
  workflow: "Website or enquiry journey", application: "Learning platform or application",
  integration: "Connected tools or workflow", unsure: "Let's work it out",
};

export const engineeringScenarios = {
  workflow: {
    number: "01", service: "Websites & enquiries", prompt: "Make our website clearer", label: "Website journey", short: "A clearer route from interest to action.",
    title: "Keep the context of the first click.",
    problem: "Someone finds the right course, then lands on a general contact page. They have to explain what they were looking at all over again.",
    solution: "Connect the course page to a focused enquiry, keeping its context and checking only the information needed for the next conversation.",
    deliverable: "A defined website-to-enquiry journey around your existing offer.",
    record: "Course enquiry", reference: "EXAMPLE–01", field: "Where should the course link lead?",
    value: "Getting started · Example workshop",
    validOption: "A focused enquiry with the course attached",
    invalidOption: "A general page with no course context",
    inputError: "The course context is lost. Keep it attached so the visitor can continue without starting again.",
    steps: ["Course selected", "Context retained", "Enquiry ready"],
    ready: "Choose a route and try it. The course context should travel with the visitor.",
    checking: "Checking what reaches the enquiry…",
    blocked: "The course reference is missing. Keep the visitor's draft and restore the reference.",
    complete: "The course is attached to the enquiry. The visitor can explain what they need next.",
    retry: "Keep course context & retry", recovery: "Missing course reference",
    lesson: "Keep useful context between steps. Ask for information once.",
  },
  application: {
    number: "02", service: "Web applications", prompt: "Improve our application", label: "Learner experience", short: "Useful features, portals and learning interfaces.",
    title: "A return visit should feel like a return.",
    problem: "A learner comes back to a course but cannot see where they stopped. The next useful step is buried in the interface.",
    solution: "Bring the current lesson, retained work and next action into one clear view. Improve the journey within your existing platform.",
    deliverable: "A focused learner-dashboard or course-journey improvement.",
    record: "Returning learner", reference: "EXAMPLE–02", field: "What should the learner see first?",
    value: "Saved position · Step 2 of 3",
    validOption: "Continue from their saved step",
    invalidOption: "Start the same activity from step 1",
    inputError: "The saved position is ignored. Offer the learner their existing step before asking them to restart.",
    steps: ["Learner returns", "Saved step found", "Continue learning"],
    ready: "Choose the return experience. This fictional learner has already reached step 2.",
    checking: "Finding the learner's saved position…",
    blocked: "Saved progress has not loaded. Keep the current work and offer a retry.",
    complete: "Step 2 is ready to continue. The earlier work is retained.",
    retry: "Restore saved step & retry", recovery: "Progress temporarily unavailable",
    lesson: "Make the next action visible, and preserve work when a request fails.",
  },
  integration: {
    number: "03", service: "Integrations & workflows", prompt: "Connect our everyday tools", label: "Connected operations", short: "Less manual work between your tools.",
    title: "An email problem should not lose an enquiry.",
    problem: "An important enquiry depends on an email reaching the right person. When that connection fails, the team needs a way to find and recover it.",
    solution: "Connect the website and follow-up workflow with validation, private storage and a retryable notification. Check existing integrations before adding custom code.",
    deliverable: "A bounded connection between the tools you use, with an agreed recovery path.",
    record: "Website enquiry", reference: "EXAMPLE–03", field: "What happens before the email is sent?",
    value: "Workshop enquiry · Example organisation",
    validOption: "Save the enquiry, then send the notification",
    invalidOption: "Send the email without saving the enquiry",
    inputError: "There is no saved enquiry to recover. Keep a record before relying on the notification.",
    steps: ["Brief checked", "Enquiry saved", "Notification sent"],
    ready: "Choose the order, then try a notification failure to see the recovery path.",
    checking: "Checking the save and notification sequence…",
    blocked: "The email service is unavailable. The saved enquiry is kept for retry.",
    complete: "The enquiry is saved and the notification is confirmed. One enquiry, with no duplicate created by retry.",
    retry: "Keep enquiry & retry", recovery: "Temporary notification failure",
    lesson: "Save useful work before depending on another service.",
  },
} as const;

export type EngineeringDemoState = { scenario: DemoScenario; phase: DemoPhase; recover: boolean; attempt: number; choice: DemoChoice };
export const initialEngineeringDemo: EngineeringDemoState = { scenario: "workflow", phase: "ready", recover: false, attempt: 0, choice: "ready" };
export type EngineeringDemoEvent =
  | { type: "select"; scenario: DemoScenario }
  | { type: "choice"; choice: DemoChoice }
  | { type: "run"; recover: boolean }
  | { type: "resolve"; attempt: number }
  | { type: "retry" }
  | { type: "reset" };

export function engineeringDemoReducer(state: EngineeringDemoState, event: EngineeringDemoEvent): EngineeringDemoState {
  if (event.type === "select") return { ...initialEngineeringDemo, scenario: event.scenario, attempt: state.attempt + 1 };
  if (event.type === "reset") return { ...initialEngineeringDemo, scenario: state.scenario, attempt: state.attempt + 1 };
  if (event.type === "choice") return { ...state, choice: event.choice, phase: "ready", recover: false, attempt: state.attempt + 1 };
  if (event.type === "run") return { ...state, phase: "checking", recover: event.recover, attempt: state.attempt + 1 };
  if (event.type === "retry") return state.phase === "blocked" ? { ...state, choice: "ready", phase: "checking", recover: false, attempt: state.attempt + 1 } : state;
  if (event.attempt !== state.attempt || state.phase !== "checking") return state;
  return { ...state, phase: state.recover || state.choice === "incomplete" ? "blocked" : "complete" };
}
