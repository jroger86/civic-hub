# Civic Hub Prototype

Civic Hub is a dual-purpose civic platform:
- **Everyday participation** (issues, petitions, live debate, community)
- **Crisis guidance** (the "what do I do right now?" layer)

## Landing page / menu
Top navigation includes: Home, Issues, Live Debate, Community, Petitions, Emergency Guidance, About.

## Core prototype features
- Dual debate video placeholders (Position A/B) with local camera preview
- Jumbotron hero + clear CTA
- Scrolling ticker for community info
- Issue reporting flow (category/title/details/location/contact)
- Petition + community sections
- Signup skeleton

## Crisis Mode (Emergency Guidance)
This is intentionally **not** a dispatch system.

It provides:
- Scenario selection (Earthquake, Wildfire, Pandemic, Civil unrest, Blackout)
- Immediate actions + contact guidance
- An emergency ticker that activates when a scenario is selected

## Crisis Intelligence Network (CIN)
A structured model to make emergency guidance usable in real time:
- **Playbooks**: prebuilt scenarios (earthquake, wildfire, pandemic, etc.)
- **Expert layer**: responders / public health / community organizers provide inputs
- **Real-time adaptation**: localized guidance adjusted as reports and conditions change
- **Citizen input layer**: ground truth reporting (verified/unverified, trust tiers)
- **Action layer**: keeps guidance focused on 3–5 actionable steps

## Roadmap
### Phase 1
- UI skeleton + playbooks rendered client-side
- Emergency ticker + crisis section

### Phase 2
- Verified expert updates
- Trust tiers + moderation
- Measurable outcomes tied to petitions

### Phase 3
- Offline/local network fallback (`civichub.local` concept)
- Local caching of playbooks
- Neighborhood-level nodes for resilience

## UX principles
- **Trust > features** (clear source labeling)
- **Clarity > completeness** (short, plain language)
- **Speed > perfection** (usable immediately under stress)
