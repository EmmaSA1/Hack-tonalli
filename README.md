smart contract link when generating a certificate with ACTA

https://stellar.expert/explorer/testnet/tx/ec9c077dcf655ee67f191a979e019e3095142a37d4785d65921c494a189ed552

## Business Analytics and Metrics Implementation

✅ **Completed**

### Features Implemented:
- **PostHog Integration**: Added PostHog analytics to web app, mobile app, and backend
- **Event Tracking**:
  - `chapter_started`: Tracked when user starts a chapter (completion rate 0%)
  - `quiz_submitted`: Tracked on quiz submission with score and pass status
  - `certificate_issued`: Tracked on ACTA certificate issuance with VC details
- **Admin Dashboard Metrics Panel**: Added real-time metrics display in admin dashboard
- **Metrics Tracked**:
  - Completion rate per chapter/module
  - Drop-off rate in quiz (abandonments)
  - Total XLM distributed per period
  - Daily/Weekly Active Users (DAU/WAU)
  - Free to Pro conversion rate

### Technical Details:
- Web App: PostHog JS initialized in main.tsx, events tracked in components
- Mobile App: PostHog React Native initialized in _layout.tsx
- Backend: PostHog Node service for server-side tracking
- Dashboard: Custom metrics panel in AdminDashboard with placeholder data (integrate PostHog API for real data)

### Next Steps:
- Configure PostHog project keys and host
- Implement PostHog API integration for real-time metrics fetching
- Add more granular event tracking (e.g., video progress, user engagement)
