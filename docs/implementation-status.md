# Implementation Scope

Reference for what the current application implements.

## Current Scope

The application implements only the electronic pledge workflow:

1. Enter pledge information on a tablet-oriented form.
2. Capture a transparent PNG signature.
3. Generate a PDF from `pledge-template.pdf` and `pdf-field-map.json`.
4. Save the PDF under `storage/pledges/YYYY/MM/`.
5. Show a completion screen with the generated file name and download link.

The active PDF template displays only confirmed input fields. Pending sample-template fields are kept as code defaults but are not shown in the PDF until the original HWP confirms they are required.

## Removed Scope

These features are intentionally not part of the current application:

- administrator login
- administrator pledge list, detail, search, memo, and download screens
- Supabase Auth, Database, and Storage
- PWA service worker and offline cache
- IndexedDB draft autosave and recovery
- shadcn/Radix UI component bundle

## Pending Template Fields

The code keeps defaults for sample-template fields that are not in the current 2-1 user requirement. They are not shown in the form.

- birth or business number
- email
- postal code
- payment type
- recurring payment schedule
- CMS withdrawal day
- bank and account details
- privacy consent
- receipt request

Confirm the original HWP before re-enabling any pending field.

## Related Docs

- [Operations](./operations.md)
- [PDF Template Guide](./pdf-template-guide.md)
