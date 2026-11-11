---
name: add-api-endpoint
description: Use whenever adding or modifying an API endpoint or route handler. Enforces contract-first design, Zod validation, rate limiting, and the standard error shape.
---

# Add API Endpoint (`add-api-endpoint`)

Follow these steps in order whenever creating or updating an API route:

1. **Write the contract first:** Document the endpoint path, method, query/body parameters, response payload, auth/role requirements, and error codes in `docs/architecture/api.md` before writing the handler.
2. **Define Zod schemas:** Create strict Zod validation schemas for all path params, query params, headers, and request bodies at the boundary.
3. **Implement rate limiting & auth:**
   - Apply rate limiting to every public endpoint.
   - Enforce CSRF protection on state-changing routes.
   - Enforce explicit role checks (`reviewer`, `admin`, or `advertiser` member roles) on protected routes.
   - If the endpoint belongs to Watch Ads (`/api/watch/*`, `/r/:adId`), check the Watch Ads switch (`D23`) first and return `404` immediately when the switch is off.
4. **Use the standard error shape:** Every error response across the API must return:
   ```json
   {
     "error": {
       "code": "STRING_ERROR_CODE",
       "message": "Human-readable explanation",
       "fields": {}
     }
   }
   ```
5. **Enforce ad isolation:** `/api/feed` and `/api/catalogues` must never return ads under any condition.
6. **Write tests:** Add unit/integration tests covering valid requests, Zod validation failures (`400`), unauthorized/forbidden access (`401`/`403`), rate limiting (`429`), and the standard error shape.
7. **Update docs:** Ensure `docs/architecture/api.md` and `CHANGELOG.md` are updated in the same PR.
