// ==UserScript==
// @name         Canvas Discussion Post Downloader
// @namespace    http://tampermonkey.net/
// @version      2026-02-04
// @description  Downloads discussion posts from Canvas with post-level word counts and user statistics.
// @author       Ryan Whitt
// @match        https://*.instructure.com/courses/*/discussion_topics/*
// @match        https://*.instructure.com/courses/*/discussions/*
// @match        https://canvas.*.edu/courses/*
// @grant        none
// ==/UserScript==
// NOTE: if you want, change @match to your school/organization's base URL to only activate tampermonkey there

// For use with TamperMonkey in Chrome, primarily
(function() {
    'use strict';

    // clean up out html before proceeding, used in case we need somethign from the page (we do, the word count)
    const cleanHTML = (html) => {
        if (!html) return "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('p, br, div').forEach(el => el.prepend('\n'));
        return tempDiv.textContent.trim() || tempDiv.innerText.trim() || "";
    };

    // Helper to count words for each discussion post
    const getWordCount = (text) => {
        const words = text.trim().split(/\s+/);
        return words[0] === "" ? 0 : words.length;
    };

    
    function processEntries(entries, participantMap, userStats, depth = 0) {
        let text = "";
        const indent = "    ".repeat(depth);
        const threadLine = depth > 0 ? "│   ".repeat(depth - 1) + "└── " : "";

        for (const entry of entries) {
            const author = participantMap[entry.user_id] || "Unknown User"; // is the author defined? if no, default
            const date = new Date(entry.created_at).toLocaleString(); // getting current locale's date
            const message = cleanHTML(entry.message); // message in discussion post
            const wordCount = getWordCount(message);

            if (!userStats[author]) {
                userStats[author] = { posts: 0, words: 0 };
            }

            // Increment post count AND word count for this user
            userStats[author].posts += 1;
            userStats[author].words += wordCount;

            const formattedMsg = message.replace(/\n/g, `\n${indent}${depth > 0 ? "│   ".repeat(depth) : ""}`);

            // formatting the output to be nice and pretty
            if (depth === 0) { // depth is used to check if we're at the base level of the post or not. depth of 0 indicates yes, we are at the base level
                text += `┌──────────────────────────────────────────────────────────┐\n`;
                text += `│ FROM: ${author.padEnd(30)} [${wordCount} words]\n`; // name of poster and the word count of the post
                text += `│ DATE: ${date.padEnd(50)} │\n`; // date/time of the post
                text += `└──────────────────────────────────────────────────────────┘\n`;
                text += `${formattedMsg}\n`; // the actual message from the poster
                text += `\n${"=".repeat(60)}\n\n`; // formatting stuff
            } else { // otherwise, we're processing a reply
                text += `${threadLine}REPLY FROM: ${author} (${date}) [${wordCount} words]\n`; 
                text += `${"    ".repeat(depth)}│\n`;
                text += `${"    ".repeat(depth)}└─ ${formattedMsg}\n`;
                text += `${"    ".repeat(depth)}\n`;
            }

            if (entry.replies && entry.replies.length > 0) {
                text += processEntries(entry.replies, participantMap, userStats, depth + 1);
            }
        }
        return text;
    }

    // making the html button, bottom right of the screen
    function createDownloadButton() {
        if (document.getElementById('canvas-json-downloader-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'canvas-json-downloader-btn';
        btn.innerHTML = 'Download Discussion';
        btn.style = `
            position: fixed;
            bottom: 60px;
            right: 40px;
            z-index: 999999;
            padding: 12px 20px;
            background-color: #2D3B45;
            color: #FFFFFF;
            border: 2px solid #00AC18;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0px 4px 6px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(btn);

        // clicking the button, which downloads a txt file containing formatted discussion post info
        btn.onclick = async function() {
            const urlParts = window.location.href.split('/'); // split up URL
            const school = window.location.hostname.split('.')[0] || 'canvas'; // first part of URL is either the school or just 'canvas'. it was just 'canvas' on my test account
            const courseId = urlParts[urlParts.indexOf('courses') + 1]; // course ID, used to identify canvas course
            const discussionId = urlParts[urlParts.indexOf('discussion_topics') + 1]; // ID for the discussion itself
            const tabTitle = document.title.split(':')[1]; // canvas formats discussions like 'Topic: DiscussionName' and we only want DiscussionName

            const apiUrl = `https://${school}.instructure.com/api/v1/courses/${courseId}/discussion_topics/${discussionId}/view?include_new_entries=1`; // base url for getting JSON

            try {
                const response = await fetch(apiUrl);
                const data = await response.json();

                const participantMap = {};
                if (data.participants) {
                    for (const user of data.participants) {
                        participantMap[user.id] = user.display_name;
                    }
                }

                const userStats = {}; // stores word count and post count

                // top of the export txt file
                let content = `\n  DISCUSSION EXPORT: ${tabTitle.toUpperCase()}\n`;
                content += `  URL: ${window.location.href}\n`; // url of discussion for reference
                content += `  EXPORTED ON: ${new Date().toLocaleString()}\n`; // date/time exported
                content += `${"#".repeat(70)}\n\n`; // formatting junk

                if (data.view && data.view.length > 0) { // get posts and put them in the export file
                    content += processEntries(data.view, participantMap, userStats);
                } else {
                    content += "No posts found."; // something went wrong, nothing found
                }

                // Summary table
                content += `\n\n${"=".repeat(55)}\n`;
                content += `   PARTICIPATION SUMMARY\n`;
                content += `${"=".repeat(55)}\n`;
                content += `${"USER".padEnd(25)} | ${"POSTS".padEnd(8)} | ${"TOTAL WORDS"}\n`;
                content += `${"-".repeat(55)}\n`;

                const sortedUsers = Object.entries(userStats).sort((a, b) => b[1].words - a[1].words); // users should be sorted from most words to least words

                for (const [name, stats] of sortedUsers) {
                    content += `${name.padEnd(25)} | ${stats.posts.toString().padEnd(8)} | ${stats.words} words\n`; // add summary info for each user
                }
                content += `${"=".repeat(55)}\n`;

                // ok, all done, now download the export
                const blob = new Blob([content], { type: 'text/plain' }); 
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Discussion Export -${tabTitle}.txt`; // title of the file
                link.click();
                URL.revokeObjectURL(link.href);
            } catch (err) {
                alert("Error: Check console or ensure you are on a specific discussion page.");
                console.error(err);
            }
        };
    }

    if (document.readyState === 'complete') {
        createDownloadButton(); // create button
    } else {
        window.addEventListener('load', createDownloadButton);
    }
})();
