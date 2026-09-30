# `burnandbuilddiet.com` → `thehardkordiet.com` (external)

**Intended behavior:** permanent redirect (301) from the legacy marketing domain to the same path on **https://thehardkordiet.com**.

## Controlled in this repository

| Item | Role |
|------|------|
| **`CNAME`** | GitHub Pages custom domain = **`thehardkordiet.com`** only |
| **`server/creatorSiteOrigin.js`**, **`js/apiConfig.js`**, CORS | Legacy host allowed; checkout/email **page links** map to `thehardkordiet.com` |
| **`docs/DOMAINS.md`** | Canonical site = thehardkordiet.com |

This repo **does not** configure DNS for `burnandbuilddiet.com`.

## Must be configured outside the repo

1. **DNS** at the registrar for `burnandbuilddiet.com` (and `www`) — point to your redirect provider or hosting that issues **301** to `https://thehardkordiet.com$request_uri`.
2. **GitHub Pages** — if legacy domain was a second custom domain on the same repo, remove or repoint it after 301 is live elsewhere.
3. **Email (SPF/DKIM)** — configure **`kory@`** and **`orders@`** on **`@thehardkordiet.com`** in iCloud/Resend; redirects do not migrate mail.

## Verify after DNS change

```bash
curl -sI https://burnandbuilddiet.com/ | head -5
curl -sI https://burnandbuilddiet.com/createyourfoodplan/ | head -5
```

Expect **`Location: https://thehardkordiet.com/...`** with status **301** or **308**.
