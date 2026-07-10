# Bug Fixing Workflow Example

An example of resolving a failing validation bug.

## 1. Reproduction of the issue
Run tests to isolate the bug described in `BUG-user-validation.md`:
```bash
npm run test:unit tests/unit/user_test.ts
```
*Output*:
```text
FAIL  tests/unit/user_test.ts
  ✕ should fail on invalid email format
    - Expected ValidationError but got TypeError (Cannot read properties of undefined (reading 'includes'))
```

## 2. Minimal targeted fix
The error happens because the email check in `UserEmail.ts` does not check for `undefined`. Let's fix this in `src/domain/user.ts`:
```diff
-  public static create(email: string): UserEmail {
-    if (!email || !email.includes("@")) {
+  public static create(email: unknown): UserEmail {
+    if (typeof email !== "string" || !email.includes("@")) {
       throw new ValidationError("Invalid email format");
     }
-    return new UserEmail(email);
+    return new UserEmail(email as string);
   }
```

## 3. Local Verification & Telemetry Audit
1. Re-run tests:
   ```bash
   npm run test:unit tests/unit/user_test.ts
   ```
   *Result*: `PASS`
2. Compile project:
   ```bash
   npx tsc --noEmit
   ```
   *Result*: compilation successful with 0 errors.
3. Check output log files:
   ```bash
   cat logs/test_run.log | grep '"level":50'
   ```
   *Result*: Empty (0 error logs).
