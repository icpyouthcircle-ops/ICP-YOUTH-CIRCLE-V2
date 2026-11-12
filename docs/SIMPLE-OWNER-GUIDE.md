# ICP YOUTH CIRCLE: simple owner guide

## Where to manage the website

- Open the public website and choose **Admin portal** in the footer, or open `/admin.html` on your website domain.
- Use the private Google Sheet and Vercel dashboard that only you control. Do not publish their links.

## Everyday workflow

1. Open the **Admin dashboard**.
2. Sign in with the Google account listed as **Active** in the private `Admins` sheet.
3. Choose the task at the top: Resources, Announcements, Admissions, Scholarships or Portal settings.
4. Click **New record** to add content, or open an existing record to edit it.
5. Use only official links for universities, boards, tests and scholarships.
6. Mark the record as published only after checking the date, link and wording.

## What each section controls

| You want to add | Admin area to use |
| --- | --- |
| Notes, past papers, PDFs, study links | Resources |
| Exam dates, merit lists, urgent notices | Announcements |
| College or university information | Admissions |
| Funding opportunities | Scholarships |
| Internships, competitions and career links | Opportunities |
| Student questions and replies | Q&A |
| Student requests | Resource submissions or Help desk |
| Website name, contact links and social links | Settings |

## Uploading a PDF

1. In Admin, choose **Resources**.
2. Click **Upload PDF**.
3. Select the PDF, then enter its title, category, subject, class or level, board and year.
4. Confirm you have permission to share it.
5. Upload and check it on the public website.

## Publishing a good update

Every announcement should have:

- A short clear title
- The date it was published
- A deadline or expiry date when relevant
- An official source link
- A simple summary written for students
- **Featured = Yes** only for the most important updates

## Student accounts and admin accounts

- Students use **Sign in** on the public website. Their first Google sign-in creates their student account.
- Students are not administrators and do not need to appear in the Admins sheet.
- Administrators must be listed as **Active** in the private `Admins` sheet.
- Never share the Admins sheet, Apps Script editor, Firebase access or Vercel access with ordinary students.

## If Google sign-in fails

In Firebase Authentication → Settings → Authorized domains, add your exact website hostname. For example:

```
icp-youth-circle.vercel.app
```

Add no `https://` and no trailing slash.

## Best practice each week

1. Review urgent announcements and remove expired information.
2. Check all scholarship deadlines.
3. Add useful verified notes or past papers.
4. Review Help Desk and resource submissions.
5. Test the website on a phone.
6. Open the public site in a private browser window to confirm it loads normally.

## Important safety rules

- Do not publish students' private documents, phone numbers or email addresses.
- Do not upload copyrighted PDFs unless you have permission.
- Do not trust an opportunity until you check its official website.
- Keep Firebase, Vercel and Google Sheet owner access private.
