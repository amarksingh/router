# @ostro/router — Antigravity AI Architecture & Knowledge Base

> **Package Name**: `@ostro/router`
> **Version**: `1.0.5`
> **Role in Ecosystem**: Modular Core Framework Library

---

## 1. Package Purpose & Overview
HTTP route dispatcher with regex URL matching, route groups, named parameters, and middleware layers.

- **Primary Architectural Patterns**: Chainable route builder, trie/regex route compilation, pipeline dispatch.
- **Key Exported Entities**: `Router`, `Route`, `Layer`, `HttpContext`, `ThrottleRequests`

---

## 2. Dependencies & Interoperability
- **Direct Dependencies**:
  - `@ostro/support`: `^1.0.11`
  - `@ostro/contracts`: `^1.0.2`
  - `array-flatten`: `^3.0.0`
  - `lodash.difference`: `^4.5.0`
  - `path-to-regexp`: `^6.2.0`
- **Framework Consumers**: Consumed across the OstroJS ecosystem via `@ostro/framework` and direct imports.

---

## 3. Directory & Source Layout
```text
origin/router/
├── console/controllerMakeCommand.ts
├── console/middlewareMakeCommand.ts
├── controller.ts
├── exceptionHandler.ts
├── exceptions/invalidRouteExceptions.ts
├── exceptions/methodNotAvailable.ts
├── httpContext.ts
├── layer.ts
├── middleware/throttleRequests.ts
├── routeServiceProvider.ts
├── router.ts
├── utils.ts
├── viewController.ts
```

---

## 4. TypeScript Typing & Code Standards
1. **Access Modifiers**: All class properties and methods declare explicit visibility (`public`, `protected`, `private`).
2. **Inheritance & Overrides**: Classes overriding base class methods use the `override` keyword to safeguard contracts.
3. **Immutability**: Constant lookup tables and static registries use `readonly` and strict record types.
4. **No Implicit Any**: Public APIs avoid `any` in favor of generics (`<T = unknown>`) and typed contracts from `@ostro/contracts`.
5. **Contract Binding**: Core managers implement contracts from `@ostro/contracts/router/*`.

---

## 5. Development & Verification Guide
- **Compile / Build**: `npm run build` (runs `rm -rf build && npx tsc -p tsconfig.build.json`)
- **Run Tests**: `npm test` (executes Jest with 100% coverage target via `c8`)
- **Published Artifacts**: Target output compiled to `./build` with accompanying `.d.ts` declarations and source maps.

---
*Generated for Antigravity AI high-speed codebase comprehension with minimal token consumption.*
