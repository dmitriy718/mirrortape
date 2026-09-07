# Company, policy and publishing surfaces

MirrorTape is a product of **625 Technologies Inc.**, intended for US adults aged 18 and older. This operator and market were supplied by the owner. No street address, incorporation state, public support email or attorney approval was supplied; the site does not invent them.

## Published routes

- Company: `/about`, `/contact`, `/status`, `/changelog`.
- Policies: `/terms`, `/privacy`, `/cookies`, `/accessibility`, `/security`, `/refunds`; the existing `/risk` explains financial/product boundaries.
- Journal: `/blog` with text search and category filters, four complete original articles, individual permanent URLs and `/feed.xml`.
- Existing product, help, pricing and demo routes remain separate from `/app` account routes.

Content lives in `app/src/content/documents.ts` and `posts.ts`. Route metadata lives in `catalog.ts`. The build renders 23 complete public HTML pages, their canonical/description/social tags and `/sitemap.xml`. Account pages have `noindex` and `no-store`; unknown routes return HTTP 404. Internal rendering files and the manifest cannot be fetched as public documents. The security policy continues to prohibit inline scripts. The social image is a locally authored SVG and its PNG export.

`npm run build` explicitly uses production mode for frontend and server rendering even when a developer's local environment is configured for development. Build steps fail if a published page is incomplete. The runtime requires the built manifest and pages; an absent artifact prevents startup rather than silently serving a blank shell.

## Requests and agreement evidence

The public contact form uses the existing session-authenticated, CSRF-protected API and persisted draft infrastructure. Topic, email and message save before submission. A UUID request reference persists with the draft; retrying a request with the same owner and content returns the original case, including after the original response was lost. Changed content or a different owner cannot reuse that reference. A support-specific sliding limit supplements the general endpoint limiter and honeypot. Case receipt does not imply an email was sent or a staffed response deadline.

Authorized operators currently review requests through the `support_cases` database table using restricted infrastructure access. There is no public support administration endpoint. Launch operations still need designated case ownership, monitoring, identity verification and a process to fulfill applicable privacy requests. Do not export customer messages into public logs or commit them.

Password signup now requires `acceptedTerms: "2026-09-07"` and `adult: true`; successful creation records the version in `audit_events` in the same transaction. Social signup binds that agreement to the exact OAuth state hash; an existing login or explicit provider link remains distinct from creating a new account. New identities without that agreement return to signup. The signup checkbox refers to agreement with Terms and reading the Privacy Notice, not blanket consent to all processing or marketing. Increment `server/policy.ts` deliberately when agreement terms change; existing-customer notice/reacceptance requires its own release decision.

## Evidence and limits

The status page checks the application's actual database readiness and feature configuration. Provider availability means enabled here, not independently verified third-party health or historical uptime. Current policies explicitly distinguish sample demo data, private saved data and unavailable trading functionality. No fake testimonials, financial returns, editorial authors, scarcity or paid checkout are introduced.

The policies describe the current implementation. They are not legal advice, an attorney-reviewed launch approval, an accessibility certification, or evidence that every state law applies. Before mass marketing, the operator must review applicable obligations, retention/backup schedules, rights-request handling, company contact details, payment terms if billing is enabled, and actual provider disclosures. SMTP/social/billing/brokerage activation still requires configuration and live-provider testing.

## Reference material reviewed

The wording is original and grounded in application behavior. These sources informed the review; they do not certify this site:

- [FTC consumer privacy guidance](https://www.ftc.gov/business-guidance/privacy-security/consumer-privacy): public privacy promises must match actual handling.
- [California Attorney General CCPA overview](https://oag.ca.gov/privacy/ccpa): state rights and business applicability require qualification.
- [W3C accessibility statements](https://www.w3.org/WAI/planning/statements/): describe goals, known limitations and a feedback channel.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): accessibility target and automated/keyboard checks; automated results alone do not establish conformance.
- [FTC CAN-SPAM business guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business): no newsletter collection or outbound marketing campaign was added without a delivery and compliance process.

## Release compatibility

Deploy compatibility commit `e3940c5` before the public-site release. It ignores unknown optional fields when reading a stored draft while retaining strict validation for API writes. This lets that retained release read research drafts after the contact form adds topic/reference metadata. Rolling back further to `5cc0983` is not supported after new drafts have been saved. During a rollback to the compatibility release, a subsequent edit in its older UI may discard the new optional contact metadata; stored support cases and research fields remain separate and intact. No database schema alteration is needed for this increment.
