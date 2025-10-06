# On-Call Rotation Plan

**Project:** Brisa Cubana Clean Intelligence
**Version:** 1.0
**Last Updated:** 6 de octubre de 2025
**Owner:** Platform Engineering & SRE Team

---

## Executive Summary

This document defines the on-call rotation structure, responsibilities, escalation procedures, and compensation policies for Brisa Cubana Clean Intelligence. The on-call system ensures 24/7 availability to respond to production incidents and maintain service reliability.

**Rotation Schedule:** Weekly rotation (Monday 9:00 AM to Monday 9:00 AM EST)
**Coverage:** 24/7/365
**Response SLA:** 5 minutes (Sev1), 15 minutes (Sev2)
**Team Size:** 3-5 engineers minimum

---

## Table of Contents

- [Rotation Structure](#rotation-structure)
- [On-Call Responsibilities](#on-call-responsibilities)
- [Escalation Matrix](#escalation-matrix)
- [Response SLAs by Severity](#response-slas-by-severity)
- [Handoff Process](#handoff-process)
- [Compensation & Policies](#compensation--policies)
- [Tools & Access](#tools--access)
- [Training Requirements](#training-requirements)
- [Appendix](#appendix)

---

## Rotation Structure

### Schedule Format

**Primary On-Call Schedule:**

- **Duration:** 7 days (Monday 9:00 AM EST → Monday 9:00 AM EST)
- **Rotation Type:** Weekly round-robin
- **Coverage:** 24/7 including weekends and holidays
- **Notification:** 1 week advance notice

**Secondary On-Call Schedule:**

- **Duration:** Same 7-day period as primary
- **Purpose:** Backup if primary doesn't respond within SLA
- **Auto-escalation:** After 10 minutes (Sev1), 20 minutes (Sev2)

**Business Hours Support:**

- **Hours:** Monday-Friday, 9:00 AM - 6:00 PM EST
- **Purpose:** Non-urgent issues, customer escalations, planned maintenance
- **Rotation:** Separate from 24/7 on-call

### Rotation Calendar

| Week | Primary Engineer | Secondary Engineer | Business Hours |
| ---- | ---------------- | ------------------ | -------------- |
| 1    | Engineer A       | Engineer B         | Engineer C     |
| 2    | Engineer B       | Engineer C         | Engineer A     |
| 3    | Engineer C       | Engineer A         | Engineer B     |
| 4    | Engineer A       | Engineer B         | Engineer C     |

**Rotation Tools:**

- PagerDuty: Automated scheduling and notifications
- Google Calendar: Shared calendar with rotation schedule
- Slack: #on-call-schedule channel for updates

### Holiday Coverage

**Major Holidays:** Double compensation + comp day off

- New Year's Day
- Memorial Day
- Independence Day (July 4)
- Labor Day
- Thanksgiving
- Christmas Day

**Holiday Coverage Rules:**

1. Holiday shifts are assigned 3 weeks in advance
2. Engineers can trade shifts with manager approval
3. Senior engineers take priority for holiday coverage (compensated accordingly)
4. No engineer covers more than 2 major holidays per year

---

## On-Call Responsibilities

### During On-Call Shift

#### 1. Availability Requirements

- **Response Time:** Acknowledge alerts within SLA (5min Sev1, 15min Sev2)
- **Reachability:** Must be reachable via phone, PagerDuty, Slack
- **Internet Access:** Reliable internet connection required
- **Equipment:** Laptop with VPN access, fully charged phone
- **Sobriety:** Must be able to respond effectively (no alcohol/substances)

#### 2. Incident Response

- Acknowledge all alerts immediately
- Assess severity and declare incident if needed
- Follow incident response runbook ([INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md))
- Engage appropriate SMEs from escalation matrix
- Document all actions in incident channel
- Update status page for customer-facing incidents
- Coordinate with stakeholders (product, support, leadership)

#### 3. Communication

- Post initial assessment within 10 minutes of alert
- Provide status updates every 15 minutes (Sev1) or 30 minutes (Sev2)
- Use standard incident templates for communications
- Update Slack, PagerDuty, and status page
- Notify customers via support channels if customer-facing

#### 4. Documentation

- Maintain incident timeline in Slack thread
- Document root cause analysis
- Schedule post-mortem within 48 hours
- Create JIRA tickets for follow-up items
- Update runbooks if gaps identified

#### 5. Monitoring

- Review dashboards at start and end of shift
- Check alert backlogs and acknowledge false positives
- Validate monitoring and alerting health
- Proactively identify and address potential issues

### Outside of Incidents

**Proactive Responsibilities:**

- Daily health check review (9:00 AM EST)
- Weekly dashboard review for trends
- Review and update runbooks quarterly
- Participate in on-call training and drills
- Contribute to incident post-mortems
- Improve monitoring and alerting

---

## Escalation Matrix

### Level 1: On-Call Engineer (Primary)

**Response Time:** 5 minutes (Sev1), 15 minutes (Sev2)
**Responsibilities:**

- Initial triage and assessment
- Execute standard runbooks
- Declare incidents
- Engage Level 2 if needed

**Escalate to Level 2 if:**

- Incident persists after 30 minutes
- Requires architectural/design decisions
- Affects multiple systems
- Database or infrastructure changes needed

---

### Level 2: Subject Matter Experts (SMEs)

#### Backend/API SME

- **Contact:** Backend team lead
- **Expertise:** Hono API, Prisma, business logic, integrations
- **Response SLA:** 15 minutes
- **Escalation Trigger:** API errors, database issues, payment failures

#### Frontend/Web SME

- **Contact:** Frontend team lead
- **Expertise:** Next.js, React, UI/UX, authentication
- **Response SLA:** 15 minutes
- **Escalation Trigger:** Web app failures, auth issues, rendering problems

#### Database SME

- **Contact:** Database administrator
- **Expertise:** PostgreSQL, migrations, performance tuning
- **Response SLA:** 15 minutes
- **Escalation Trigger:** Database performance, data integrity, connection issues

#### Infrastructure/Platform SME

- **Contact:** Platform engineer
- **Expertise:** Railway, Vercel, Docker, networking
- **Response SLA:** 15 minutes
- **Escalation Trigger:** Deployment issues, infrastructure outages, scaling problems

#### Security SME

- **Contact:** Security officer
- **Expertise:** Security incidents, data breaches, compliance
- **Response SLA:** 10 minutes
- **Escalation Trigger:** Security alerts, suspected breaches, data exposure

---

### Level 3: Engineering Leadership

- **Contact:** Engineering Manager / Director of Engineering
- **Response SLA:** 30 minutes (Sev1), 1 hour (Sev2)
- **Escalation Trigger:**
  - Incident duration > 2 hours
  - Multiple system failures
  - Customer escalations
  - PR/media involvement
  - Requires cross-functional coordination

**Responsibilities:**

- Incident command for major incidents
- Resource allocation decisions
- Customer/stakeholder communication
- Post-incident process coordination

---

### Level 4: Executive Leadership

- **Contact:** CTO / VP Engineering
- **Response SLA:** 1 hour
- **Escalation Trigger:**
  - Incident duration > 4 hours
  - Revenue impact > $10K
  - Data breach or security incident
  - Regulatory/compliance issues
  - Media/PR crisis

---

### Emergency Contacts

| Role                    | Primary Contact     | Secondary Contact   | Phone           | Email                       |
| ----------------------- | ------------------- | ------------------- | --------------- | --------------------------- |
| On-Call Primary         | [Rotation Schedule] | [Rotation Schedule] | [PagerDuty]     | oncall@brisacubana.com      |
| Engineering Manager     | [Name]              | [Name]              | +1-XXX-XXX-XXXX | engineering@brisacubana.com |
| Director of Engineering | [Name]              | [Name]              | +1-XXX-XXX-XXXX | director@brisacubana.com    |
| CTO                     | [Name]              | [Name]              | +1-XXX-XXX-XXXX | cto@brisacubana.com         |
| Database Administrator  | [Name]              | [Name]              | +1-XXX-XXX-XXXX | dba@brisacubana.com         |
| Security Officer        | [Name]              | [Name]              | +1-XXX-XXX-XXXX | security@brisacubana.com    |
| Product Manager         | [Name]              | [Name]              | +1-XXX-XXX-XXXX | product@brisacubana.com     |
| Customer Support Lead   | [Name]              | [Name]              | +1-XXX-XXX-XXXX | support@brisacubana.com     |

**External Vendors:**

- **Railway Support:** support@railway.app (Enterprise SLA: 1 hour)
- **Vercel Support:** support@vercel.com (Pro SLA: 4 hours)
- **Stripe Support:** 24/7 phone support (visible in dashboard)
- **Sentry Support:** support@sentry.io (Business SLA: 8 hours)

---

## Response SLAs by Severity

### Sev1: Critical - Total Service Outage

**Impact:** Complete service unavailable, data loss, or security breach

**Response SLAs:**

- **Acknowledgement:** ≤ 5 minutes
- **Initial Assessment:** ≤ 10 minutes
- **Status Update Frequency:** Every 15 minutes
- **Resolution Target:** ≤ 1 hour
- **Post-Mortem:** Within 48 hours

**Examples:**

- API completely down (health check failing)
- Web application inaccessible
- Database unavailable or corrupted
- Payment processing completely stopped
- Security breach or data exposure
- Authentication system down (all users locked out)

**Escalation Path:**

1. Primary on-call → Immediate response
2. Secondary on-call (auto-page after 10 min)
3. Engineering Manager (if unresolved after 30 min)
4. CTO (if unresolved after 2 hours)

---

### Sev2: Major - Significant Degradation

**Impact:** Major feature unavailable or severe performance degradation

**Response SLAs:**

- **Acknowledgement:** ≤ 15 minutes
- **Initial Assessment:** ≤ 20 minutes
- **Status Update Frequency:** Every 30 minutes
- **Resolution Target:** ≤ 4 hours
- **Post-Mortem:** Within 72 hours

**Examples:**

- Error rate > 5%
- API response time p95 > 2 seconds
- Payment processing delayed but functional
- CleanScore calculation failing
- Booking flow partially broken
- Database performance degraded (queries slow)

**Escalation Path:**

1. Primary on-call → Immediate response
2. Secondary on-call (auto-page after 20 min)
3. Engineering Manager (if unresolved after 2 hours)
4. Director of Engineering (if unresolved after 4 hours)

---

### Sev3: Minor - Limited Impact

**Impact:** Non-critical feature unavailable or minor performance issue

**Response SLAs:**

- **Acknowledgement:** ≤ 1 hour
- **Initial Assessment:** ≤ 2 hours
- **Status Update Frequency:** Every 4 hours
- **Resolution Target:** ≤ 24 hours
- **Post-Mortem:** Optional (recommended if recurring)

**Examples:**

- Non-critical API endpoint error
- UI visual bug (not blocking workflows)
- Email notification delays
- Dashboard chart not loading
- Third-party integration degraded (non-critical)

**Escalation Path:**

1. Primary on-call → Response during business hours if off-hours
2. Engineering Manager (if unresolved after 24 hours)

---

### Sev4: Informational - No Service Impact

**Impact:** Monitoring alerts, questions, or minor issues

**Response SLAs:**

- **Acknowledgement:** Next business day
- **Resolution Target:** As scheduled
- **Post-Mortem:** Not required

**Examples:**

- Informational alerts
- Support questions
- Feature requests
- Non-urgent bugs
- Documentation issues

**Escalation Path:**

1. Triage during business hours
2. Add to backlog or support queue

---

## Handoff Process

### Pre-Handoff Checklist (Outgoing Engineer)

**24 Hours Before Handoff:**

- [ ] Review upcoming maintenance windows
- [ ] Check for known issues or degraded services
- [ ] Update any active incident documentation
- [ ] Prepare handoff notes document

**1 Hour Before Handoff:**

- [ ] Review open incidents and their status
- [ ] Document any workarounds or temporary fixes
- [ ] List any monitoring alerts to watch
- [ ] Prepare list of recent escalations or issues

### Handoff Meeting (30 Minutes)

**Required Attendees:**

- Outgoing on-call engineer
- Incoming on-call engineer
- (Optional) Engineering manager for complex situations

**Agenda:**

1. **Active Incidents Review (10 min)**
   - Current status of any open incidents
   - Actions taken and next steps
   - Known issues and workarounds

2. **Recent History (10 min)**
   - Incidents from past week
   - Patterns or trends observed
   - False positives to be aware of

3. **Upcoming Events (5 min)**
   - Scheduled maintenance windows
   - Planned deployments
   - Known risks or concerns

4. **System Health (5 min)**
   - Current performance metrics
   - Any degraded services
   - Monitoring dashboard walkthrough

**Handoff Document Template:**

```markdown
# On-Call Handoff - [Date]

## Outgoing: [Name] → Incoming: [Name]

### Active Incidents

- [Incident ID]: [Brief description] - Status: [Open/Monitoring/Resolved]
  - Actions taken: [List]
  - Next steps: [List]
  - Watch for: [Specific metrics/alerts]

### Recent Incidents (Past 7 Days)

- [Date] - Sev[X]: [Brief description] - [Resolution summary]

### Known Issues

- [Issue]: [Description] - Workaround: [Details]

### Upcoming Events

- [Date/Time]: [Scheduled maintenance/deployment]

### System Health

- API: [Status] - [Any notes]
- Web: [Status] - [Any notes]
- Database: [Status] - [Any notes]
- Key Metrics: [Error rate, response time, etc.]

### Action Items for Incoming Engineer

- [ ] Monitor [specific metric/service]
- [ ] Follow up on [incident/issue]
- [ ] Watch for [potential problem]

### Notes

[Any additional context or concerns]
```

### Post-Handoff Verification (Incoming Engineer)

**Within 30 Minutes:**

- [ ] Confirm PagerDuty schedule updated
- [ ] Test alert notifications (phone, SMS, Slack)
- [ ] Verify access to all required systems
- [ ] Review monitoring dashboards
- [ ] Read handoff document and ask clarifying questions
- [ ] Post confirmation in #on-call-schedule Slack channel

**Within 2 Hours:**

- [ ] Review recent incident post-mortems
- [ ] Check status page for any ongoing issues
- [ ] Validate runbook access and familiarity
- [ ] Test VPN and remote access
- [ ] Familiarize with week's deployment schedule

---

## Compensation & Policies

### On-Call Pay Structure

#### Base On-Call Stipend

- **Weekday On-Call:** $200/week (Monday-Friday)
- **Weekend On-Call:** $300/weekend (Saturday-Sunday)
- **Full Week (including weekend):** $400/week

**Payment Schedule:** Added to next bi-weekly paycheck

#### Incident Response Compensation

**Hourly Rate:** 1.5x normal hourly rate

**After-Hours Incident Response:**

- Minimum: 1 hour compensation per incident
- Billed in 30-minute increments after first hour
- Example: 25-minute incident = 1 hour pay, 75-minute incident = 1.5 hours pay

**Business Hours Incident Response:**

- Part of normal duties, no additional compensation
- Exception: Incidents extending beyond normal work hours

#### Holiday Coverage

- **Major Holiday:** 2x on-call stipend + comp day off
- **Minor Holiday:** 1.5x on-call stipend

### Time Off and Swaps

#### Pre-Planned Time Off

- Submit PTO at least 2 weeks in advance
- Arrange coverage swap with team
- Manager approval required
- Update PagerDuty schedule

#### Emergency Time Off

- Contact on-call manager immediately
- Manager arranges emergency coverage
- No penalty for genuine emergencies

#### Shift Swaps

- Allowed with mutual agreement between engineers
- Both engineers must confirm in #on-call-schedule
- Update PagerDuty schedule
- No manager approval needed for like-for-like swaps
- Manager approval required for unequal swaps

### Burnout Prevention

#### Maximum On-Call Load

- No more than 1 week in 4 (25% of time)
- Minimum 2 weeks between on-call rotations
- No consecutive weeks except emergencies
- No more than 2 major holidays per year

#### Post-Incident Recovery

- After Sev1 incident > 4 hours: Half-day comp time
- After overnight incident (10 PM - 6 AM): Late start next day (11 AM)
- After weekend incident > 2 hours: Additional comp day

#### Opt-Out Policy

- Engineers can opt-out with 1 month notice
- Must be replaced in rotation
- Performance not affected by opt-out
- Junior engineers (< 6 months) automatically opted-out

### Performance & Expectations

#### Positive Performance Indicators

- Alert acknowledgement within SLA
- Effective incident resolution
- Quality post-mortem documentation
- Proactive issue identification
- Runbook improvements

#### Performance Issues

- Repeated missed alerts (> 3 per rotation)
- Failure to escalate appropriately
- Inadequate documentation
- Unprofessional communication

**Remediation Process:**

1. First occurrence: Verbal coaching
2. Second occurrence: Written warning + additional training
3. Third occurrence: Removal from rotation + PIP

---

## Tools & Access

### Required Access

**Before First On-Call Shift:**

- [ ] PagerDuty account with mobile app configured
- [ ] Slack workspace with notifications enabled
- [ ] VPN access configured and tested
- [ ] Railway CLI authenticated
- [ ] Vercel CLI authenticated
- [ ] AWS Console access (if applicable)
- [ ] Sentry access with admin permissions
- [ ] Database access (read-only for troubleshooting)
- [ ] Status page admin access
- [ ] GitHub repository access
- [ ] Documentation access (Notion, Confluence, etc.)

### Monitoring Dashboards

**Primary Dashboards:**

1. **Service Health Dashboard**
   - URL: https://status.brisacubana.com/dashboard
   - Metrics: Uptime, error rate, response time
   - Refresh: Every 30 seconds

2. **Application Performance Monitoring (APM)**
   - Sentry: https://sentry.io/organizations/brisa-cubana
   - Real-time errors, performance metrics
   - Alert integration

3. **Infrastructure Monitoring**
   - Railway: https://railway.app/dashboard
   - Vercel: https://vercel.com/dashboard
   - Resource usage, deployments, logs

4. **Business Metrics**
   - Bookings dashboard
   - Payment processing status
   - Customer support queue

### Communication Channels

**Slack Channels:**

- `#incidents` - Active incident coordination
- `#on-call-schedule` - Schedule updates and handoffs
- `#engineering-alerts` - Automated alerts from monitoring
- `#platform-team` - Platform team discussions
- `#customer-support` - Customer escalations

**PagerDuty:**

- Mobile app: Primary alert method
- SMS backup: Configured automatically
- Phone call: Escalation after 5 minutes (Sev1)

### Runbooks & Documentation

**Essential Runbooks:**

- [ON_CALL_HANDBOOK.md](./runbooks/ON_CALL_HANDBOOK.md) - On-call procedures
- [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md) - Incident handling
- [ROLLBACK.md](./runbooks/ROLLBACK.md) - Deployment rollback procedures
- [GO_LIVE.md](./runbooks/GO_LIVE.md) - Go-live checklist

**Knowledge Base:**

- Architecture documentation
- API documentation
- Database schema documentation
- Third-party integration guides
- Previous incident post-mortems

---

## Training Requirements

### Initial On-Call Certification

**Prerequisites (Before Joining Rotation):**

- [ ] 6+ months tenure with company
- [ ] Completed on-call training program
- [ ] Shadow 2 full on-call shifts
- [ ] Pass on-call simulation/drill
- [ ] Manager sign-off

### On-Call Training Program (8 Hours)

**Module 1: Incident Response Fundamentals (2 hours)**

- Severity classification
- Escalation procedures
- Communication protocols
- Post-mortem process

**Module 2: Technical Deep-Dive (3 hours)**

- System architecture overview
- Common failure modes
- Debugging techniques
- Runbook walkthroughs

**Module 3: Tools & Access (2 hours)**

- PagerDuty configuration
- Monitoring dashboards
- Log aggregation (Sentry, Railway)
- Remote access and VPN

**Module 4: Practical Simulation (1 hour)**

- Simulated incidents
- Real-time response practice
- Team coordination exercise
- Feedback and improvement

### Shadow Shifts

**Shadow Rotation Requirements:**

- 2 full 7-day shadow shifts (can be non-consecutive)
- Observe primary on-call engineer
- Participate in handoff meetings
- Review all incidents and alerts
- Document learnings

**Shadow Responsibilities:**

- Monitor alerts alongside primary
- Review dashboards independently
- Suggest improvements or ask questions
- Complete shadow shift report

### Ongoing Training

**Quarterly Requirements:**

- Incident response drill participation
- Runbook review and updates
- New tools/features training
- Previous quarter incident review

**Annual Requirements:**

- Full system architecture refresh
- Security incident training
- Disaster recovery drill
- On-call process improvements workshop

### Continuous Improvement

**Knowledge Sharing:**

- Monthly on-call retro meeting
- Incident learnings shared in team meetings
- Runbook updates after each incident
- Best practices documentation

---

## Appendix

### A. On-Call Rotation Schedule Template

**Google Calendar Setup:**

```
Calendar Name: Brisa Cubana - On-Call Rotation
Sharing: Team-wide (view only)
Event Frequency: Weekly recurring
Event Format: "[Primary] On-Call - [Name]"
Reminders: 1 week before, 1 day before, 1 hour before
```

**PagerDuty Configuration:**

```yaml
Schedule: Primary On-Call
Rotation Type: Weekly
Start Time: Monday 9:00 AM EST
Handoff Window: 30 minutes (8:30 AM - 9:00 AM)
Escalation Policy:
  - Level 1: Primary (0 min)
  - Level 2: Secondary (10 min)
  - Level 3: Engineering Manager (30 min)
```

### B. Incident Severity Decision Tree

```
                   [Alert Triggered]
                          |
                          v
                  Is service completely down?
                     /              \
                   YES               NO
                    |                 |
                    v                 v
                  SEV 1         Is major feature broken?
                                 /              \
                               YES              NO
                                |                |
                                v                v
                              SEV 2      Error rate > 5%?
                                          /           \
                                        YES            NO
                                         |              |
                                         v              v
                                       SEV 2      Is it customer-facing?
                                                   /            \
                                                 YES            NO
                                                  |              |
                                                  v              v
                                                SEV 3          SEV 4
```

### C. Communication Templates

**Sev1 Incident Announcement:**

```
🚨 SEV 1 INCIDENT DECLARED 🚨

Summary: [Brief description]
Impact: [What's affected]
Started: [Timestamp]
Incident Commander: [Name]
Status Channel: #incident-[YYYYMMDD-HHMM]

Current Status: Investigating
ETA for Update: [15 minutes from now]

Status Page: Updated
Customer Notification: [Yes/Pending/Not Required]
```

**Incident Resolution:**

```
✅ INCIDENT RESOLVED

Summary: [Brief description]
Duration: [Start time] - [End time] ([Duration])
Root Cause: [Brief explanation]
Impact: [What was affected]
Resolution: [What fixed it]

Post-Mortem: Scheduled for [Date/Time]
Follow-up Actions: [JIRA ticket links]
```

### D. On-Call Metrics

**Weekly Metrics to Track:**

- Total alerts received
- Alerts by severity
- Response time (mean, p50, p95)
- Escalations required
- Incidents resolved
- Mean time to resolution (MTTR)
- False positive rate

**Monthly Review Metrics:**

- On-call engineer satisfaction score
- Incident trends
- Runbook usage and gaps
- Training completion rate
- Escalation patterns

### E. Troubleshooting Quick Reference

**Cannot Access System:**

1. Verify VPN connection
2. Check account status (not locked)
3. Verify IP allowlist
4. Contact IT support

**Cannot Acknowledge Alert:**

1. Check PagerDuty mobile app
2. Acknowledge via web interface
3. Acknowledge via phone (call PagerDuty number)
4. Contact secondary on-call

**Unclear Alert:**

1. Check runbook for alert name
2. Review recent incidents with same alert
3. Examine logs and metrics
4. Escalate to SME if still unclear

---

## Document Control

**Version History:**

| Version | Date       | Author        | Changes                       |
| ------- | ---------- | ------------- | ----------------------------- |
| 1.0     | 2025-10-06 | Platform Team | Initial on-call rotation plan |

**Review Schedule:**

- **Monthly:** Rotation schedule and contact information
- **Quarterly:** SLAs, escalation matrix, compensation
- **Annually:** Full document review and update

**Approval:**

- Engineering Manager: ********\_******** Date: **\_\_\_**
- Director of Engineering: ********\_******** Date: **\_\_\_**
- CTO: ********\_******** Date: **\_\_\_**

**Next Review Date:** January 6, 2026

---

**Related Documents:**

- [ON_CALL_HANDBOOK.md](./runbooks/ON_CALL_HANDBOOK.md)
- [INCIDENT_RESPONSE.md](./runbooks/INCIDENT_RESPONSE.md)
- [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
- [Incident Report Template](./templates/incident-report-template.md)
