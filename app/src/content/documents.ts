export { policyVersion } from "../../server/policy";
export type Section = {
  title: string;
  paragraphs: string[];
  items?: string[];
  links?: { label: string; href: string }[];
};
export type Document = {
  title: string;
  eyebrow: string;
  description: string;
  sections: Section[];
};
export const documents: Record<string, Document> = {
  "/about": {
    title: "A little more clarity. A lot more intention.",
    eyebrow: "ABOUT MIRRORTAPE",
    description:
      "MirrorTape is a product of 625 Technologies Inc., built to make personal trading research easier to organize.",
    sections: [
      {
        title: "A workspace for your own thinking",
        paragraphs: [
          "Research can end up scattered across notes, browser tabs, and brokerage screens. MirrorTape brings a research list and a personal plan into one place you can return to. The goal is a clearer process, not another feed telling you what to trade.",
          "Start with the public demo. When you create an account, your private workspace starts separately. You decide what to follow, what to write down, and whether to connect an available account-viewing service.",
        ],
      },
      {
        title: "Built by 625 Technologies Inc.",
        paragraphs: [
          "625 Technologies Inc. operates MirrorTape. We are building for adults in the United States who want a considered place to organize their own research. MirrorTape is software; the current service does not execute trades or provide personalized investment advice.",
        ],
      },
      {
        title: "Our product principles",
        paragraphs: ["Useful software makes its boundaries visible."],
        items: [
          "Show a save confirmation only after the server acknowledges it.",
          "Keep examples, personal research, and brokerage information clearly separated.",
          "Explain unavailable features instead of inventing activity or performance.",
          "Let people explore before requiring an account or payment.",
        ],
      },
      {
        title: "What is available today",
        paragraphs: [
          "The free workspace includes a research watchlist, saved planning preferences, notes, and account access. The demo is an independent practice area. Provider-dependent features become available only when their integrations are enabled. Copy execution and published trader performance are not available.",
        ],
        links: [
          { label: "Explore the product", href: "/how-it-works" },
          { label: "Read our release notes", href: "/changelog" },
          { label: "Contact the team", href: "/contact" },
        ],
      },
    ],
  },
  "/terms": {
    title: "Terms of Service",
    eyebrow: "THE AGREEMENT FOR USING MIRRORTAPE",
    description:
      "Terms for the MirrorTape research workspace, operated by 625 Technologies Inc. Effective September 7, 2026.",
    sections: [
      {
        title: "1. Who provides the service",
        paragraphs: [
          "These Terms govern your use of MirrorTape at mirrortape.net and its related workspace features. The service is operated by 625 Technologies Inc. References to MirrorTape, we, or us in these Terms mean 625 Technologies Inc. By creating an account, you agree to these Terms. If you do not agree, do not create an account or use account-only features.",
        ],
      },
      {
        title: "2. Eligibility and account responsibility",
        paragraphs: [
          "MirrorTape is offered to adults age 18 or older in the United States. Provide accurate account information, keep your sign-in credentials confidential, and use only accounts you are authorized to access. You are responsible for activity you authorize through your account. Report suspected unauthorized access through Contact as soon as you become aware of it.",
          "Do not share passwords, brokerage credentials, private keys, or payment-card details in research notes or support messages. We may restrict access when reasonably necessary to protect accounts, investigate abuse, comply with law, or enforce these Terms.",
        ],
      },
      {
        title: "3. What the workspace does",
        paragraphs: [
          "MirrorTape stores your research watchlist and personal planning information. The public demo contains example symbols and keeps practice changes separate from private accounts. Availability of email, social sign-in, billing, address suggestions, and brokerage viewing depends on the services enabled for your account.",
          "The current workspace does not place orders, copy trades, hold customer funds, guarantee market data, or enforce investment risk limits. Any available brokerage view is read-only. A saved allocation preference is a note about your intention, not an order instruction or a loss-control mechanism.",
        ],
      },
      {
        title: "4. No investment recommendation or guarantee",
        paragraphs: [
          "The workspace and blog provide product information and general educational material. They are not personalized investment, legal, or tax advice and do not recommend that you buy, sell, or hold a security. You make your own decisions and remain responsible for understanding your broker's terms and disclosures. Investments may lose value. Product examples do not represent actual performance or promised results.",
        ],
      },
      {
        title: "5. Acceptable use",
        paragraphs: [
          "Use the service lawfully and respect other people and their information.",
        ],
        items: [
          "Do not attempt to access another person's account or data.",
          "Do not submit malicious code, spam, unlawful material, or content you lack permission to use.",
          "Do not bypass authentication, rate limits, access restrictions, or other protective controls.",
          "Do not overload the service, interfere with its operation, or misrepresent MirrorTape's affiliation or capabilities.",
          "Report suspected vulnerabilities privately through the security contact route before publishing sensitive details.",
        ],
      },
      {
        title: "6. Your content and our software",
        paragraphs: [
          "You retain ownership of the information you submit. You give 625 Technologies Inc. permission to store, process, display, and transmit it as needed to operate the features you request, provide support, and meet legal obligations. You are responsible for ensuring you have the right to submit it.",
          "MirrorTape's software, branding, and original editorial material belong to 625 Technologies Inc. or their respective rights holders. Your account gives you permission to use the service for its intended purpose; it does not transfer ownership of the software or grant permission to impersonate the product.",
        ],
      },
      {
        title: "7. Fees, providers, and cancellation",
        paragraphs: [
          "The research workspace is currently free. A paid feature, if offered, must show its price, billing frequency, and applicable conditions before you authorize payment. Creating a free account does not authorize a charge. The billing and refunds page explains the current availability of paid memberships.",
          "External sign-in, payment, address, and brokerage providers have their own terms and privacy practices. Connecting a provider authorizes only the permissions shown in that provider's consent process. You can revoke permissions through the provider. Removing a MirrorTape connection does not close your brokerage account or cancel orders placed elsewhere.",
        ],
        links: [{ label: "Billing and refunds", href: "/refunds" }],
      },
      {
        title: "8. Availability and keeping a copy",
        paragraphs: [
          "The service may be interrupted by maintenance, failures, network conditions, or provider outages. We do not promise uninterrupted access or error-free operation. Save confirmations indicate that a write was acknowledged; they are not a guarantee against every form of data loss. Keep independent copies of information important to you and use your broker directly for time-sensitive account actions.",
        ],
      },
      {
        title: "9. Ending use and requesting deletion",
        paragraphs: [
          "You may stop using the service at any time. Use the privacy request route to request account closure, access, correction, or deletion. We may need to verify your identity before acting. Closing a MirrorTape account does not close an external provider account. Information subject to a legal, security, or dispute-related retention obligation may be retained as described in the Privacy Notice.",
        ],
      },
      {
        title: "10. Warranties and responsibility",
        paragraphs: [
          "To the extent permitted by applicable law, the service is provided as available without promises of investment results, fitness for a particular trading strategy, or uninterrupted availability. We are not responsible for independent decisions you make using your research, or for a broker's execution of instructions you give that broker.",
          "Nothing in these Terms excludes rights or responsibilities that cannot lawfully be excluded, including applicable consumer protections. Any limitation applies only to the extent permitted by the law that applies to you. These Terms do not impose mandatory arbitration or a waiver of rights that applicable law protects.",
        ],
      },
      {
        title: "11. Changes and contact",
        paragraphs: [
          "We may update these Terms as the service changes. The effective date identifies this version. Material changes will be communicated through the service before they take effect where required; new terms will not silently authorize unrelated use of your information. Contact 625 Technologies Inc. through the contact page with questions about these Terms.",
        ],
        links: [
          {
            label: "Contact 625 Technologies Inc.",
            href: "/contact?topic=General",
          },
          { label: "Privacy Notice", href: "/privacy" },
        ],
      },
    ],
  },
  "/privacy": {
    title: "Privacy Notice",
    eyebrow: "YOUR INFORMATION, EXPLAINED",
    description:
      "How 625 Technologies Inc. handles information in MirrorTape. Effective September 7, 2026.",
    sections: [
      {
        title: "Who is responsible",
        paragraphs: [
          "625 Technologies Inc. operates MirrorTape and is responsible for the information handled through this service. MirrorTape is intended for adults in the United States. This notice describes the current research workspace, public site, and support flow. Use our contact page to reach us about privacy or submit a privacy request.",
        ],
      },
      {
        title: "Information you provide",
        paragraphs: [
          "Account information includes your email address, sign-in method, password hash when you choose a password, and account verification state. We also record acceptance of the account Terms. We do not store your password as readable text.",
          "Workspace information includes symbols you add, planning preferences, optional name and address details, research notes, saved drafts, and interface or activity-sharing choices. Forms with a save indicator can store partial input before you submit the form. Passwords are excluded from draft saving.",
          "Support information includes the email address, message, category if selected, request reference, and handling status. Messages and draft text can contain personal information you choose to include. Do not submit credentials, full payment-card details, government identification numbers, or confidential financial documents through these forms.",
        ],
      },
      {
        title: "Information from connected services",
        paragraphs: [
          "When an enabled social sign-in provider is used, we receive an account identifier and available email information needed to identify your account. We do not automatically merge different accounts solely because their email addresses match.",
          "If you connect an available brokerage-viewing integration, we store the connection information and encrypted authorization token needed to retrieve the permitted account view. Paper and live connections are separate. If paid billing is enabled and you choose it, Stripe processes checkout details; MirrorTape stores billing identifiers and subscription state rather than your full card number. Optional address suggestions send the text needed for a search to the configured provider after you enable that interaction.",
        ],
      },
      {
        title: "Technical information and browser storage",
        paragraphs: [
          "Our hosting and delivery services process IP addresses, request details, device or browser information available in network requests, and security diagnostics. The application uses an IP-derived identifier for rate limiting. Operational logs help diagnose errors and abuse. Cloudflare provides delivery and network security and may process network reports and challenge information.",
          "MirrorTape uses session cookies and browser storage for sign-in, the requested demo, display choices, and dismissible interface guidance. The demo is stored in your browser tab rather than copied into a private account. The current site does not include advertising pixels or optional marketing analytics scripts.",
        ],
        links: [
          { label: "Cookie and browser-storage details", href: "/cookies" },
        ],
      },
      {
        title: "Why we use this information",
        paragraphs: [
          "We use information to provide requested features, save and retrieve your work, authenticate accounts, manage provider connections, process requests, communicate about your account when delivery is available, protect the service, diagnose failures, and comply with applicable law. We do not use your private notes to present fictional trader performance or customer testimonials.",
        ],
      },
      {
        title: "When information is shared",
        paragraphs: [
          "Information is processed by infrastructure providers that host, secure, and deliver the service. Enabled providers process the information necessary for the feature you choose, such as sign-in or checkout. We may disclose information when required by law, to protect rights and account security, or as part of a business transaction with appropriate protections.",
          "We do not sell personal information or share it for cross-context behavioral advertising. We do not make your private watchlist or notes public. If you opt in to community activity sharing, an activity record may contribute to a short-lived rounded aggregate shown only above a minimum threshold; it does not publish your name, email, or research symbols. You can turn that choice off in your workspace.",
        ],
      },
      {
        title: "Retention and deletion",
        paragraphs: [
          "Workspace and account data remain in the service while needed to provide your account or handle a request. There is no automatic promise that inactive accounts or support cases disappear after a fixed number of days. Ask us to review or delete information through the privacy request route.",
          "Application sessions expire after seven days; short-lived social sign-in state expires after ten minutes. Rate-limit records are removed by maintenance after their cleanup interval. Infrastructure logs rotate by size, and backup copies may remain after data is removed from the active database. Backup and legal or security retention can delay removal from every copy. We will explain applicable limits when handling your request rather than promise immediate erasure everywhere.",
        ],
      },
      {
        title: "Your choices and requests",
        paragraphs: [
          "You can update workspace fields, remove research symbols, change display preferences, stop optional activity sharing, and revoke external permissions. You can request access, correction, account closure, or deletion through Contact by choosing Privacy. You can use this route without being able to sign in. We verify identity and authority before disclosing account information or making sensitive changes.",
          "Depending on your state of residence and whether a particular law applies, you may have additional rights to know, obtain a copy, correct, delete, opt out of certain processing, appeal a decision, or act through an authorized agent. We do not penalize people for exercising applicable privacy rights. Tell us your state and the request you want to make; avoid sending identity documents in the initial message. Because we do not sell information or use cross-context advertising, there is no such activity for a browser opt-out signal to disable in the current product.",
        ],
        links: [
          { label: "Submit a privacy request", href: "/contact?topic=Privacy" },
        ],
      },
      {
        title: "Security and external services",
        paragraphs: [
          "We use encrypted transport, access checks, password hashing, restricted secret access, and encryption for stored provider authorization tokens. No system can promise absolute security. External providers and linked sites follow their own practices. Cloudflare and other providers may process information outside your state or the United States as part of operating their networks.",
        ],
      },
      {
        title: "Children",
        paragraphs: [
          "MirrorTape accounts are for adults age 18 or older. We do not knowingly seek personal information from children under 13. If you believe a child supplied personal information, contact us through the privacy route so we can investigate and address it.",
        ],
      },
      {
        title: "Updates and contact",
        paragraphs: [
          "We will update this notice when the service's practices change and identify the new effective date. Material changes will be communicated as required. Contact 625 Technologies Inc. through the privacy request form with questions about this notice or how your information is handled.",
        ],
        links: [
          { label: "Contact about privacy", href: "/contact?topic=Privacy" },
          { label: "Our security practices", href: "/security" },
        ],
      },
    ],
  },
  "/cookies": {
    title: "Cookies & browser storage",
    eyebrow: "SMALL FILES. CLEAR PURPOSES.",
    description:
      "What MirrorTape stores in your browser, why it is used, and how you can control it.",
    sections: [
      {
        title: "A functional site, without advertising pixels",
        paragraphs: [
          "The current MirrorTape site uses browser storage for requested features and interface preferences. It does not run advertising pixels or optional marketing analytics scripts. There is no advertising-consent switch that secretly enables tracking. This page covers cookies and similar storage, including local storage and session storage.",
        ],
      },
      {
        title: "Sign-in and security cookies",
        paragraphs: [
          "The __Host-mirrortape cookie identifies an application session and expires after seven days. It is Secure and HttpOnly, so it is sent over HTTPS and is not readable by page scripts. It is created when you open a feature that needs a session, such as signup or your workspace.",
          "The __Host-mirrortape-oauth cookie binds an enabled social sign-in attempt to your browser. It lasts up to ten minutes and is cleared when the callback finishes. Cloudflare may use its own security cookies when applying a network challenge. External providers can set their own cookies when you visit them to sign in or use another service.",
        ],
      },
      {
        title: "Preferences and demo storage",
        paragraphs: [
          "mirrortape-theme in local storage remembers light, dark, or system appearance until you change it or clear it. mirrortape-demo in session storage holds the example watchlist and practice note for the current browser tab. mirrortape-exit-dismissed remembers that you closed the exit invitation in that session. Browser behavior can preserve session storage when restoring a tab.",
          "These keys do not contain brokerage credentials. The demo is practice data; its storage is not a cloud backup and is not transferred into a private account.",
        ],
      },
      {
        title: "Manage your choices",
        paragraphs: [
          "Use the theme selector to change appearance. Use browser site settings to view or clear MirrorTape storage. Clearing cookies can sign you out; clearing session storage can remove the demo note and dismissal choice. Save anything you want to keep first. Clearing browser storage does not delete information already saved to your account on the server.",
          "Optional community activity sharing is a separate account preference, initially off, controlled inside the workspace. Turning it off removes your activity record from the active aggregate. For account information or a deletion request, use the privacy contact route.",
        ],
        links: [
          { label: "Open your workspace preferences", href: "/app" },
          {
            label: "Request account-data help",
            href: "/contact?topic=Privacy",
          },
        ],
      },
      {
        title: "Related information",
        paragraphs: [
          "625 Technologies Inc. operates MirrorTape. Read the Privacy Notice for information about network data, service providers, retention, and privacy requests. This inventory was reviewed on September 7, 2026.",
        ],
        links: [{ label: "Read the Privacy Notice", href: "/privacy" }],
      },
    ],
  },
  "/accessibility": {
    title: "Accessibility at MirrorTape",
    eyebrow: "A WORKSPACE MORE PEOPLE CAN USE",
    description:
      "Our accessibility approach, supported interactions, known limits, and a way to report barriers.",
    sections: [
      {
        title: "Our approach",
        paragraphs: [
          "625 Technologies Inc. aims to make MirrorTape usable with keyboards, assistive technology, magnification, and different display preferences. We use WCAG 2.2 Level AA as a design and testing target. This statement is not a claim of complete conformance or independent certification.",
        ],
      },
      {
        title: "Features you can use",
        paragraphs: [
          "Pages include semantic headings, labeled controls, a skip-to-content link, visible focus states, and responsive layouts. The theme control offers light, dark, and system modes. Reduced-motion preferences limit decorative motion. The exit invitation can be dismissed with Escape and is not triggered by mobile back navigation.",
          "Saving, loading, validation, and recovery states use visible text and accessible status messages. Signup provides password visibility controls. Use Tab and Shift+Tab to move through controls and Enter or Space where supported to activate them.",
        ],
      },
      {
        title: "Testing and known limits",
        paragraphs: [
          "We test representative desktop and mobile views in Chromium and use automated accessibility checks alongside keyboard and visual review. Automated checks cannot establish full accessibility. Comprehensive testing across screen readers, voice-control tools, browser combinations, and every user workflow has not been completed.",
          "External sign-in, brokerage, or checkout pages are operated by their respective providers. Their interfaces may behave differently. Time-sensitive watchlist undo has a five-second window; after it expires, you can add the same symbol again. If any interaction creates a barrier, tell us which page and task were affected.",
        ],
      },
      {
        title: "Report a barrier or request another format",
        paragraphs: [
          "Use Contact and select Accessibility. Include the page address, what you were trying to do, the problem you encountered, and any browser or assistive technology details you are comfortable sharing. You may ask for information in another format. Do not include passwords or private account data in your initial report. The form returns a reference when the request is stored.",
        ],
        links: [
          {
            label: "Send accessibility feedback",
            href: "/contact?topic=Accessibility",
          },
          { label: "WCAG 2.2 standard", href: "https://www.w3.org/TR/WCAG22/" },
        ],
      },
      {
        title: "Statement review",
        paragraphs: [
          "This statement was reviewed on September 7, 2026 and applies to the current MirrorTape website and research workspace. We update it as the product and verification coverage change.",
        ],
      },
    ],
  },
  "/security": {
    title: "Trust begins with clear boundaries.",
    eyebrow: "SECURITY & TRUST",
    description:
      "How MirrorTape protects account access and keeps product capabilities transparent.",
    sections: [
      {
        title: "Account protection",
        paragraphs: [
          "The application uses HTTPS, server-side session validation, hashed passwords, input validation, request limits, and CSRF protection for browser changes. Stored provider authorization tokens are encrypted. Social identities are bound to provider account identifiers; matching email addresses do not silently merge accounts.",
          "These controls reduce specific risks. They do not constitute a security certification or a guarantee against every incident. Use a unique password, keep access to your email secure, and sign out on shared devices.",
        ],
      },
      {
        title: "A clear boundary around the demo",
        paragraphs: [
          "The demo uses example symbols and tab-local practice data. It does not display customer balances or execute trades. Private workspace routes require authentication, and private API reads are checked on the server. A connected brokerage view, when available, remains separate from example content.",
        ],
      },
      {
        title: "Providers and availability",
        paragraphs: [
          "Cloudflare delivers and protects the site. Optional account sign-in and other integrations have their own authorization steps. A feature being listed in documentation does not mean it is enabled: check the service-status page for current availability. No uptime percentage or certification is implied by a successful health check.",
        ],
        links: [
          { label: "Check current service availability", href: "/status" },
          { label: "How data is handled", href: "/privacy" },
        ],
      },
      {
        title: "Report a suspected vulnerability",
        paragraphs: [
          "Use Contact and select Security. Start with the affected URL, a concise description, and a safe reproduction using an account you own. Do not include stolen data, live credentials, or exploit payloads in the initial report. We can establish a suitable follow-up channel after reviewing it.",
          "Do not access other people's information, disrupt service, or conduct destructive tests. This reporting route does not authorize intrusive testing, establish a bounty program, or promise a reward. Keep sensitive findings private while we assess them.",
        ],
        links: [
          {
            label: "Report a security concern",
            href: "/contact?topic=Security",
          },
        ],
      },
    ],
  },
  "/refunds": {
    title: "Billing, cancellation & refunds",
    eyebrow: "NO SURPRISE COMMITMENTS",
    description:
      "How free access and any separately authorized paid membership are handled.",
    sections: [
      {
        title: "The free workspace",
        paragraphs: [
          "The current research workspace is free to use. You do not need to supply a payment card to create an account or explore the demo. Paid subscriptions are available only if the pricing page explicitly presents an enabled offer. There is no payment to refund for use of the free workspace.",
        ],
      },
      {
        title: "Before any future payment",
        paragraphs: [
          "An enabled paid offer must display its price, billing interval, and applicable conditions before you authorize it through Stripe. Do not assume that registering for a free account starts a trial that later becomes paid. Use the pricing page and checkout terms for the offer actually presented to you.",
        ],
      },
      {
        title: "Manage a subscription",
        paragraphs: [
          "If you have an active MirrorTape subscription, the account billing section provides access to the Stripe customer portal when billing is available. Review the portal's confirmation and effective date for cancellation. Signing out, disconnecting a brokerage, or clearing browser storage does not cancel a subscription.",
        ],
      },
      {
        title: "A charge you do not recognize",
        paragraphs: [
          "Use Contact and select Billing. Include the charge date, amount, and the email used for the account. Do not send a complete card number or security code. Refund eligibility depends on the terms shown for the purchase, the circumstances of the request, and applicable law; this page does not promise an unconditional refund or limit non-waivable rights.",
          "Brokerage commissions, investment losses, and fees charged by another company must be addressed with that provider. MirrorTape does not hold brokerage funds or reverse orders you place directly with a broker.",
        ],
        links: [
          { label: "Get billing help", href: "/contact?topic=Billing" },
          { label: "View current pricing", href: "/pricing" },
        ],
      },
    ],
  },
  "/changelog": {
    title: "What’s new on the tape.",
    eyebrow: "RELEASE NOTES",
    description:
      "Published product changes, with a clear distinction between available features and external dependencies.",
    sections: [
      {
        title: "September 7, 2026 · A more complete public site",
        paragraphs: [
          "Company information, Terms, Privacy, accessibility, cookies, security, billing guidance, a contact route, and the MirrorTape Journal are now part of the site. Public articles have readable URLs, individual metadata, and a feed. The service-status page reports current checks and enabled capabilities rather than an invented uptime history.",
        ],
      },
      {
        title: "September 7, 2026 · Accounts and a separate demo",
        paragraphs: [
          "Email/password signup and returning-client login open a private dashboard. The public demo keeps its practice data separate. Social sign-in integrations are implemented and remain dependent on provider configuration. Public signup calls to action, clearer form guidance, and an optional desktop exit invitation help visitors find their next step.",
        ],
      },
      {
        title: "September 6, 2026 · Research workspace foundation",
        paragraphs: [
          "The workspace introduced a saved research watchlist and personal plan, server-confirmed autosave, five-second undo, theme controls, support intake, and request-protection controls. Provider-dependent payment and brokerage features are explicitly gated; copy execution is not part of this release.",
        ],
      },
      {
        title: "Follow actual releases",
        paragraphs: [
          "Release notes describe shipped changes. They are not a promise of a future delivery date or of investment performance. Use the status page to check availability and Contact to report a problem.",
        ],
        links: [
          { label: "Service status", href: "/status" },
          { label: "Send product feedback", href: "/contact" },
        ],
      },
    ],
  },
};
