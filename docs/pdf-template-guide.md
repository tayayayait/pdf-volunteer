# PDF Template Guide

How the pledge PDF is generated from a template.

## Template Files

Place template files here by default:

```txt
storage/templates/pledge/
  pledge-template.pdf
  pdf-field-map.json
```

Set `PLEDGE_TEMPLATE_DIR` to use a different directory.

## Required Fields

The field map must include the fields needed by the current scope:

- `pledgeDate`
- `donorName`
- `donorType`
- `contact`
- `address`
- `donationAmount`
- `donationPurpose`
- `paymentMethod`
- `signaturePng`

## Pending Template Fields

These fields may remain in `pdf-field-map.json` because the current sample template contains them. The current form does not show them until the original HWP confirms they are required.

- `birthOrBusinessNo`
- `email`
- `postalCode`
- `paymentType`
- `pledgeStartDate`
- `recurringMonths`
- `withdrawalDay`
- `bankName`
- `accountNumber`
- `accountHolder`
- `privacyConsent`
- `receiptConsent`

If these fields are absent from a future original template, the field map can omit them.

## Field Box Format

Coordinates use PDF points with the PDF lower-left origin.

```json
{
  "template": "pledge-template.pdf",
  "pageSize": "A4",
  "fields": {
    "donorName": {
      "page": 1,
      "x": 220,
      "y": 626,
      "width": 154,
      "height": 20,
      "fontSize": 9.5,
      "align": "left"
    },
    "signaturePng": {
      "page": 1,
      "x": 392,
      "y": 70,
      "width": 151,
      "height": 54,
      "fit": "contain"
    }
  }
}
```

## Validation Errors

| Code | Meaning |
|---|---|
| `PDF_TEMPLATE_NOT_FOUND` | The template PDF is missing |
| `PDF_FIELD_MAP_NOT_FOUND` | `pdf-field-map.json` is missing |
| `PDF_FIELD_MAP_INVALID` | Required fields or coordinate boxes are invalid |
| `PDF_FIELD_OVERFLOW` | Text does not fit in the mapped field box |

## Related Docs

- [Operations](./operations.md)
- [Implementation Scope](./implementation-status.md)
