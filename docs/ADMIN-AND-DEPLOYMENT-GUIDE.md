# ICP YOUTH CIRCLE V2: owner and administrator guide

Prepared for Muhammad Muneeb · 11 November 2026

## 1. What is connected

The website source is `icpyouthcircle-ops/ICP-YOUTH-CIRCLE-V2` on GitHub. Vercel serves the public website. The existing backend is Google Apps Script with Google Sheets; Firebase handles Google sign-in. This release preserves those services. It does not migrate records to Supabase.

The homepage, category navigation, preparation tracker, focus timer and marks calculator work without an account. Published resources, questions, announcements and opportunities come from the backend. AI requires configured provider keys. Private account results and admin editing require Firebase and server authorization.

## 2. Open the admin dashboard

1. Open the actual production website from your Vercel project's **Domains** or latest successful production deployment.
2. Click **Admin portal** in the footer. Alternatively append `/admin.html` to that website's domain.
3. Click **Continue with Google**.
4. Choose the Google account recorded as **Active** in your spreadsheet's **Admins** tab.
5. Wait for **Content dashboard**. If access fails, use the troubleshooting table below.

There is no separate default username or password. Opening the admin page does not grant editing access. The server verifies a Firebase identity token and checks the private Admins sheet for every admin operation.

## Everyday owner workflow

Use the website's `/admin.html` dashboard for routine work instead of editing technical spreadsheet tabs.

1. **Resources** — publish notes, past papers, study resources and approved PDFs.
2. **Announcements** — create verified updates, then keep them as Draft until ready to publish.
3. **Admissions and scholarships** — add official dates and source links only.
4. **Portal settings** — use only for deliberate advanced configuration changes. Keep the `Key` and `Value` headers unchanged.

The Owner Control Center at the top of the dashboard opens these areas directly. Technical spreadsheet tabs remain safely in the background because they support portal features, authentication, notifications, Q&A, and study tools. They do not need daily editing.

## 3. Grant your first administrator access

Use the owner Google account to open the existing private portal spreadsheet. Do not share spreadsheet editing access with students.

Open the **Admins** tab. Its first row should contain:

```text
ID | Email | Role | Status | CreatedAt | UpdatedAt
```

Enter a row using your own Google email:

| ID | Email | Role | Status | CreatedAt | UpdatedAt |
| --- | --- | --- | --- | --- | --- |
| ADMIN-001 | YOUR-GOOGLE-EMAIL@gmail.com | Super Admin | Active | 2026-11-11 | 2026-11-11 |

Replace the example email before saving. The email must match the Google account chosen at sign-in. Do not overwrite an existing administrator's row or reuse its ID. Role is a descriptive label in the current implementation; active administrators share dashboard capabilities. This is not a granular role-permission system.

Remove admin access by changing that account's Status to **Inactive**. The next server request rechecks access.

## 4. Allow Google sign-in on your Vercel domain

1. Open Firebase Console and select the existing project **icp-youth-circle-1ce3d**.
2. Open **Authentication**, then the Google sign-in provider, and confirm it is enabled.
3. Open **Authentication → Settings → Authorized domains**.
4. Add the exact hostname shown in Vercel, without `https://` and without a path.
5. Add a custom domain separately if you use one. Authorize preview hostnames only when you intend to test sign-in there.
6. Reopen `/admin.html` and sign in again.

The Firebase web configuration in the existing website must match this project and the `MDCAT_FIREBASE_CONFIG` backend property. Firebase web API identifiers are not server credentials. Never publish service-account private keys.

## 5. Publish notes, past papers and study materials

1. Sign in and choose **Resources** under **Portal section**.
2. Select **New record**.
3. Add a clear Title, the exact Category (for example **Notes**, **Past Papers** or **Study Resources**), Level, Subject and Description.
4. Use a valid HTTPS FileURL and verify students can open it without requesting your private Drive access.
5. Review the row in Draft, then change Status to **Active** and save.
6. Open the corresponding public category and verify the title, filters and download link.

You can also choose **Upload PDF**. The backend creates or uses its portal PDFs folder and publishes the file using the existing upload process. Upload only files you intend to make available to students. PDF upload requires the Apps Script owner's Drive permission.

For bulk import, select **Paste multiple rows**, copy the exact headers displayed by the dashboard, and paste a tab-separated block with that same header row. Start with one record to verify the mapping.

## 6. Other content sections

| Dashboard section | What to enter or manage |
| --- | --- |
| Admissions | Institution, program, eligibility, accurate dates and official link |
| Scholarships | Name, country, funding information, deadlines and official link |
| Entry tests | Test name, organisation, information and official website |
| Opportunities | Internships, competitions, student programs and career guidance |
| Announcements | Title, category, message, dates and official source |
| Videos | Educational video details and a valid link |
| AI tools | Tool information, category and website |
| Blog | Published articles and study-abroad guidance |
| Islamic content | Carefully checked reminders, duas and source information |
| FAQs | Question, answer, category, display order and Active status |
| Navigation / Categories | Labels, slugs, parent IDs and display order |
| Settings | Site name, tagline, description and official contact fields |
| Social links | The community's real official accounts and join links |

Use existing dashboard fields rather than adding unrecognised spreadsheet columns. Do not invent admission dates, scholarship amounts, official affiliations, testimonials or working community invite links.

For Resources, Scholarships, Announcements, Countdowns and Notifications, new records default to **Draft** and the Archive action uses **Archived**. Other sections default to **Inactive** and archive to **Inactive**. Set **Active** to publish. Scheduled records respect PublishAt and ExpiresAt where supported. Public caches can take several minutes to refresh.

## 7. Student Q&A and moderation

The **Student Q&A** route and **Forum** entry open the existing question system. Students sign in to post and answer. Use **Q&A questions**, **Q&A answers** and **Q&A reports** to review content. Use **Q&A verified contributors** only for people you have verified. Do not assign verified status just because a user requests it.

Resource submissions, Help desk and anonymous Feedback appear in their dashboard sections. A submission is not automatically an approved public resource: review it before publishing a separate resource record.

If Q&A sheets are missing, open the spreadsheet's Apps Script editor, install the current `backend/Code.gs`, and run `setupQASystem()` once as the owner.

## 8. MDCAT practice and account results

The existing subject hub supports subjects, units, chapters, topics, questions, tests, daily practice, updates and browser-local study tools. Populate the corresponding **MDCAT** dashboard sections with real content and valid relationship IDs.

Guest practice is ungraded. Account scoring requires Firebase setup, valid question data, the scoring sheets, `MDCAT_FIREBASE_CONFIG` and `MDCAT_SCORING_ENABLED=true`. Follow `backend/README.md` for the complete scoring setup. Keep scoring disabled until owner testing succeeds. The demo pack is a development fixture, not an official exam question collection.

The dashboard intentionally excludes private sessions, answer snapshots, student attempts, results and progress from general editing.

## 9. AI assistant

Provider credentials belong in **Apps Script → Project Settings → Script Properties**, never in website JavaScript, GitHub, public Sheets or a chat message.

| Property | Purpose |
| --- | --- |
| OPENAI_API_KEY | Private OpenAI API credential |
| ICP_AI_ENABLED | Set to true to enable configured OpenAI service |
| ICP_AI_MODEL | Model available to your API project; current repository default is gpt-5.4-mini |
| GEMINI_API_KEY | Private Gemini API credential |
| ICP_GEMINI_ENABLED | Set to true to enable configured Gemini service |
| ICP_GEMINI_MODEL | Model available to your API project; current repository default is gemini-3.8-flash |

Run `setupAIAssistant()` once if its sheets do not exist. Deploy the updated Apps Script as a new web-app version, keeping the existing `/exec` URL. Test each configured provider and Auto as a signed-in student. A ChatGPT Plus or Gemini consumer subscription does not configure the website's API credentials.

See `docs/icp-ai-assistant-setup.md` for provider setup and rate limits. Do not promise live AI availability until a real request succeeds with your account configuration.

## 10. Browser-local study tools

Open **Study → Prep Tracker**, or choose **Build my study plan** on the homepage.

- Add a task with a subject and optional target date.
- Tick completed tasks and switch between All, To do and Completed.
- Use **Export plan** to download a JSON copy.
- Choose a focus session, Start, Pause, Resume or Reset. Keep the tracker page open during a session.
- Use the percentage calculator with obtained and total marks.

Tasks persist in that browser on that device. They do not sync to a student account. Clearing browser data removes the local plan. The timer resets when leaving or reloading the tracker.

## 11. Vercel deployment

Keep the existing project and Git repository. Do not create a duplicate site.

1. Open the existing ICP Youth Circle project in Vercel.
2. Under its Git settings, confirm the connected repository is **icpyouthcircle-ops/ICP-YOUTH-CIRCLE-V2**.
3. The repository includes `vercel.json`: Framework **Other**, Build Command **npm run build**, Output Directory **dist**.
4. Deploy the desired reviewed Git commit. Use the production branch configured in your existing Vercel project.
5. Wait for a successful deployment and open its actual production URL.
6. Authorize that hostname in Firebase before testing Google sign-in.
7. Check homepage, Notes, Prep Tracker, Student Q&A, AI Assistant and `/admin.html`.

The build publishes only the website HTML, CSS, JavaScript and assets. Backend source, development tools, tests and node_modules are excluded from dist. Vercel also sends admin noindex/no-store headers and fresh service-worker headers. Google Sheets and Apps Script must be deployed separately from the Vercel frontend.

Do not put OpenAI or Gemini keys into Vercel's public frontend variables for this implementation. The existing provider requests run in Apps Script.

## 12. Updating Google Apps Script

1. Back up your current Code.gs and the spreadsheet before a backend update.
2. Open the existing spreadsheet, then **Extensions → Apps Script**.
3. Replace Code.gs with the repository's complete `backend/Code.gs`.
4. Run the required setup function for the feature you are enabling. Use `setupPortalEnhancements()` for FAQs, feedback and publishing columns; `setupQASystem()` for Q&A; `setupAIAssistant()` for AI.
5. Follow the private helper setup instructions in `backend/README.md` for scoring and notifications. Those helpers are not directly selectable in Apps Script without a temporary public wrapper.
6. Open **Deploy → Manage deployments**, edit the existing web-app deployment and choose **New version**.
7. Preserve the existing public URL and owner execution setting. Verify public GET responses and authenticated routes after deployment.

Spreadsheet records and Script Properties are not copied by deploying GitHub code to Vercel.

## 13. Troubleshooting

| Symptom | Check |
| --- | --- |
| Google popup reports unauthorized-domain | Add the exact production hostname to Firebase Authorized domains |
| Popup never opens | Allow the sign-in popup for this website and retry from the button |
| Not an active portal administrator | Correct Google email in Admins and Status=Active |
| Login works but dashboard requests fail | Matching Firebase project configuration, deployed Apps Script and access to the backend |
| Public page has no records | Correct table, headers, Category/Slug, Active status, publishing dates and data cache |
| AI says unavailable or returns an error | Apps Script provider keys, enable flags, permitted model, API quota and deployed backend |
| PDF upload fails | Apps Script owner's Drive permission, PDF file and dashboard error message |
| Published update is stale | Reload, allow cache expiry and check the production deployment commit |
| Scored tests fail | Firebase config, scoring enable flag, valid question mapping and required private sheets |
| Local plan disappears on another device | Plans are stored per browser; export a copy on the original device |

## 14. Verification boundaries for this release

Syntax, initial-load budget, static build and backend unit checks can run locally. The production owner must verify Firebase sign-in, actual administrator membership, private submissions, paid AI calls, uploads and scored attempts using their connected services. No administrator email, API key or production domain was invented for this release.

Official references: [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json), [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [Gemini models](https://ai.google.dev/gemini-api/docs/models).
