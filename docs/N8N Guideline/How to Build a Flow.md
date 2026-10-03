# N8N Workflow Construction Guideline

> **Purpose**: This guideline establishes the standard reasoning process and architectural pattern that every AI Agent must follow when designing, building, or modifying n8n workflows in this project.

---

## 1. The AI Agent Thinking Process

When tasked with building or updating an n8n workflow, follow this sequential reasoning loop:

```text
Understand ──► Inspect ──► Design ──► Route ──► Process ──► Validate ──► Handle Errors ──► Return Truthful Result ──► Test
```

1. **Understand**: Clarify the business objective (e.g., Auth, Add Task, Get Board Data, Update Status).
2. **Inspect**: Read the source of truth first—frontend JavaScript (`API/*.js`), HTML structure, and Notion database schemas. Never guess payload names or response expectations.
3. **Design**: Plan the flow visually with clear, purpose-driven node names.
4. **Route**: Position a central **Switch** immediately after the Webhook.
5. **Process**: Parse, normalize, and extract data cleanly.
6. **Validate**: Verify mandatory fields, formats, and authenticated user identity.
7. **Handle Errors**: Wire error branches explicitly. Ensure errors are never swallowed.
8. **Return Truthful Result**: Return real HTTP status codes and structured responses.
9. **Test**: Validate both the **success path** and the **failure path** before completing the task.

---

## 2. Core Architecture: The Standard Project Pattern

Every API workflow in this project **must** adhere to this architectural hierarchy:

```text
Webhook (Receives Request)
   │
   ▼
Switch / Router (Decides Path)
   ├── [Action A] ──► Validation & Prep ──► Data Operation (Notion) ──► Truthful Success Response (200)
   ├── [Action B] ──► Validation & Prep ──► Data Operation (Notion) ──► Truthful Success Response (200)
   └── [Fallback] ──► Invalid Action Handler ──────────────────────────► Error Response (400)
```

### Architectural Principle:
$$\text{Webhook Receives} \longrightarrow \text{Switch Decides} \longrightarrow \text{Action Executes} \longrightarrow \text{Result Validates} \longrightarrow \text{Response Returns}$$

### Why the Switch is Mandatory:
- **Central Control**: A single webhook endpoint can cleanly support multiple sub-actions (`Add a new task`, `Update task status`, `Get all tasks`, etc.).
- **Scalability**: Adding a new feature requires only a new Switch output branch without rebuilding the workflow.
- **Readability & Debugging**: Incoming requests and execution paths are immediately visible and trackable in the execution logs.

---

## 3. Truthful Error Handling

> [!IMPORTANT]
> **Workflow Execution Succeeded $\neq$ Business Operation Succeeded.**
> Never return a `200 OK` or `success: true` simply because the n8n execution reached the end of the graph.

```text
Operation Execution
        │
        ▼
Did the business operation actually succeed?
  ├── YES ──► { "success": true, "process": "done", "status": "success", "data": ... } [HTTP 200]
  └── NO  ──► { "success": false, "process": "error", "message": "...", "error": ... } [HTTP 4xx / 5xx]
```

### Error Rules:
1. **Never Swallow Errors**: Do not let failed database calls or empty validation checks silently resolve to empty success responses.
2. **Preserve Error Detail**: Propagate meaningful error messages and error codes (`UNAUTHENTICATED_USER`, `MISSING_TITLE`, `NOTION_WRITE_FAILED`) to the client.
3. **Use Node Error Outputs**: Enable `onError: continueErrorOutput` on external integration nodes (e.g., Notion) to catch API failures and route them to dedicated error response nodes.
4. **Never Convert Errors to Fake Success**: Sending `{ "process": "done" }` on failure is strictly forbidden.

---

## 4. Strict Input & Identity Validation

Do not assume received payloads are correct. Validate before calling external APIs:

- **Mandatory Fields**: Verify required properties exist (`title`, `description`, `email`, etc.).
- **User Authentication & Identity**:
  - `userId` / `user ID` must always come from the authenticated user's session context.
  - **Never** generate random user IDs in data workflows (e.g., Add Task / Get Tasks).
  - If user identity is missing, fail immediately with HTTP `401 Unauthorized`.
- **Task ID Integrity**:
  - Task IDs (`ID_task`) must be generated via dedicated JavaScript Code nodes and checked for collision/uniqueness against the database.

---

## 5. JavaScript Usage Guidelines

JavaScript (`Code` node) should be used where it provides genuine value:
- Complex data transformations and payload normalization.
- Unique ID generation algorithms.
- Custom filtering and multi-attribute property matching.
- Calculation of computed metrics or statistics.

### What NOT to do:
- **Do not** build a monolithic workflow inside a single huge Code node.
- Keep data operations (Notion create, query, update) and routing (Switch, IF) as distinct, visible n8n nodes.
- The visual workflow graph itself must communicate the architecture.

---

## 6. Data Ownership & Privacy Scoping

All data queries and mutations must respect user data ownership:

```text
Authenticated User
       │
       ▼
Extract user ID / userEmail
       │
       ▼
Scope Database Operations
       │
       ▼
Operate Only on Records Belonging to This User
```

- **In GET operations**: Filter Notion records strictly by the requesting user's `user ID` or `Assigned User` relation. Never return another user's tasks.
- **In POST/Update operations**: Ensure the record is associated with the authenticated user ID before completing the action.

---

## 7. Node Naming & Organization

- Use **descriptive, action-oriented node names**:
  - *Correct*: `Board GET Webhook`, `Section Switch`, `Extract and Validate User Request`, `Get Tasks from Notion`, `Filter and Format Tasks for User Board`, `Respond to Board GET`, `Respond with Error`.
  - *Incorrect*: `Webhook`, `Code`, `Code 1`, `Notion`, `HTTP Request`, `Set`.
- Optimize for **correctness, clarity, and maintainability** over the absolute minimum node count. A workflow with clear, separated steps is far easier to maintain and debug than a compressed, opaque workflow.

---

## 8. Definition of "Done" for an Agent

An AI Agent must **never** report a task as "Done" merely because a JSON file was written or nodes were connected.

### Pre-Completion Checklist:
- [ ] Inspected existing JavaScript and HTML files to match exact parameter and response keys.
- [ ] Webhook is followed by a dedicated Switch / Router node.
- [ ] Authentication context (`userId`) is validated and scoped properly.
- [ ] Error branches are explicitly connected to a structured `Respond with Error` node.
- [ ] Success branch returns structured data matching frontend expectations (`success: true, process: 'done'`).
- [ ] Workflow JSON contains valid credentials and database IDs.
- [ ] Validated both the **Success Path** and the **Error Path**.

**Only after confirming all items above may the Agent report the workflow as complete.**
