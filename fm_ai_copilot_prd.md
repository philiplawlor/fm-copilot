# Product Requirements Document: Facilities Management AI Copilot

## Executive Summary

**Product Name:** FM Copilot

**Vision:** A pragmatic AI assistant that sits on top of existing CMMS/BMS systems to reduce administrative burden, improve maintenance workflows, and help facility managers and technicians work smarter without requiring perfect data or wholesale system replacement.

**Target Users:** Facility managers, maintenance technicians, and operations teams managing single or multi-site portfolios, particularly those with limited resources and imperfect data infrastructure.

**Architectural Decisions:** This is a SaaS application that will be deployed on a cloud platform (AWS, GCP, Azure, Plesk Portainer). The application will be containerized using Docker Compose. This application will be multi-tenant and will use a database to store user data and organization data. It will include a tenant isolation layer to prevent data from one organization from being accessible by another organization and include an organizational user management system to manage users and their access to data, including inviting users to an organization and assigning roles to users and reset passwords. Allow for billing control and user management through an organization admin interface. Include an administrative screen for FM Copilot to manage users, organizations, and billing, include a subscription management system to manage subscriptions, subscription holds, and payment processing, and include a logging system to log all actions and events.

---

## Problem Statement

Facility management teams are drowning in administrative work, manual scheduling, and fragmented data. Current "AI-powered" CMMS solutions overpromise and underdeliver, requiring clean data and extensive setup that small teams cannot afford. What's needed is a practical copilot that works with messy, real-world data and delivers tangible time savings within the first week of use.

### Key Pain Points

- Manual creation of preventive maintenance schedules for new assets
- Unstructured work requests that require interpretation and manual triage
- Complex dispatch decisions based on skills, location, workload, and vendor performance
- Time-consuming documentation and stakeholder communication
- Incomplete asset inventories and poor handover from construction to operations
- Skepticism around "AI-powered" marketing claims with no concrete use cases

---

## Product Goals

### Primary Goals

1. **Reduce administrative time by 40%** for work order processing and PM scheduling
2. **Show measurable value within 7 days** of deployment
3. **Work with imperfect data** and help teams incrementally improve data quality
4. **Integrate seamlessly** with existing CMMS/BMS/SCADA systems without requiring replacement

### Success Metrics

- Time to create work order (baseline vs. with copilot)
- Percentage of work orders auto-triaged correctly
- User-reported time savings on documentation tasks
- Adoption rate among technicians and managers
- Reduction in emergency/reactive maintenance incidents

---

## Target Users

### Primary Personas

**1. Facility Manager (Sarah)**
- Manages 5-15 properties across multiple states
- Juggles budgets, vendor relationships, and stakeholder reporting
- Frustrated by time spent writing CapEx justifications and status updates
- Needs help with scheduling, prioritization, and communication

**2. Maintenance Technician (Marcus)**
- Handles day-to-day repairs and preventive maintenance
- Receives vague work requests like "machine is weird again"
- Wants clear, prioritized work orders with relevant asset history
- Limited time for data entry or complex software

**3. Operations Director (Jennifer)**
- Oversees facilities teams for large portfolio
- Makes decisions on vendor contracts and capital investments
- Needs digestible summaries of technical issues for non-technical stakeholders
- Values proof of ROI and efficiency gains

---

## Core Features

### Phase 1: MVP (Weeks 1-12)

#### 1. Intelligent Work Order Intake
**Problem:** Messy, unstructured maintenance requests waste time on triage and clarification.

**Solution:**
- AI-powered form that accepts natural language requests
- Automatically extracts key information: asset, issue type, urgency, location
- Links request to correct asset in CMMS database
- Suggests priority level based on issue type and asset criticality
- Generates structured work order with pre-filled fields

**User Flow:**
1. User types or speaks: "Chiller in Building 3 making loud noise, seems like it might be the compressor"
2. Copilot identifies: Asset = "Chiller #3-01", Issue Type = "Abnormal Noise", Component = "Compressor", Priority = "High"
3. Pulls recent history: shows last 3 work orders on this chiller
4. Suggests assignment: "Marcus (HVAC-certified, on-site today)" or "ABC Mechanical (contract, 2hr SLA)"
5. Creates draft work order for manager approval or auto-submits based on rules

**Acceptance Criteria:**
- 80% of common requests correctly parsed and structured
- Work order creation time reduced from 5-8 minutes to under 2 minutes
- Integration with top 5 CMMS platforms (Fiix, UpKeep, Maintenance Connection, ServiceChannel, FMX)

#### 2. Smart Tech & Vendor Dispatch
**Problem:** Dispatch decisions consider skills, location, workload, vendor performance, and site-specific quirks—currently all manual.

**Solution:**
- Assignment recommendation engine considering:
  - Technician certifications and skill match
  - Current location and travel time
  - Current workload and capacity
  - Historical performance on similar issues
  - Vendor SLAs, costs, and past reliability
  - Site access requirements and restrictions

**User Flow:**
1. New work order created for electrical issue at Site A
2. Copilot shows top 3 options:
   - "Marcus (electrical cert, currently at Site B - 15 min away, 3 open tickets)"
   - "Lisa (electrical cert, at Site A, 1 open ticket) - RECOMMENDED"
   - "Smith Electric ($180 avg, 4-star rating, 4hr response SLA)"
3. Manager clicks "Assign to Lisa" or accepts recommendation
4. Notification sent with work order details, asset location, and relevant history

**Acceptance Criteria:**
- Recommendation accuracy of 75% (manager accepts top suggestion)
- Factors in at least 5 decision variables
- Updates in real-time as technician availability changes

#### 3. Preventive Maintenance Auto-Setup
**Problem:** New assets require manual PM schedule creation, often copied from similar equipment.

**Solution:**
- Asset type recognition from CMMS or manual input
- Auto-suggests PM template based on manufacturer recommendations, industry standards, and similar existing assets
- Generates task lists with frequencies, required tools, and estimated time
- Allows quick customization before finalizing

**User Flow:**
1. New RTU (rooftop unit) added to Building 7
2. Copilot detects new asset, prompts: "Would you like me to set up a PM schedule?"
3. Shows suggested template: "Based on Carrier RTU Model 50TC and your existing rooftop units, I recommend quarterly filter changes, semi-annual coil cleaning, annual refrigerant check..."
4. Manager reviews, adjusts frequency or tasks, approves
5. PM schedule created and assigned to appropriate technician

**Acceptance Criteria:**
- Template library covers 50+ common asset types
- 90% of suggested PM schedules accepted with minor or no modifications
- Setup time reduced from 30-45 minutes to under 5 minutes

---

### Phase 2: Enhanced Intelligence (Weeks 13-24)

#### 4. Predictive Maintenance Alerts
**Problem:** Teams react to failures instead of preventing them.

**Solution:**
- Analyzes asset work order history and patterns
- Integrates sensor data where available (temperature, vibration, runtime)
- Flags assets likely to fail in next 30-90 days
- Automatically creates preventive work orders before breakdown

**Features:**
- Failure probability score and confidence level
- "Assets at Risk" dashboard with ranked priorities
- Configurable alert thresholds and notification preferences
- Learning from false positives/negatives to improve accuracy

#### 5. Documentation Assistant
**Problem:** Writing SOPs, safety protocols, and CapEx justifications takes hours.

**Solution:**
- Generate first drafts of standard documents from templates
- Tailor SOPs to specific sites while maintaining core procedures
- Create stakeholder-friendly summaries of technical issues
- Draft capital expenditure justifications with ROI calculations

**Templates:**
- Safety procedures for common tasks
- Asset operation and maintenance SOPs
- Incident reports and root cause analysis
- Budget proposals and CapEx requests
- Monthly/quarterly management reports

**User Flow (CapEx Example):**
1. Manager needs to justify replacing aging boiler
2. Inputs: asset ID, proposed replacement, estimated cost
3. Copilot generates draft including:
   - Current asset condition and repair history
   - Cost of recent repairs and projected future costs
   - Energy efficiency comparison
   - Risk of failure and business impact
   - ROI calculation and payback period
4. Manager reviews, edits, exports to PDF or Word

#### 6. Asset Inventory Builder
**Problem:** Many teams lack complete, accurate asset inventories, especially for utilities and infrastructure.

**Solution:**
- Guided asset survey workflow for technicians
- Photo and label recognition to auto-populate asset details
- Map view showing asset locations within facilities
- Flags missing or incomplete asset records
- Progressive improvement—works with partial data and improves over time

---

### Phase 3: Advanced Integration (Weeks 25+)

#### 7. Handover Assistant
**Problem:** Construction-to-operations handoff leaves facilities teams with incomplete data and tribal knowledge.

**Solution:**
- Ingest O&M manuals, as-built drawings, and vendor documentation
- Extract and structure key information (asset specs, warranty terms, maintenance requirements)
- Create searchable knowledge base linked to physical assets
- Surface relevant information when work orders are created
- Chat interface: "What's the warranty status on the main electrical panel in Building 4?"

#### 8. Predictive Scheduling & Resource Optimization
**Problem:** Balancing PM schedules, reactive work, projects, staffing, and budget constraints is complex and manual.

**Solution:**
- Optimize weekly/monthly schedules considering:
  - PM due dates with flexibility windows
  - Reactive work priorities
  - Technician availability and overtime limits
  - Seasonal factors and historical patterns
  - Budget remaining and spending pace
- Suggest schedule adjustments when conflicts arise
- Simulate "what-if" scenarios for staffing or budget changes

---

## Technical Architecture

### Integration Approach

**API-First Design:**
- RESTful APIs to connect with major CMMS platforms
- Webhook support for real-time updates
- BMS/SCADA integration via standard protocols (BACnet, Modbus)
- Fallback: CSV import/export for systems without APIs

**Data Strategy:**
- Work with incomplete data—highlight gaps rather than refusing to function
- Incremental data quality improvement through usage
- Local caching for offline capability
- Privacy-first: customer data never used to train shared models

### Tech Stack Recommendations

**Frontend:**
- React/Next.js for responsive web application
- Mobile-responsive design (no native app in Phase 1)
- Progressive Web App (PWA) capabilities

**Backend:**
- Node.js or Python microservices architecture
- MySQL for structured data
- Vector database for semantic search (asset documentation, history)
- Redis for caching and real-time updates

**AI/ML:**
- Large language models for natural language understanding and generation
- Custom classification models for work order triage
- Time-series analysis for predictive maintenance
- Continuously fine-tuned on customer feedback

**Infrastructure:**
- Cloud-hosted (AWS/Azure/GCP) with SOC2 compliance
- Multi-tenant architecture with data isolation
- 99.9% uptime SLA

---

## User Experience Principles

### Design Philosophy

1. **Show, don't tell:** Demonstrate value immediately with time saved and tasks simplified
2. **Copilot, not autopilot:** AI suggests, humans decide (especially in Phase 1)
3. **Transparent reasoning:** Always show why AI made a recommendation
4. **Graceful degradation:** Work with whatever data exists, improve incrementally
5. **Mobile-first mindset:** Technicians often work from tablets or phones on-site

### Key UX Patterns

**Dashboard:**
- "Today's Priorities" with AI-ranked work orders
- "Assets at Risk" for proactive attention
- "Time Saved This Week" to reinforce value

**Chat Interface:**
- Quick commands: "Create work order", "Find asset", "Show PM schedule"
- Natural conversation for complex queries
- Context-aware based on user role and current location

**Notification Strategy:**
- Smart defaults: critical issues only, daily digest for everything else
- Per-user customization
- In-app, email, and SMS options

---

## Go-to-Market Strategy

### Pricing Model

**Tiered SaaS:**
- **Starter:** $500/month - Up to 5 users, 1,000 work orders/month, core features
- **Professional:** $1,500/month - Up to 25 users, 5,000 work orders/month, all Phase 1-2 features
- **Enterprise:** Custom pricing - Unlimited users, volume discounts, dedicated support, custom integrations

**Free Trial:**
- 14-day full-feature trial
- Demo data pre-loaded for instant value demonstration
- Onboarding concierge to ensure first work order processed within 24 hours

### Customer Acquisition

**Primary Channels:**
1. Reddit and online FM communities (authentic, helpful presence)
2. Facility management conferences and trade shows
3. Partnerships with CMMS vendors (integration marketplace listings)
4. Content marketing: practical guides, not AI hype
5. Referral program leveraging early adopters

**Messaging:**
- "Save 10 hours per week on admin work"
- "Works with your existing CMMS, not against it"
- "Built by facility pros, not just tech companies"
- "See results in your first week, not your first year"

---

## Success Criteria & KPIs

### Product Metrics
- Daily active users and engagement patterns
- Feature adoption rates
- Work orders processed through copilot vs. manually
- Time-to-value (days until first successful work order completion)
- AI suggestion acceptance rates

### Business Metrics
- Customer acquisition cost (CAC)
- Monthly recurring revenue (MRR) growth
- Customer lifetime value (LTV)
- Net revenue retention
- Net Promoter Score (NPS)

### User Satisfaction
- Time saved per user per week (self-reported and measured)
- Task completion rates
- Error rates (incorrect assignments, wrong priorities)
- Support ticket volume and nature

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|-----------|------------|
| AI recommendations are inaccurate | High | Medium | Start with human-in-loop for all decisions; track and learn from corrections; clear confidence scores |
| Integration complexity with legacy CMMS | High | High | Build adapters for top 5 platforms first; offer CSV workaround; dedicated integration support |
| Users distrust AI and don't adopt | High | Medium | Transparent reasoning; show time saved with data; start with low-risk use cases; user control always available |
| Data privacy concerns | Medium | Low | SOC2 compliance; clear data usage policies; on-premise option for enterprise |
| Competitive CMMS vendors build similar features | Medium | High | Faster iteration; better UX; platform-agnostic advantage; focus on execution |

---

## Timeline & Milestones

### Phase 1: MVP (Months 1-3)
- **Week 4:** Core integration with 2 CMMS platforms working
- **Week 8:** Intelligent work order intake beta with 10 pilot users
- **Week 12:** Public beta launch with all 3 core Phase 1 features

### Phase 2: Enhanced (Months 4-6)
- **Month 4:** Documentation assistant and predictive alerts in beta
- **Month 5:** Asset inventory builder launch
- **Month 6:** 100+ active customers, feedback-driven iteration

### Phase 3: Advanced (Months 7-12)
- **Month 8:** Handover assistant and advanced scheduling
- **Month 10:** Enterprise features and custom integrations
- **Month 12:** 500+ customers, Series A fundraising

---

## Appendix

### Competitive Landscape

**Direct Competitors:**
- AI modules within existing CMMS platforms (Fiix, UpKeep)
- Standalone predictive maintenance tools (Augury, 3DEXPERIENCE)

**Differentiation:**
- Platform-agnostic approach works with any CMMS
- Focus on daily workflow friction, not just dashboards
- Designed for imperfect data from day one
- Faster time-to-value (week vs. months)

### Research Sources
- Reddit r/FacilityManagement community feedback
- Twitter/X facilities management practitioner discussions
- IFMA and BOMA industry reports
- Direct interviews with facility managers (target: 50 interviews pre-launch)

### Open Questions
- Optimal balance between automation and human oversight?
- Mobile app necessity vs. responsive web?
- On-premise deployment timeline for enterprise customers?
- Integration with IoT sensor platforms priority?