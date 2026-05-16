# Feature Debt

This is the backlog of ideas and follow-ups that are worth considering later, but are not required to keep the current apps working.

## Must Decide Later

- Confirm the final staff and student email domains for Azure AD sign-in.
- Decide whether staff and students should use separate tenant rules or one shared allowlist.
- Decide whether offline or emergency access should be allowed for already-booked students if Azure auth or MFA is down.

## Should Consider

- Add a controlled fallback flow for days when Azure auth or MFA is unavailable.
- Add a dedicated edit flow for draft slot batches after creation.
- Add bulk publish and unpublish actions for tutors.
- Add a clearer visual state for draft, published, and booked slots.
- Improve the custom location UX with saved templates or recent locations.
- Consider attaching richer location metadata such as building, room notes, or map links.
- Add audit views for publish and booking actions.

## Later

- Consider notifications when a draft batch becomes live.
- Decide whether custom locations should be searchable and reusable.
- Keep the Venue App and Assessment App independent at the UI and route level.
- Review whether any shared logic should be split into smaller modules.
- Decide if each app should eventually have its own auth/session wrapper instead of sharing only backend storage.
- Add reminders or scheduled releases for published assessment slots.
- Add clearer admin controls for fixing bad imports or bad batch data.
- Revisit whether a manual emergency booking path is needed if authentication is down.
