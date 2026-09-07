import type { Section } from "./documents";
export type Post = {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  sections: Section[];
};
export const posts: Post[] = [
  {
    slug: "a-watchlist-with-a-purpose",
    title: "Build a watchlist you can explain.",
    category: "Research habits",
    description:
      "Turn a collection of symbols into a research list with a reason for every entry.",
    date: "2026-09-07",
    sections: [
      {
        title: "Start with a question",
        paragraphs: [
          "A symbol is easy to add. A useful research question takes a little more thought. Before putting an item on your list, write down what you want to understand about it. That question gives your next review a purpose and makes it easier to notice when an item no longer belongs.",
          "The question does not have to be complicated. You might want to understand what a company sells, which documents you still need to read, or why two sources describe the same event differently. Keep the question separate from a decision about whether to invest.",
        ],
      },
      {
        title: "Keep the list small enough to revisit",
        paragraphs: [
          "MirrorTape supports up to 50 research symbols, but the limit is not a target. Begin with a list you can review without rushing. A shorter list with clear questions is easier to maintain than a long collection of items added in passing.",
          "Use your personal note to record why you added something and what would make you revisit it. When a question is answered or no longer relevant, remove the symbol. Removing an item from this list does not sell a position or change a brokerage account.",
        ],
      },
      {
        title: "Separate what you know from what you expect",
        paragraphs: [
          "A source, a date, and your interpretation are different things. Recording them separately makes an old note easier to understand. If you return weeks later, you should be able to tell which statement came from a document and which part was your own open question.",
          "Do not treat a watchlist as evidence that a security is suitable for you. It is an organizational tool. MirrorTape does not score the quality of your research or convert a symbol into an order.",
        ],
        items: [
          "Name the question you are researching.",
          "Record the source and the date you reviewed it.",
          "Identify what remains uncertain.",
          "Choose when or why you will review the note again.",
        ],
      },
      {
        title: "Try the routine before making it yours",
        paragraphs: [
          "Open the demo, add a symbol, and write a short research question in the practice note. Remove it again to see how the interface feels. Demo symbols are examples, not recommendations, and the note stays in that browser tab.",
          "When you are ready to keep your own research, create an account. Your private watchlist starts separately, so practice entries do not quietly become part of your account.",
        ],
        links: [
          { label: "Try the demo", href: "/demo" },
          { label: "Create a private workspace", href: "/app/register" },
        ],
      },
    ],
  },
  {
    slug: "what-saved-actually-means",
    title: "What “saved” actually means.",
    category: "Product guides",
    description:
      "Understand server confirmations, interrupted connections, and safe recovery when a draft needs attention.",
    date: "2026-09-07",
    sections: [
      {
        title: "Typing and saving are separate events",
        paragraphs: [
          "When you edit your private workspace, the screen can show your new text before the server has received it. MirrorTape waits briefly after an edit, sends the draft, and changes the save indicator only after the server acknowledges the write. The timestamp belongs to that acknowledgement, not simply to your last keystroke.",
          "This distinction matters on an unreliable connection. Text can be visible while a save is still pending. The interface should help you recognize the difference instead of presenting every local change as safely stored.",
        ],
      },
      {
        title: "When your connection is interrupted",
        paragraphs: [
          "Keep the page open if you see a failed-save message. Check the connection and use Retry save. Your current draft remains available on that page while you attempt recovery. Closing the tab or clearing site data can remove work that never reached the server.",
          "For text you cannot afford to lose, keep an independent copy. Autosave is a useful convenience, but it is not a promise that a device failure, account problem, or infrastructure incident can never affect your information.",
        ],
      },
      {
        title: "When two tabs disagree",
        paragraphs: [
          "Two browser tabs can start from the same saved draft and then change it differently. MirrorTape tracks a revision so an older write does not silently replace a newer one. If another tab has already changed the draft, you may need to load the saved version before continuing.",
          "Before loading that version, preserve any unsaved text you want to keep. Compare the two versions deliberately. A conflict warning is information about competing edits, not proof that every edit was retained automatically.",
        ],
      },
      {
        title: "Use the right expectation for the right screen",
        paragraphs: [
          "Private workspace drafts are stored on the application server. The public demo is different: it uses browser-tab storage for practice. A demo note is not a cloud backup and does not become private account data after signup.",
          "Passwords are not saved as drafts. Account and contact forms label the information they use, and the Privacy Notice describes partial-input saving. If a save problem persists, send the affected page and a description through Contact, without including sensitive note contents.",
        ],
        links: [
          { label: "Get help with saving", href: "/contact?topic=Account" },
          { label: "Read the Privacy Notice", href: "/privacy" },
        ],
      },
    ],
  },
  {
    slug: "demo-and-private-workspace",
    title: "A demo should stay a demo.",
    category: "Product guides",
    description:
      "Why MirrorTape separates practice content from your private research, and what changes when you sign up.",
    date: "2026-09-07",
    sections: [
      {
        title: "Explore without borrowing someone else's account",
        paragraphs: [
          "A useful product demo lets you try an interaction without exposing customer information. MirrorTape's public demo starts with clearly labeled example symbols. It does not show a real person's balances, positions, or trading results, and it does not connect to a brokerage.",
          "The purpose is to explore how a list and a note fit your workflow. You can add or remove a symbol and write a practice note. Those actions demonstrate the interface; they do not represent an investment recommendation or an executed trade.",
        ],
      },
      {
        title: "Practice information has a different lifetime",
        paragraphs: [
          "Demo edits are held in session storage for the browser tab. Browser restoration features can keep that storage longer than you expect, while clearing site data can remove it. Treat it as a practice area rather than a record you depend on.",
          "Because the demo stays local to the tab, opening it does not import practice entries into your private account. On a shared device, clear practice text that you do not want the next person to see. Avoid putting confidential information into a demo in the first place.",
        ],
      },
      {
        title: "An account changes the storage boundary",
        paragraphs: [
          "After signup, the private dashboard uses an authenticated session and stores your research on the application server. The watchlist and planning draft start independently of the example content. Returning clients use their own sign-in method to retrieve their own saved work.",
          "The private route is protected on the server as well as in the interface. Changing a browser address does not authorize access to private watchlist or brokerage APIs. Signing out ends access through that session.",
        ],
      },
      {
        title: "Keep the distinction visible",
        paragraphs: [
          "Look for the demo label when practicing and the private-dashboard label when working in your account. If you are unsure which view you are in, use the main navigation to return to a known starting point. A clear label is more useful than making a practice screen look like a funded account.",
          "The same principle applies to provider features. A configured account-viewing connection is separate from a demo, and an unavailable integration should say so. MirrorTape does not fill a missing connection with invented balances.",
        ],
        links: [
          { label: "Explore the separate demo", href: "/demo" },
          { label: "Sign in to your own account", href: "/app/login" },
        ],
      },
    ],
  },
  {
    slug: "a-weekly-workspace-review",
    title: "Give your research a weekly reset.",
    category: "Research habits",
    description:
      "A short review routine for stale symbols, unfinished questions, saved notes, and account access.",
    date: "2026-09-07",
    sections: [
      {
        title: "Review the process, not just the list",
        paragraphs: [
          "A workspace becomes easier to use when it reflects what you are actually researching. Set aside a recurring moment to look at the list, the note, and any unanswered questions. This is an organizational habit, not a strategy for predicting prices or improving returns.",
          "Begin by asking whether each item still has a purpose. If you cannot remember why a symbol was added, write down a new question or remove it. The aim is to reduce the amount of context you must reconstruct each time you return.",
        ],
      },
      {
        title: "Mark observations with dates",
        paragraphs: [
          "A note without a date can look current long after the circumstances changed. Include the date you reviewed a source and distinguish a completed check from something you still intend to investigate. Avoid rewriting an old assumption as if it had always been certain.",
          "If the research is no longer relevant, preserve any context you need outside the active note before replacing it. MirrorTape saves the current planning draft; it is not a complete version-history archive of every sentence you have typed.",
        ],
      },
      {
        title: "Check that your tools are available",
        paragraphs: [
          "Confirm that the save indicator acknowledges your latest changes. If a provider connection is unavailable, address that separately from the research itself. A missing account view does not tell you whether your brokerage account or an order at the broker has changed.",
          "Use your broker directly for time-sensitive account activity. The MirrorTape status page checks the availability of the workspace and shows which integrations are enabled; it does not certify a broker's systems or provide a historical uptime guarantee.",
        ],
      },
      {
        title: "Leave yourself a useful starting point",
        paragraphs: [
          "End the review with one clear next question. That gives your next session a starting point without turning the workspace into an endless task list. Keep confidential documents and credentials out of research notes.",
          "You can rehearse this routine in the demo before committing to an account. If you use a private workspace, keep an independent copy of anything you cannot afford to lose and review account access on shared devices.",
        ],
        links: [
          { label: "Check service availability", href: "/status" },
          { label: "Start with a free workspace", href: "/app/register" },
        ],
      },
    ],
  },
];
export function readingMinutes(post: Post) {
  return Math.max(
    1,
    Math.ceil(
      post.sections
        .flatMap((s) => [...s.paragraphs, ...(s.items ?? [])])
        .join(" ")
        .split(/\s+/).length / 200,
    ),
  );
}
