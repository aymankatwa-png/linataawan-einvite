# Linataawan III E-Invite: Community Dialogue (30 November 2026)

Interactive invitation for the European Union Delegation to Libya.
Static site: plain HTML, CSS and JavaScript. No build step, no server code, no database.

## How to host (IT)
1. Upload everything in this folder to the web server (keep the folder structure).
2. Open the page in a browser. `index.html` is the entry page.
3. Recommended path: `https://<rc-domain>/invite/`

## Settings to check before sharing
Open `index.html`, find `const CONFIG` near the bottom:
- `rsvpEmail`: the inbox that receives responses (also in `invite.ics`, ORGANIZER line).
- `mapUrl`: already set to the Hive Space pin on Google Maps (Havana Street, Hay Al-Andalus).

For good link previews on WhatsApp and email, change this line in `index.html` to the full address:
`<meta property="og:image" content="https://<rc-domain>/invite/assets/img/og-image.jpg">`

## Personal links
Add `?to=` to the link to show a name on the envelope, for example:
`https://<rc-domain>/invite/?to=H.E.%20Head%20of%20Delegation`

## Files
- `index.html`: the invitation
- `invite.ics`: calendar file (Apple Calendar, Outlook)
- `assets/`: fonts (Montserrat), logos, GSAP animation library
