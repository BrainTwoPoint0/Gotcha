# Competitor Analytics Research — Premium Dashboard Features

Research date: March 2026

## Data Gotcha Already Collects

Before mapping features, here is what Gotcha currently stores per response:

| Field | Description |
|-------|-------------|
| `elementId` | Which widget generated the response |
| `mode` | feedback, vote, poll, nps |
| `rating` | 1-5 star rating |
| `vote` | up / down |
| `npsScore` | 0-10 |
| `pollSelected` | Selected poll option(s) |
| `content` | Free-text feedback |
| `title` | Optional title |
| `isBug` | Bug flag |
| `user.id` | User identifier (optional) |
| `user.*` | Arbitrary user traits (plan, role, etc.) |
| `context.url` | Page URL |
| `context.userAgent` | Browser/device info |
| `createdAt` | Timestamp |

---

## 1. Hotjar

**Analytics Views/Charts:**
- NPS score over time (line chart)
- Response distribution charts (bar, donut, line, metric cards, table)
- AI summary reports with sentiment analysis for open-text responses
- Customizable chart types per widget
- Heatmaps and session recordings tied to feedback

**Segmentation:**
- Filter by NPS score range (promoters/passives/detractors)
- User segments based on demographics and behavior
- Compare funnels across devices or segments
- AI-assisted segment creation (Pro plan)

**Export/Reporting:**
- Export survey data to data warehouse
- API for survey response export
- PDF/PNG chart downloads
- Scheduled email reports

**What makes Pro valuable:**
- 4-8 months data retention (vs shorter on free)
- Funnels & conversion analysis
- Unlimited seats
- AI-assisted segmentation

---

## 2. UserVoice

**Analytics Views/Charts:**
- Feature request trend tracking
- Impact scoring for feature ideas
- Feedback volume dashboards

**Segmentation:**
- Segment feedback by customer spend, NPS, or custom traits
- Filter by customer type, plan tier, lifecycle stage

**Export/Reporting:**
- Detailed reports on trends and common requests
- Integrations for data sync

**What makes paid tiers valuable:**
- Starts at $999/month — enterprise-focused
- Compare features by customer revenue impact
- Status updates that feed back to requestors (closing the loop)

---

## 3. Canny

**Analytics Views/Charts:**
- Feature request leaderboard with vote counts
- Basic feedback volume tracking
- Users have requested (but Canny lacks) line charts for trend tracking and bar charts for comparison

**Segmentation:**
- User segmentation by customer type: enterprise, paying, churned, or custom fields
- Filter by company creation date, user name, custom fields via Identify API
- Segmentation only available on Growth plan

**Export/Reporting:**
- API and webhooks
- Limited native reporting — users note this as a weakness

**What makes paid tiers valuable:**
- User segmentation (Growth plan only)
- Prioritization scoring models
- Custom branding

---

## 4. Pendo

**Analytics Views/Charts:**
- NPS distribution chart (promoters / passives / detractors)
- NPS trends over time (daily/weekly/monthly with margin of error)
- Usage by score — correlate NPS with product usage
- NPS breakdown by theme (AI-powered topic extraction)
- Theme trend tracking over time
- Summary quadrant chart: high/low usage x promoters/detractors
- Revenue insights tied to NPS score groups

**Segmentation:**
- Segment by product usage, customer cohort, account attributes
- Deliver targeted guides based on NPS response group
- Cross-reference NPS with feature/page usage

**Export/Reporting:**
- CSV export: Visitor ID, NPS score, follow-up text, submission date, usage metrics
- Dashboard widgets are configurable and shareable

**What makes paid tiers valuable:**
- ML-powered NPS Insights (theme extraction from free text)
- Revenue correlation with NPS
- Behavioral segmentation (NPS x product usage)
- Additional survey types beyond NPS

---

## 5. Survicate

**Analytics Views/Charts:**
- Real-time score tracking (NPS, CSAT, CES)
- Combined score widgets aggregating across multiple surveys
- Trend visualization over time
- Word clouds for open-text analysis
- AI-powered text categorization and sentiment analysis

**Segmentation:**
- Filter by user segment, behavior, or timeframe
- Break down by demographics, time periods, custom segments
- Filter by 3rd-party attributes (paid plan)

**Export/Reporting:**
- PDF/PNG chart downloads
- Scheduled email reports
- Export API
- 25-44+ integrations depending on plan

**What makes paid tiers valuable:**
- Custom dashboards (1 on lower tiers, 10+ on higher)
- AI categorization & sentiment analysis
- Scheduled reports
- 3rd-party attribute filtering
- Starts at $65/month — most accessible pricing

---

## 6. Delighted

**Analytics Views/Charts:**
- Real-time NPS/CSAT/CES score dashboard
- Over Time report — score trends with time range selection
- Snapshot report — point-in-time breakdown
- Pivot Table report — cross-tabulate any two dimensions
- Benchmarks report — compare against 20 industry standards
- Smart Trends — AI-driven keyword extraction from verbatims
- Metrics report for response rates and completion data

**Segmentation:**
- Properties: pass custom attributes with each survey (plan, region, product line)
- Segment and compare across any property
- Keyword-based filtering of open-text responses
- Score-based filtering (promoter/passive/detractor)

**Export/Reporting:**
- Excel/CSV export
- API access
- Recommend pushing to external analytics for deep analysis
- Presentation-ready charts (no spreadsheet needed)

**What makes paid tiers valuable:**
- Premium at $224/month, Premium Plus at $449/month
- All features available on all plans (no feature gating — only volume limits)
- Smart Trends (AI keyword extraction)
- Pivot tables for cross-dimensional analysis
- Industry benchmarks

---

## 7. Refiner

**Analytics Views/Charts:**
- Real-time NPS/CSAT/CES tracking dashboard
- Score trends over time
- AI-powered response tagging and pattern detection
- Segmented score breakdowns

**Segmentation:**
- Segment by NPS rating, follow-up answers, or imported user traits
- Target by plan type, lifecycle stage, behavior, device, country, language
- Filter by previous survey responses

**Export/Reporting:**
- Excel download
- Full API access
- Integrations: Segment, Zapier, Make, Amplitude, Mixpanel, Google Sheets, CRM sync

**What makes paid tiers valuable:**
- Essentials plan includes unlimited responses and segmentation
- Growth plan adds event tracking, translations, advanced integrations
- Enterprise adds unlimited campaigns, SSO, white-labeling, custom CSS
- Starts at $79/month

---

## Common Premium Analytics Patterns

Across all competitors, these features appear repeatedly in paid tiers:

### Tier 1 — High Value, Realistic for Gotcha

| Feature | Complexity | Data Required | Competitors |
|---------|-----------|---------------|-------------|
| **Score over time** (line chart) | Low | timestamps + scores | All 7 |
| **NPS breakdown** (promoter/passive/detractor %) | Low | NPS scores | Hotjar, Pendo, Delighted, Refiner |
| **Response volume over time** | Low | timestamps | All 7 |
| **Rating distribution** (bar chart) | Low | star ratings | Hotjar, Survicate, Delighted |
| **Vote ratio** (up/down %) | Low | votes | Native to Gotcha |
| **Poll results** (bar/pie chart) | Low | poll selections | Native to Gotcha |
| **Filter by date range** | Low | timestamps | All 7 |
| **Filter by element ID** | Low | elementId | Unique to Gotcha |
| **CSV/Excel export** | Low | all fields | Pendo, Delighted, Refiner, Survicate |
| **Keyword/text search in feedback** | Low | content field | Hotjar, Delighted |

### Tier 2 — Medium Value, Moderate Effort

| Feature | Complexity | Data Required | Competitors |
|---------|-----------|---------------|-------------|
| **Segment by user traits** (plan, role, etc.) | Medium | user.* properties | All 7 |
| **Segment by page URL** | Medium | context.url | Hotjar, Pendo |
| **Segment by device/browser** | Medium | context.userAgent | Hotjar, Survicate, Refiner |
| **Pivot table** (cross-tabulate 2 dimensions) | Medium | any two fields | Delighted |
| **Snapshot vs Over Time toggle** | Medium | timestamps + scores | Delighted |
| **Bug report dashboard** (separate view) | Medium | isBug flag | Unique to Gotcha |
| **Scheduled email reports** | Medium | aggregated data | Survicate, Delighted |
| **Sentiment analysis on text** | Medium | content field | Hotjar, Survicate, Pendo |

### Tier 3 — High Value, Higher Effort

| Feature | Complexity | Data Required | Competitors |
|---------|-----------|---------------|-------------|
| **AI keyword extraction** from free text | High | content field | Pendo, Delighted, Survicate |
| **Word cloud** from feedback text | High | content field | Survicate |
| **AI-powered response categorization** | High | content field | Hotjar, Survicate, Refiner |
| **Industry benchmarks** | High | aggregate NPS data | Delighted |
| **Smart alerts** (score drops, volume spikes) | High | time-series data | Refiner |

---

## Recommended Premium Analytics for Gotcha

Based on what data Gotcha already collects and what competitors charge for, here are the highest-impact features for a Pro tier:

### Must-Have (Free tier gets basic counts; Pro gets these)

1. **Score Over Time Charts** — Line chart of avg rating, NPS, vote ratio over selectable time ranges (7d, 30d, 90d, all). Every competitor has this.
2. **NPS Breakdown** — Pie/donut showing promoter/passive/detractor split with percentages.
3. **Rating Distribution** — Bar chart showing count of 1-star through 5-star responses.
4. **Response Volume Chart** — Bar chart of daily/weekly response counts.
5. **Filterable Response Table** — Searchable, sortable table of all text feedback with score, date, user, page URL.
6. **CSV Export** — Download filtered responses as CSV.

### Should-Have (Strong Pro differentiators)

7. **Segmentation by User Properties** — Filter all charts by any user trait (plan type, role, etc.).
8. **Segmentation by Page URL** — See which pages generate the most feedback and what scores they get.
9. **Segmentation by Device** — Parse userAgent into device/browser/OS buckets.
10. **Bug Report View** — Dedicated filtered view for isBug=true responses.
11. **Pivot Table** — Cross any two dimensions (e.g., rating by page, NPS by plan type).

### Nice-to-Have (Future differentiators)

12. **AI Text Summarization** — Summarize common themes in text feedback.
13. **Sentiment Scoring** — Auto-classify text as positive/negative/neutral.
14. **Scheduled Email Digests** — Weekly summary of scores and trends.
15. **Smart Alerts** — Notify when NPS drops below threshold or response volume spikes.

---

## Pricing Context

| Competitor | Lowest Paid Plan | Target |
|-----------|-----------------|--------|
| Survicate | $65/month | SMB |
| Refiner | $79/month | SaaS |
| Delighted | $224/month | Mid-market |
| Hotjar | $279/month | Mid-market |
| UserVoice | $999/month | Enterprise |
| Pendo | Custom | Enterprise |
| Canny | Custom | Mid-market |

Gotcha's sweet spot as a lightweight SDK would be **under $50/month** for Pro, undercutting Survicate and Refiner while offering the Tier 1 and Tier 2 features above.

---

## Sources

- [Hotjar NPS Tracking](https://www.hotjar.com/net-promoter-score/tracking/)
- [Hotjar Dashboards](https://www.hotjar.com/dashboards/how-to-use/)
- [Hotjar for Data Analytics](https://www.hotjar.com/blog/hotjar-for-data-analytics/)
- [UserVoice Pricing](https://uservoice.com/pricing)
- [Canny User Segmentation](https://feedback.canny.io/changelog/user-segmentation)
- [Canny Reporting Requests](https://feedback.canny.io/feature-requests/p/reporting-analytics)
- [Pendo NPS Metrics](https://support.pendo.io/hc/en-us/articles/44452142059675-Understand-NPS-metrics)
- [Pendo NPS Dashboard Widgets](https://support.pendo.io/hc/en-us/articles/360032752991-Dashboard-widgets)
- [Pendo NPS Revenue Insights](https://support.pendo.io/hc/en-us/articles/360032203591-NPS-Revenue-Insights)
- [Pendo NPS Insights Blog](https://www.pendo.io/pendo-blog/introducing-nps-insights/)
- [Survicate Dashboards](https://survicate.com/features/dashboards/)
- [Survicate Survey Analysis](https://survicate.com/how-to-analyze-survey-data/)
- [Survicate Pricing](https://survicate.com/pricing/)
- [Delighted Features](https://delighted.com/features)
- [Delighted Reporting](https://delighted.com/reporting)
- [Delighted Pivot Table](https://help.delighted.com/article/547-the-pivot-table-report)
- [Delighted Pricing](https://delighted.com/pricing)
- [Refiner Reporting Dashboard](https://refiner.io/features/reporting-dashboard/)
- [Refiner NPS Solution](https://refiner.io/solutions/nps/)
- [Refiner Pricing](https://refiner.io/pricing/)
