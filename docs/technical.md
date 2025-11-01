# Technical Details

This document covers important technical configurations for the Upstander application.

## Email Notification Service

*   **Provider:** [Resend](https://resend.com/)

Email notifications are sent via Resend, triggered by a Firebase Cloud Function. For the emails to be sent successfully, the function requires a `RESEND_API_KEY` to be set in the Firebase environment variables.

### Setting the API Key

Use the Firebase CLI to set the API key:
```bash
firebase functions:config:set resend.api_key="YOUR_API_KEY" --project <your-project-id>
```

After setting the key, you must redeploy the functions for the change to take effect:
```bash
firebase deploy --only functions --project <your-project-id>
```

## DNS Configuration for Email Deliverability

To ensure that emails sent from `upstander.help` do not end up in spam folders, the following DNS records must be configured in the domain's DNS provider (e.g., Vercel).

### SPF Record

*   **Type:** `TXT`
*   **Name/Host:** `@`
*   **Value:** `v=spf1 include:amazonses.com ~all`

### DKIM Records

*   **Type:** `CNAME`
*   **Name/Host:** `_amazonses.upstander.help`
*   **Value:** `_amazonses.amazonses.com`

---

*   **Type:** `CNAME`
*   **Name/Host:** `_domainkey.upstander.help`
*   **Value:** `_domainkey.amazonses.com`

These records authorize Resend to send emails on behalf of your domain, significantly improving their reliability.
