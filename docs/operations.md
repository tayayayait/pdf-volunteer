# Operations

How to run the electronic pledge PDF generator.

## Configuration

Required files:

```txt
storage/templates/pledge/pledge-template.pdf
storage/templates/pledge/pdf-field-map.json
public/fonts/NanumGothic-Regular.ttf
public/fonts/NanumGothic-Bold.ttf
```

Optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PLEDGE_TEMPLATE_DIR` | `storage/templates/pledge` | PDF template and field map directory |
| `PLEDGE_OUTPUT_DIR` | `storage/pledges` | Generated PDF storage directory |
| `VITE_ORGANIZATION_NAME` or `ORGANIZATION_NAME` | `샘플대학교` | Header organization name |

## Vercel Deployment

Use `pnpm-lock.yaml` as the package-manager source of truth.

Recommended Vercel settings:

| Setting | Value |
|---|---|
| Install command | `pnpm install` |
| Build command | `npm run build` |
| Framework preset | Other |

The Vite/Nitro config pins the production target to `vercel`.

`pnpm-workspace.yaml` allows the `esbuild` dependency build script. Without this
entry, Vercel install fails with `ERR_PNPM_IGNORED_BUILDS`.

## Storage

Generated PDFs are stored under `PLEDGE_OUTPUT_DIR`:

```txt
storage/pledges/
  .index/
    {submissionId}.json
  YYYY/
    MM/
      YYYYMMDD_기부자명_금액.pdf
```

The `.index` directory maps a submission ID to the generated PDF path. Do not expose `storage/pledges` as a static public directory. PDF downloads should go through `/api/pledges/:id/pdf`.

## Backup

Back up these directories:

- `storage/pledges`
- `storage/templates/pledge`
- `public/fonts`

## Sensitive Data

Do not log these values:

- signature PNG data URLs
- full account numbers if a future template re-enables account fields
- raw request bodies containing donor information

## Related Docs

- [PDF Template Guide](./pdf-template-guide.md)
- [Implementation Scope](./implementation-status.md)
