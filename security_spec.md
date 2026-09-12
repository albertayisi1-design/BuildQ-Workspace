# Security Specification: BuildIQ Construction Management

## 1. Data Invariants
1. **Document Ownership & Immutability**:
   - Documents (`/documents/{docId}`) must have a valid `id`, non-empty `projectId`, `title`, and `fileName`.
   - `uploaded_by_uid` must match `request.auth.uid` upon creation.
   - Core identifiers (`id`, `project_id`, `uploaded_by_uid`) are immutable after creation.
   - String sizes and array lengths are strictly bounded to prevent resource exhaustion attacks.

2. **User Identity & Access Control**:
   - Users can only read and update their own user profile (`/users/{userId}`) unless they are verified Administrators.
   - Role elevation (changing `role` or setting admin privileges) is forbidden for standard users.
   - Admin access is strictly governed by the trusted `/admins/{userId}` document collection, checked via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
   - The user email `albert.ayisi1@gmail.com` is bootstrapped as the initial root administrator.

3. **Project & Financial Invariants**:
   - Projects, WBS items, and Costs can only be modified by authenticated users with active roles (Admin or Project Manager).
   - Numeric fields (amounts, budgets, costs) must be non-negative numbers.

4. **Timestamp Strictness**:
   - `createdAt` and `updatedAt` timestamps must strictly use `request.time`.

---

## 2. The "Dirty Dozen" Threat Payloads (Red Team Test Scenarios)
1. **Payload 1 (Ghost Field Injection)**: Attempt to inject `isAdmin: true` into a document payload during create.
2. **Payload 2 (Identity Spoofing)**: Attempt to set `uploaded_by_uid: "victim_uid"` when authenticated as `attacker_uid`.
3. **Payload 3 (Unauthenticated Read)**: Anonymous client attempts to read `/documents/doc_123`.
4. **Payload 4 (Unverified Email Admin Escalation)**: User with email `albert.ayisi1@gmail.com` but `email_verified == false` attempts administrative delete.
5. **Payload 5 (Huge String / DoS Bomb)**: Attempt to write a document with a 500KB string in `title` (exceeding 200 chars).
6. **Payload 6 (Path Traversal / ID Poisoning)**: Document write with path ID `../../etc/passwd` or non-alphanumeric junk.
7. **Payload 7 (Immutable ID Mutation)**: Update operation attempting to alter `id` or `project_id`.
8. **Payload 8 (Negative Cost Attack)**: Attempting to insert a cost record with `amount: -500000`.
9. **Payload 9 (Terminal State Bypass)**: Attempting to modify a document marked `status: "Approved"` or `"Expired"` without admin privileges.
10. **Payload 10 (Client User Impersonation)**: Client role trying to write internal project costs.
11. **Payload 11 (Array Flooding)**: Attempting to send an array of 5,000 tags to trigger excessive document size.
12. **Payload 12 (Audit Trail Forgery)**: User attempting to rewrite or delete existing audit log documents.
