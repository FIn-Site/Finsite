# Finsite Product Roadmap

This roadmap outlines the planned features, enhancements, and milestones for Finsite. It provides transparency about the project's direction and helps coordinate development efforts.

**Last Updated:** December 10, 2025

---

## Vision

Build a privacy-first, local-first personal finance tracker that empowers users to understand their spending patterns without compromising their financial data privacy.

---

## Milestone Overview

| Version | Target | Focus | Status |
|---------|--------|-------|--------|
| **v1.0** | Q1 2026 | Core feature stability & documentation | 🟡 In Progress |
| **v1.1** | Q2 2026 | Data management & user experience | 📋 Planned |
| **v1.2** | Q2 2026 | Advanced analytics & insights | 📋 Planned |
| **v2.0** | Q3 2026 | Multi-device sync & collaboration | 🔮 Future |

**Legend:**
- ✅ Completed
- 🟡 In Progress
- 📋 Planned
- 🔮 Future (not committed)
- ❌ Deferred

---

## v1.0 - Foundation & Stability
**Target:** Q1 2026 (Jan-Mar 2026)  
**Theme:** Stable, well-documented core features

### Core Features (Already Completed ✅)
- ✅ Transaction management (add, delete, search, filter, sort)
- ✅ Category and group organization
- ✅ Custom categories and groups
- ✅ Dashboard with spending visualizations
- ✅ Time-series charts (6-month spending trend)
- ✅ Group breakdown charts
- ✅ Budget tracking with monthly comparisons
- ✅ Client-side IndexedDB storage (privacy-first)
- ✅ Responsive design for mobile and desktop
- ✅ E2E test coverage (21 test files, 63 test runs)

### Documentation (In Progress 🟡)
- 🟡 Developer documentation (ADRs, architecture docs)
- 🟡 Build and deployment documentation
- 📋 User-facing documentation and getting started guide
- 📋 API documentation (auto-generated from JSDoc)
- 📋 Contributing guidelines

### Quality & Stability (Planned 📋)
- 📋 Unit test coverage > 80%
- 📋 Accessibility audit (WCAG 2.1 AA compliance)
- 📋 Performance optimization (Lighthouse score > 90)
- 📋 Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- 📋 Error boundary implementation
- 📋 Comprehensive error handling and user feedback

### Completion Criteria for v1.0
- All documentation complete and published
- Test coverage meets targets
- No critical or high-priority bugs
- Deployment automation working (one-press deploy)
- README updated with badges, screenshots, and quick start

---

## v1.1 - Data Management & UX
**Target:** Q2 2026 (Apr-Jun 2026)  
**Theme:** Empower users to manage their financial data

### Data Import/Export 📋
- 📋 CSV import (bulk transaction upload)
- 📋 CSV export (transactions, categories, budget data)
- 📋 JSON export (full app state backup)
- 📋 Import validation and error reporting
- 📋 Duplicate transaction detection

### Transaction Enhancements 📋
- 📋 Edit existing transactions
- 📋 Attach receipts/images to transactions (stored as base64)
- 📋 Transaction tags (multiple per transaction)
- 📋 Recurring transactions (auto-add on schedule)
- 📋 Transaction templates (quick add common transactions)
- 📋 Split transactions (assign to multiple categories)

### User Experience 📋
- 📋 Onboarding tutorial (first-time user walkthrough)
- 📋 Dark mode theme
- 📋 Customizable dashboard widgets
- 📋 Keyboard shortcuts
- 📋 Undo/redo functionality
- 📋 Toast notifications for actions
- 📋 Search with autocomplete
- 📋 Bulk operations (select multiple, bulk delete, bulk edit)

### Budget Improvements 📋
- 📋 Budget creation UI (set monthly limits per category/group)
- 📋 Budget alerts (notify when approaching limit)
- 📋 Budget vs actual comparison charts
- 📋 Rollover budget support (unused funds carry to next month)

---

## v1.2 - Advanced Analytics
**Target:** Q2 2026 (Apr-Jun 2026)  
**Theme:** Deeper insights into spending patterns

### Analytics & Insights 📋
- 📋 Year-over-year comparison charts
- 📋 Spending trends by day of week/month
- 📋 Category distribution over time
- 📋 Merchant spending analysis
- 📋 Income vs expenses breakdown
- 📋 Savings rate calculator
- 📋 Financial goals tracking (e.g., "Save $5000 by Dec 2026")

### Visualizations 📋
- 📋 Heatmap calendar (spending intensity by date)
- 📋 Sankey diagram (money flow between categories)
- 📋 Comparison charts (this month vs last month)
- 📋 Customizable date ranges for all charts
- 📋 Export charts as images

### Reporting 📋
- 📋 Monthly spending reports (PDF export)
- 📋 Tax category grouping
- 📋 Custom report builder
- 📋 Scheduled reports (auto-generate monthly summaries)

### Smart Features 📋
- 📋 Anomaly detection (unusual spending patterns)
- 📋 Suggested categories based on merchant
- 📋 Spending predictions (forecast next month)

---

## v2.0 - Multi-Device & Collaboration
**Target:** Q3 2026 (Jul-Sep 2026)  
**Theme:** Extend beyond single-device, single-user

### Cloud Sync (Optional) 🔮
- 🔮 End-to-end encrypted cloud backup
- 🔮 Multi-device sync (desktop, mobile, tablet)
- 🔮 Conflict resolution (offline changes)
- 🔮 Self-hosted server option (privacy-focused users)
- 🔮 Sync status indicators

### Multi-User Support 🔮
- 🔮 Shared budgets (household/family accounts)
- 🔮 Permission levels (owner, editor, viewer)
- 🔮 Transaction comments/notes between users
- 🔮 Split transaction cost sharing

### Mobile App 🔮
- 🔮 Progressive Web App (PWA) with offline support
- 🔮 Native mobile apps (React Native or similar)
- 🔮 Receipt scanning with OCR
- 🔮 Push notifications for budget alerts

### Integrations 🔮
- 🔮 Bank account read-only integration (Plaid API)
- 🔮 Credit card transaction import
- 🔮 Google Sheets export
- 🔮 YNAB import compatibility

---

## Feature Backlog (Unprioritized)

Ideas under consideration for future releases:

### Financial Planning 🔮
- Investment tracking (stocks, bonds, crypto)
- Net worth dashboard
- Debt payoff calculator
- Retirement savings projections

### Automation 🔮
- Auto-categorization using ML (local, privacy-preserving)
- Smart rules (if-then automation)
- Scheduled transaction deletion (e.g., auto-delete after 2 years)

### Customization 🔮
- Theme builder (custom colors, fonts)
- Plugin system for extensions
- Custom chart types
- API for external integrations

### Social Features 🔮
- Anonymous spending comparisons (regional averages)
- Budget templates shared by community
- Financial challenge groups

---

## Deferred Features

Features that were considered but are not currently planned:

- ❌ Cryptocurrency portfolio tracking (scope too broad)
- ❌ Tax filing integration (complex regulations)
- ❌ Investment advice (requires licensing)
- ❌ Bill pay functionality (security concerns)

---

## How to Influence the Roadmap

We welcome community input on priorities and features!

### 1. Open an Issue
- Go to [GitHub Issues](https://github.com/FIn-Site/Finsite/issues)
- Use the "Feature Request" template
- Describe the problem and proposed solution
- Explain the use case and value

### 2. Vote on Existing Issues
- Browse open feature requests
- Add 👍 reaction to features you want
- Comment with your use case or additional details

### 3. Contribute Code
- Check issues labeled `good first issue` or `help wanted`
- Comment on an issue to claim it
- Submit a pull request following [Contributing Guidelines](../CONTRIBUTING.md)

### 4. Join Discussions
- Participate in [GitHub Discussions](https://github.com/FIn-Site/Finsite/discussions)
- Share feedback on proposed features
- Propose new ideas

### 5. Sponsor the Project
- Consider sponsoring via GitHub Sponsors
- Sponsors may request priority consideration for features

---

## Roadmap Review Process

- **Quarterly Reviews**: Roadmap updated every quarter based on progress and feedback
- **Community Input**: Feature prioritization influenced by issue votes and discussions
- **Flexibility**: Roadmap is a living document - priorities may shift based on user needs
- **Transparency**: Major changes announced in GitHub Discussions

---

## Success Metrics

We track these metrics to measure progress:

### Adoption
- GitHub stars
- Weekly active users (if analytics added)
- Download/deployment count

### Quality
- Test coverage percentage
- Open bug count
- Average bug resolution time
- Lighthouse performance score

### Community
- Number of contributors
- Pull request merge rate
- Issue response time
- Documentation page views

---

## Versioning Strategy

We follow [Semantic Versioning](https://semver.org/):

- **Major (x.0.0)**: Breaking changes, significant new features
- **Minor (1.x.0)**: New features, backward compatible
- **Patch (1.0.x)**: Bug fixes, minor improvements

---

## Release Cadence

- **Major releases**: Every 6-12 months
- **Minor releases**: Every 2-3 months
- **Patch releases**: As needed for critical bugs

---

## Contact & Feedback

- **Issues**: [github.com/FIn-Site/Finsite/issues](https://github.com/FIn-Site/Finsite/issues)
- **Discussions**: [github.com/FIn-Site/Finsite/discussions](https://github.com/FIn-Site/Finsite/discussions)
- **Email**: Create an issue for now (email may be added later)

---

**Thank you for being part of the Finsite journey!** 🚀
