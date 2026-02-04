# Canvas Discussion Post Downloader
A lightweight **Tampermonkey** userscript designed for students and educators to export Instructure Canvas discussions into neatly organized, human-readable text files.
---
* **Automatic Statistics:** Generates a participation summary at the end of the file, including:
    * Total posts per user.
    * Total word counts per user.
    * Sorting by the most active contributors.
* **Post-Level Word Counts:** Displays word counts for every individual post and reply header.
---
## Installation
1.  **Install Tampermonkey:** Ensure you have the [Tampermonkey extension](https://www.tampermonkey.net/) installed in your browser.
2.  **Create New Script:** Open the Tampermonkey Dashboard and click the **+** (plus) icon to create a new script.
---
## How to Use
1.  Navigate to any **Discussion** page on your Canvas site.
2.  Ensure you are viewing a specific topic (the URL should include `/discussion_topics/`).
3.  Look for the **"Download Discussion"** button in the bottom-right corner of your screen.
4.  Click the button. The script will fetch the data via the Canvas API and automatically download a `.txt` file.
---

## Example Output

```text
DISCUSSION EXPORT: WEEKLY REFLECTION #4
URL: https://school.instructure.com/courses/123/discussion_topics/456
######################################################################

──────────────────────────────────────────────────────────┐
│ FROM: Ryan Whitt                     [9 words]
│ DATE: 2/4/2026, 10:18:48 AM                              │
└──────────────────────────────────────────────────────────┘
This is a test of a discussion post reply.

============================================================

┌──────────────────────────────────────────────────────────┐
│ FROM: Ryan Whitt                     [10 words]
│ DATE: 2/4/2026, 10:19:00 AM                              │
└──────────────────────────────────────────────────────────┘
This is a secondary test of a discussion post reply.

============================================================

└── REPLY FROM: Ryan Whitt (2/4/2026, 10:19:15 AM) [10 words]
    │
    └─ This is a tertiary test of a discussion post reply.
    


=======================================================
   PARTICIPATION SUMMARY
=======================================================
USER                      | POSTS    | TOTAL WORDS
-------------------------------------------------------
Ryan Whitt                | 3        | 29 words
=======================================================
