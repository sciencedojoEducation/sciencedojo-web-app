export const handoverBrief = {
  title: "Client request → clear handover",
  audience: "New project coordinators in a fictional IT service team.",
  task: "Turn a vague client request into an actionable brief before delivery starts.",
  objectives: ["Prepare a handover that names scope, acceptance criteria, owner, approver, confirmed deadline, checkpoint, and an action for unresolved information."],
  suggestedMinutes: "Allow about 5–10 minutes for the decisions, writing, and review, depending on your pace.",
  disclaimer: "Fictional design example. It has not been evaluated with a client team. The written response and review are illustrative; they do not come from a learner or a client project.",
};

export const handoverExercise = {
  prompt: "Use the confirmed facts below to draft a short delivery brief. State the deliverable, owner, approver, deadline, checkpoint, and unresolved issue. Distinguish an agreed commitment from an assumption.",
  notes: [
    { source: "Maya, the client approver", fact: "Approves a first-day PDF checklist for 20 new starters, with joining instructions and links to approved policies. She will accept it when those items are present and the links are correct." },
    { source: "Alex, the delivery lead", fact: "Accepts ownership and confirms capacity to deliver the agreed checklist by Friday at 4 pm. A progress check is agreed for Thursday at 2 pm." },
    { source: "Lina, the policy contact", fact: "Must confirm the current policy links by Thursday at noon. That confirmation is still outstanding." },
    { source: "Portal integration", fact: "Is excluded from this handover. A separate scope and date have not been agreed." },
  ],
  responseHint: "Deliverable and acceptance criteria: …\nOwner and approver: …\nDeadline and checkpoint: …\nOpen issue, owner, and next action: …",
};

export const handoverSampleResponse = [
  "Deliver a first-day PDF checklist for 20 new starters. Include joining instructions and approved policy links. Maya will accept the checklist when the required items are present and the links are correct.",
  "Alex owns delivery; Maya is the client approver. Maya has approved this scope, and Alex has confirmed capacity to deliver by Friday at 4 pm. We will check progress on Thursday at 2 pm.",
  "Portal integration is a separate request with no agreed delivery date. The policy links still need checking before the checklist is sent.",
];

export const handoverRubric = [
  {
    criterion: "Scope",
    description: "Names the deliverable, audience, acceptance criteria, and excluded work.",
    levels: [
      { rating: "Missing", description: "Does not identify the deliverable or its acceptance criteria." },
      { rating: "Partly demonstrated", description: "Identifies the deliverable but leaves the audience, acceptance criteria, or exclusions unclear." },
      { rating: "Clearly demonstrated", description: "Records the agreed deliverable, audience, acceptance criteria, and excluded work." },
    ],
    sampleRating: "Clearly demonstrated",
    sampleEvidence: "Names the first-day checklist, 20 new starters, approved policy links, and Maya’s acceptance. Separates portal integration from this delivery.",
  },
  {
    criterion: "Owner",
    description: "Names the accountable delivery owner, client approver, and next checkpoint.",
    levels: [
      { rating: "Missing", description: "Names no accountable owner or approver." },
      { rating: "Partly demonstrated", description: "Names an owner or approver but leaves responsibility or the checkpoint unclear." },
      { rating: "Clearly demonstrated", description: "Names the delivery owner and approver and records the agreed checkpoint." },
    ],
    sampleRating: "Clearly demonstrated",
    sampleEvidence: "Names Alex as delivery owner and Maya as approver, with a Thursday 2 pm progress check.",
  },
  {
    criterion: "Deadline",
    description: "Records an explicit deadline that the delivery owner has confirmed for the agreed scope.",
    levels: [
      { rating: "Missing", description: "Gives no explicit deadline." },
      { rating: "Partly demonstrated", description: "Gives a deadline but does not record confirmation of capacity for the agreed scope." },
      { rating: "Clearly demonstrated", description: "Records the agreed day and time and the delivery owner’s confirmation of capacity." },
    ],
    sampleRating: "Clearly demonstrated",
    sampleEvidence: "Records Friday at 4 pm and states that Alex has confirmed capacity for the approved scope.",
  },
  {
    criterion: "Uncertainty",
    description: "Identifies an unresolved issue, its owner, its check date, and a next action if it remains unresolved.",
    levels: [
      { rating: "Missing", description: "Treats unresolved information as confirmed or omits it." },
      { rating: "Partly demonstrated", description: "Acknowledges some uncertainty but omits an issue, its owner, its check date, or the action if unresolved." },
      { rating: "Clearly demonstrated", description: "Records the outstanding issue, who will resolve it, when it will be checked, and the action if it remains unresolved." },
    ],
    sampleRating: "Partly demonstrated",
    sampleEvidence: "Acknowledges that policy links need checking and leaves portal work uncommitted, but omits Lina as the check owner, the Thursday noon deadline, and what to do if the links remain unconfirmed.",
  },
];

export const handoverRevision = "Lina will confirm the current policy links by Thursday at noon. If confirmation is missing, flag the affected links to Alex and Maya before the 2 pm checkpoint and agree the next step before including them in the final checklist.";

export const handoverStoryboard = [
  "Clarify the request: choose how to resolve missing audience, scope, approver, and deadline; inspect the consequence of the choice.",
  "Resolve the trade-off: align scope and delivery capacity with the client; separate portal work from the Friday checklist.",
  "Make the handover usable: record owner, approval, explicit deadline, and checkpoint; review the decisions made.",
  "Apply it: use the confirmed source notes to write a delivery brief that also handles the outstanding policy-link check.",
  "Review the work: compare with the four-criterion guide, inspect an illustrative response and human review, and revise the handling of uncertainty.",
];

export const handoverDocuments = [
  { title: "Learning brief & storyboard", items: ["Audience and workplace task", "Observable learning objective", "Decision, feedback, application, and review sequence"] },
  { title: "Application exercise & scoring guide", items: ["Fictional source notes and response prompt", "Four criteria with three descriptive levels each", "Illustrative response, worked review, and suggested revision"] },
  { title: "Client review & handover checklist", items: ["Subject expert checks the process, fictional facts, expected response, and assessment criteria before final sign-off.", "Client reviews the agreed scope and supplies consolidated feedback for the two review rounds.", "Final checks cover the agreed browser and device journey, keyboard use, visible labels, and readable feedback.", "Handover notes identify the final module version, agreed launch steps, known limitations, and how future changes are requested."] },
];

export const handoverEvaluationPlan = [
  "Agree what an acceptable handover contains with the client’s subject expert before development.",
  "Collect responses to different, comparable requests before and after practice, using the same criteria.",
  "Record who took part, how review was conducted, and any other training or support that could affect the result.",
  "Review transfer to work with the client. Publish a case study only with permission and describe the limits of the evidence.",
];
