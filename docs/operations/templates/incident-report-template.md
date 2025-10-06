# Incident Report: [Brief Title]

**Incident ID:** INC-YYYY-MM-DD-NNN
**Date:** [Date of Incident]
**Time:** [Start Time] - [End Time] (EST)
**Severity:** [Sev1 / Sev2 / Sev3 / Sev4]
**Status:** [Investigating / Mitigated / Resolved / Closed]

**Incident Commander:** [Name]
**Report Author:** [Name]
**Date Created:** [Date]
**Last Updated:** [Date]

---

## Executive Summary

[2-3 sentence overview of what happened, the impact, and the resolution. This should be understandable by non-technical stakeholders.]

**Key Metrics:**

- **Duration:** [X hours Y minutes]
- **Users Affected:** [Number or percentage]
- **Services Impacted:** [List services]
- **Revenue Impact:** [$Amount or "None"]
- **Downtime:** [Total downtime or "Partial degradation"]

---

## Incident Details

### Summary

[Detailed description of what occurred during the incident. Include what services were affected and how users experienced the issue.]

### Severity Classification

**Severity Level:** [Sev1 / Sev2 / Sev3 / Sev4]

**Justification:**
[Explain why this severity level was chosen based on the severity criteria]

- Sev1: Complete service outage, data loss, or security breach
- Sev2: Major feature unavailable or severe performance degradation
- Sev3: Non-critical feature unavailable or minor performance issue
- Sev4: Informational, no immediate service impact

### Impact Assessment

#### User Impact

- **Total Users Affected:** [Number]
- **Percentage of User Base:** [X%]
- **User Experience:** [Describe what users experienced]
- **Geographic Distribution:** [If relevant]

#### Service Impact

- **Primary Services Affected:**
  - [ ] Web Application (Next.js)
  - [ ] API (Hono)
  - [ ] Database (PostgreSQL)
  - [ ] Payment Processing (Stripe)
  - [ ] Authentication (Auth.js)
  - [ ] Other: [Specify]

- **Service Availability:**
  - [Service Name]: [Down / Degraded / Operational]
  - [Service Name]: [Down / Degraded / Operational]

#### Business Impact

- **Revenue Impact:** [$Amount or "Not applicable"]
- **Bookings Affected:** [Number]
- **Payments Failed:** [Number]
- **Customer Support Volume:** [Number of tickets/calls]
- **SLA Breach:** [Yes/No - If yes, specify which SLA]

#### External Dependencies

- [ ] Railway (Infrastructure)
- [ ] Vercel (Frontend Hosting)
- [ ] Stripe (Payments)
- [ ] Third-party APIs
- [ ] CDN/DNS Provider
- [ ] Other: [Specify]

---

## Timeline of Events

**All times in EST timezone**

| Time    | Event                  | Actor           | Action Taken    |
| ------- | ---------------------- | --------------- | --------------- |
| [HH:MM] | [Description of event] | [Person/System] | [What was done] |
| [HH:MM] | [Description of event] | [Person/System] | [What was done] |
| [HH:MM] | [Description of event] | [Person/System] | [What was done] |

**Example:**
| Time | Event | Actor | Action Taken |
|------|-------|-------|--------------|
| 14:15 | API deployment started | CI/CD | Deployment v2.1.3 initiated |
| 14:17 | Health checks failing | Monitoring | PagerDuty alert triggered |
| 14:18 | Alert acknowledged | @john-doe | Began investigation |
| 14:20 | Root cause identified | @john-doe | Database migration issue found |
| 14:22 | Mitigation started | @john-doe | Initiated rollback |
| 14:25 | Services restored | @john-doe | Health checks passing |
| 14:40 | Incident closed | @john-doe | Confirmed stable for 15 min |

---

## Root Cause Analysis

### Primary Root Cause

[Detailed explanation of the fundamental reason the incident occurred]

**Technical Details:**

```
[Include relevant technical details, error messages, stack traces, or configuration issues]
```

### Contributing Factors

1. **[Factor 1]**
   - [Explanation of how this contributed]

2. **[Factor 2]**
   - [Explanation of how this contributed]

3. **[Factor 3]**
   - [Explanation of how this contributed]

### 5 Whys Analysis

1. **Why did [the incident] happen?**
   - [Answer]

2. **Why did [answer from #1] happen?**
   - [Answer]

3. **Why did [answer from #2] happen?**
   - [Answer]

4. **Why did [answer from #3] happen?**
   - [Answer]

5. **Why did [answer from #4] happen?**
   - [Root cause]

---

## Detection & Response

### Detection

**How was the incident detected?**

- [ ] Automated monitoring alert (PagerDuty)
- [ ] Customer report
- [ ] Internal team member noticed
- [ ] Third-party notification
- [ ] Other: [Specify]

**Detection Time:** [Time from incident start to detection]

**Detection Tools Used:**

- [Tool 1: e.g., Sentry error tracking]
- [Tool 2: e.g., Service health dashboard]
- [Tool 3: e.g., Railway logs]

### Initial Response

**Time to Acknowledge:** [X minutes]
**Time to Assess:** [X minutes]
**Time to First Mitigation:** [X minutes]

**Response Team:**

- Incident Commander: [Name]
- On-Call Engineer: [Name]
- SME (Backend): [Name]
- SME (Infrastructure): [Name]
- Communications: [Name]

**Response Actions Taken:**

1. [Action 1]
2. [Action 2]
3. [Action 3]

---

## Resolution & Recovery

### Mitigation Steps

**Immediate Mitigation (Stop the bleeding):**

1. [Step 1 - e.g., Rolled back deployment to v2.1.2]
2. [Step 2 - e.g., Restarted API service]
3. [Step 3 - e.g., Cleared connection pool]

**Verification:**

- [How mitigation was verified - e.g., Health checks passing for 15 minutes]
- [Metrics returned to baseline]

### Resolution

**Final Resolution:**
[Describe the permanent fix that was applied]

**Resolution Time:** [Time from incident start to resolution]

**Verification Steps:**

1. [Step 1 - e.g., Ran smoke tests]
2. [Step 2 - e.g., Monitored error rates]
3. [Step 3 - e.g., Confirmed with customer support]

### Recovery Actions

**Immediate Recovery:**

- [Action 1]
- [Action 2]

**Follow-up Recovery:**

- [Action 1]
- [Action 2]

---

## Communication

### Internal Communication

**Stakeholders Notified:**

- [ ] Engineering team (#incidents Slack channel)
- [ ] Engineering Manager
- [ ] Director of Engineering
- [ ] CTO
- [ ] Product Manager
- [ ] Customer Support team
- [ ] Other: [Specify]

**Communication Timeline:**
| Time | Audience | Message | Channel |
|------|----------|---------|---------|
| [HH:MM] | [Who] | [Brief summary of message] | [Slack/Email/Phone] |

### External Communication

**Customer Communication:**

- [ ] Status page updated
- [ ] Email sent to affected customers
- [ ] In-app notification
- [ ] Social media update
- [ ] None required

**Status Page Updates:**

1. [Time] - [Initial update message]
2. [Time] - [Progress update]
3. [Time] - [Resolution message]

**Customer Email:** [Yes/No]

- Subject: [Subject line]
- Recipients: [All users / Affected users only]
- Sent at: [Time]

---

## What Went Well

**Positive Aspects:**

1. [What worked well during the incident response]
2. [Effective tools, processes, or team actions]
3. [Quick response times or good decisions]

**Examples:**

- Detection within 2 minutes of occurrence
- Effective team coordination via Slack
- Rollback procedure worked as documented
- Clear communication to stakeholders

---

## What Went Wrong

**Areas for Improvement:**

1. [What didn't work well]
2. [Gaps in processes, tools, or knowledge]
3. [Missed opportunities or delays]

**Examples:**

- Lack of automated rollback triggered delay
- Monitoring didn't catch the issue before customer impact
- Unclear escalation path caused confusion
- Missing runbook for this scenario

---

## Action Items

### Immediate Actions (Within 24 hours)

| #   | Action Item          | Owner  | Due Date | Status                  | JIRA Ticket |
| --- | -------------------- | ------ | -------- | ----------------------- | ----------- |
| 1   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |
| 2   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |

### Short-term Actions (Within 1 week)

| #   | Action Item          | Owner  | Due Date | Status                  | JIRA Ticket |
| --- | -------------------- | ------ | -------- | ----------------------- | ----------- |
| 1   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |
| 2   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |

### Long-term Actions (Within 1 month)

| #   | Action Item          | Owner  | Due Date | Status                  | JIRA Ticket |
| --- | -------------------- | ------ | -------- | ----------------------- | ----------- |
| 1   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |
| 2   | [Action description] | [Name] | [Date]   | [Open/In Progress/Done] | [LINK]      |

### Prevention Actions

**To prevent recurrence:**

1. [Preventive measure 1]
2. [Preventive measure 2]
3. [Preventive measure 3]

**Monitoring Improvements:**

1. [New alert/metric to add]
2. [Dashboard enhancement]
3. [Threshold adjustment]

**Process Improvements:**

1. [Process change 1]
2. [Process change 2]
3. [Documentation update]

---

## Lessons Learned

### Key Takeaways

1. **[Lesson 1]**
   - [Explanation and implications]

2. **[Lesson 2]**
   - [Explanation and implications]

3. **[Lesson 3]**
   - [Explanation and implications]

### Knowledge Gaps Identified

1. [Knowledge gap or training need]
2. [Knowledge gap or training need]
3. [Knowledge gap or training need]

### Process Gaps Identified

1. [Process that needs creation or improvement]
2. [Process that needs creation or improvement]
3. [Process that needs creation or improvement]

### Tool Gaps Identified

1. [Tool or capability that is missing]
2. [Tool or capability that is missing]
3. [Tool or capability that is missing]

---

## Supporting Data & Metrics

### Incident Metrics

**Response Metrics:**

- **Time to Detect:** [X minutes]
- **Time to Acknowledge:** [X minutes]
- **Time to Mitigate:** [X minutes]
- **Time to Resolve:** [X minutes]
- **Total Duration:** [X hours Y minutes]

**Impact Metrics:**

- **Error Rate:** [Peak: X%, Baseline: Y%]
- **Response Time:** [Peak: Xms, Baseline: Yms]
- **Requests Failed:** [Number]
- **Users Affected:** [Number]
- **Revenue Impact:** [$Amount]

**SLA Performance:**

- Response SLA: [Met / Missed - Target: X min, Actual: Y min]
- Resolution SLA: [Met / Missed - Target: X hours, Actual: Y hours]

### Charts & Graphs

[Attach or link to relevant charts showing:]

- Error rate over time
- Response time during incident
- Traffic patterns
- Database performance metrics

**Links to Dashboards:**

- [Sentry Error Dashboard](URL)
- [Service Health Dashboard](URL)
- [Infrastructure Metrics](URL)

### Logs & Evidence

**Key Log Entries:**

```
[Include relevant log entries that help explain the incident]
```

**Error Messages:**

```
[Include key error messages or stack traces]
```

**Screenshots:**

- [Link to screenshot 1: Dashboard showing issue]
- [Link to screenshot 2: Error in Sentry]
- [Link to screenshot 3: Resolution verification]

---

## References

### Related Documents

- [Link to runbook used]
- [Link to architectural documentation]
- [Link to similar past incident]

### External References

- [Link to third-party status page if relevant]
- [Link to vendor documentation]
- [Link to related GitHub issue/PR]

### Incident Channel

- Slack: [#incident-YYYY-MM-DD-HHmm](link)
- PagerDuty: [Incident link](URL)

---

## Sign-Off

### Post-Mortem Meeting

**Date:** [Date of post-mortem meeting]
**Attendees:**

- [Name - Role]
- [Name - Role]
- [Name - Role]

**Meeting Notes:**
[Brief summary of discussions from post-mortem meeting]

### Approvals

**Reviewed by:**

- [ ] Incident Commander: ********\_******** Date: **\_\_\_**
- [ ] Engineering Manager: ********\_******** Date: **\_\_\_**
- [ ] Director of Engineering: ********\_******** Date: **\_\_\_**

**Approved by:**

- [ ] CTO: ********\_******** Date: **\_\_\_**

### Follow-Up Review

**Review Date:** [30 days after incident]
**Action Items Completion:** [X of Y completed]
**Effectiveness:** [Brief assessment of whether preventive measures worked]

---

## Appendix

### A. Technical Details

[Include any additional technical information that may be useful for reference but not critical for understanding the incident]

### B. Customer Impact Details

[Include detailed breakdown of customer impact if needed]

### C. Code Changes

**Commits Related to Incident:**

**Commits Related to Fix:**

### D. Additional Resources

[Any other relevant information, links, or documentation]

---

## Document Control

**Document ID:** INC-YYYY-MM-DD-NNN
**Version:** 1.0
**Classification:** Internal
**Retention Period:** 7 years

**Revision History:**

| Version | Date   | Author | Changes                |
| ------- | ------ | ------ | ---------------------- |
| 1.0     | [Date] | [Name] | Initial report         |
| 1.1     | [Date] | [Name] | Added follow-up review |

---

**Filing Location:** `docs/operations/incidents/YYYY/MM/INC-YYYY-MM-DD-NNN.md`

**Related Incidents:**

- [Link to related incident 1]
- [Link to related incident 2]

---

## Template Usage Instructions

**How to use this template:**

1. **Copy this template** to create a new incident report:

   ```bash
   cp incident-report-template.md ../incidents/YYYY/MM/INC-YYYY-MM-DD-NNN.md
   ```

2. **Fill in all sections** as the incident unfolds and during post-mortem

3. **Use brackets [like this]** as placeholders - replace with actual data

4. **Check boxes** using [x] for completed items

5. **Be factual and blameless** - focus on systems and processes, not individuals

6. **Include enough detail** for future reference but keep it concise

7. **Share draft** with incident participants before finalizing

8. **Get approvals** from required stakeholders

9. **Archive** the final report in the appropriate folder

10. **Link action items** to JIRA tickets for tracking

**Tips for writing effective incident reports:**

- Start writing during the incident (timeline, actions)
- Use past tense for events, present tense for analysis
- Include specific times, numbers, and metrics
- Explain technical terms for non-technical readers
- Focus on learning, not blame
- Highlight both successes and failures
- Make action items specific and measurable
- Follow up on action items to completion

---

**For questions about this template, contact:** platform-team@brisacubana.com
