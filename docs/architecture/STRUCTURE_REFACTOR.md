# Structure Refactor

## Branch
refactor/structure

## Scope
This refactor is based on the actual repository tree at the branch starting point. The repository currently contains parallel architectural layers under `src/component`, `src/module`, `src/page`, `src/service`, `src/style`, and `src/utility`, alongside `src/controller`, `src/core`, `src/function`, and `src/layout`.

## Target direction
- Keep `src/core` as framework/domain infrastructure.
- Keep `src/controller` for orchestration/controllers.
- Keep `src/function` for application functions/use-cases.
- Keep `src/layout` for page layouts.
- Rename generic UI directories to consistent plural names: `component -> components`, `page -> pages`, `service -> services`, `style -> styles`.
- Consolidate form input components under `src/components/forms/inputs`.
- Consolidate automatic field resolution under `src/components/forms/AutoField`.
- Move the global input selector to `src/lib/helpers/global_input_selector.js`.
- Replace ambiguous `module` grouping with feature-oriented `src/features` only after import/dependency verification.

## Safety
No existing files are deleted in this phase. Production/default `main` is untouched. Structural moves must be accompanied by import/reference updates and build verification before merge.
