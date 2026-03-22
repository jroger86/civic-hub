# Civic Hub Prototype

Civic Hub is a dual-purpose civic platform:

- **Everyday participation** (issues, petitions, live debate, community)
- **Crisis guidance** (the "what do I do right now?" layer)

## Landing page / menu
Top navigation includes: Home, Issues, Live Debate, Community, Petitions, Emergency Guidance, CIN Model, About.
A highlighted **Post Issue** button sits in the topbar.

## Core prototype features
- Dual debate video placeholders (Position A/B) with local camera preview
- Jumbotron hero + clear CTA
- Scrolling ticker for community info
- Issue reporting flow (category/title/details/location/contact)
- Petition + community sections
- Signup skeleton
- **Emergency ticker** that activates when Crisis Mode is active

## Crisis Mode (Emergency Guidance)
This is intentionally **not** a dispatch system.
It provides:
- Scenario selection (Earthquake, Wildfire, Pandemic, Civil unrest, Blackout)
- The **Survival interface** overlay: 3 clear sections (Right now / Where to go & do / Who to call)
- Floating **🚨 Emergency Guide** button (always accessible)
- Offline playbook caching (prototype stub)
- Detection stub (simulate detection) for later automatic activation

## Resilience modes (Tier design)
- **Tier 1:** Internet (cloud-hosted updates + official feed)
- **Tier 2:** Local network (offline) — cached playbooks + local access point (prototype placeholder)
- **Tier 3:** Peer-to-peer — future device-to-device sharing when networks fail

## Crisis Intelligence Network (CIN)
A structured model to make emergency guidance usable in real time:

- **Playbooks:** prebuilt scenarios (earthquake, wildfire, pandemic, etc.)
- **Expert layer:** responders / public health / community organizers provide inputs
- **Real-time adaptation:** localized guidance adjusts as reports and conditions change
- **Citizen input layer:** ground truth reporting with trust tiers (verified/unverified)
- **Action layer:** keeps guidance focused on 3–5 actionable steps

## Task force & expertise
CIN should be built with experienced people:

- Emergency responders & public safety leaders
- Public health professionals
- Community organizers / mutual aid networks
- Communications + accessibility specialists

**Goal:** credibility under stress — trust > features, clarity > completeness, speed > perfection.

## Roadmap
### Phase 1
- UI skeleton + playbooks rendered client-side
- Crisis overlay + emergency ticker + guidance tiles
- Report scaffolding (hazard/need/damage)
- Offline cache stub

### Phase 2
- Verified expert guidance pipeline + trust tiers
- Moderation + reporting controls
- API-driven ticker and real-time feeds
- Local network distribution MVP

### Phase 3
- Peer-to-peer mesh distribution
- City deployment readiness, governance + transparency
- Accessibility, multilingual guidance, offline handouts
