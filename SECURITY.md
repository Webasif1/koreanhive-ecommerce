# Security Policy

## Supported Versions

Korean Hive is a continuously deployed web application. Only the version
currently running on [koreanhive.com](https://koreanhive.com), built from the
`main` branch, receives security fixes. Older commits and forks are not
supported.

## Reporting a Vulnerability

**Please do not report security issues through public GitHub issues,
discussions or pull requests.**

Report privately using one of these:

- **GitHub:** open the **Security** tab of this repository and choose
  **Report a vulnerability**
- **Email:** orders@koreanhive.com with `SECURITY` in the subject line

Please include:

- A description of the issue and its potential impact
- Steps to reproduce (URLs, requests, screenshots or a proof of concept)
- Any accounts or order numbers you used for testing (your own only)

### What to expect

- **Acknowledgement** within 3 business days
- **Status update** within 7 days, with our assessment and a planned timeline
- **Notification** when the fix is live, and credit if you would like it

If we decline a report, for example because it is out of scope or cannot be
reproduced, we will tell you why.

## Scope

**In scope:** koreanhive.com, including checkout, customer accounts, order
handling and the admin area, and the code in this repository.

**Out of scope:**

- Denial-of-service or load testing
- Social engineering or phishing of staff or customers
- Spam, or brute-forcing the login and contact forms
- Issues in third-party services (payment providers, hosting, MongoDB Atlas)
  that should be reported to that vendor
- Automated scanner output with no demonstrated impact

## Good-Faith Research

We will not take legal action against researchers who:

- Only access their own accounts and data
- Do not view, change, delete or download other customers' data
- Do not disrupt the site or real orders
- Give us reasonable time to fix the issue before disclosing it publicly
