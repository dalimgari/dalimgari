# Global Input Methods

This directory is the single UI registry for the project's global auto input system.

Each method has its own file. Every method exposes a configuration object and a renderer component. The registry in `index.js` maps the selector result to the correct renderer.

## Contract

- `method`: selector method key.
- `control`: UI control family.
- `supports`: supported renderer properties/capabilities.
- renderer receives the shared field props: `label`, `value`, `on_change`, `placeholder`, `disabled`, `required` and method-specific props.
- media/image/file fields route directly to `global_media_uploader`; no separate input wrapper is used.
- system/read-only fields are rendered as non-editable controls.

## Methods

text, textarea, rich_text, email, phone, url, slug, media_uploader, number, date, datetime, switch, select, multi_select, relation, json, system.

Do not add per-form input implementations when a method can be represented by this registry. Add or extend a method here, then let the global auto input route to it.
