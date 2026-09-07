# Public conversion flow — September 7, 2026

The public site has seven distinct page-specific signup CTAs, including one on each of Home, How it works, Pricing, Risk and FAQ. Logged-in users see dashboard navigation and do not receive these signup blocks. The desktop exit-intent invitation waits at least 15 seconds, activates only when the pointer leaves the top of the document, is dismissible with Escape, and is capped to once per browser session. It does not block browser navigation. Mobile does not pretend that desktop exit intent can be detected.

Three additional implemented improvements:

1. **Try before registering.** The interactive `/demo` requires no account, clearly separates practice data from private data, and offers a direct route to signup. Baymard finds forced account creation creates friction in checkout; applying the same principle to a SaaS demo is an inference, not a measured conversion result for MirrorTape. [Baymard checkout research](https://baymard.com/blog/current-state-of-checkout-ux).
2. **Reduce form uncertainty.** Signup requires only email and password, labels both required fields, states the password rule, and provides an accessible show/hide control. Optional profile details remain outside signup. [Baymard's required/optional field research](https://baymard.com/blog/required-optional-form-fields), [NN/G form guidance](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/).
3. **Progressive onboarding.** An expandable checklist leads with a research symbol and personal note, then email verification; advanced account connections stay optional and separate. The demo also has a short three-step product tour. [NN/G progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

No conversion uplift percentage, customer count, testimonial, portfolio value, or scarcity claim is fabricated. These are research-informed hypotheses. Establish a consent-appropriate measurement plan and compare completion rates before claiming commercial impact. The change does not introduce behavioral advertising or third-party analytics tracking.
