(function(global){
  'use strict';

  const KEY_PROFILE = 'civicHub_profile_v1';
  const KEY_ISSUES = 'civicHub_issues_v1';
  const KEY_PETITIONS = 'civicHub_petitions_v1';
  const KEY_BUDGET = 'civicHub_budgetChallenges_v1';

  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      const v = JSON.parse(raw);
      return v ?? fallback;
    } catch (e) {
      return fallback;
    }
  }

  function uuid() {
    try {
      if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const hub = {
    fmtTime(ts) {
      return new Date(ts).toLocaleString();
    },

    profile: {
      getProfile() {
        return safeParse(global.localStorage.getItem(KEY_PROFILE), null);
      },
      saveProfile(input) {
        const profile = {
          ...input,
          id: input?.id || uuid(),
          updatedAt: Date.now(),
        };
        global.localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
        return profile;
      },
      clearProfile() {
        global.localStorage.removeItem(KEY_PROFILE);
      },
    },

    issues: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_ISSUES), []);
      },
      save(items) {
        global.localStorage.setItem(KEY_ISSUES, JSON.stringify(items));
      },
      add(issue) {
        const items = safeParse(global.localStorage.getItem(KEY_ISSUES), []);
        items.unshift({
          id: uuid(),
          createdAt: Date.now(),
          status: 'open',
          notes: [],
          ...issue,
        });
        global.localStorage.setItem(KEY_ISSUES, JSON.stringify(items));
        return items[0];
      },
      addNote(issueId, note) {
        const items = safeParse(global.localStorage.getItem(KEY_ISSUES), []);
        const target = items.find((x) => x.id === issueId);
        if (!target) return;
        target.notes = target.notes || [];
        target.notes.push({ id: uuid(), createdAt: Date.now(), ...note });
        global.localStorage.setItem(KEY_ISSUES, JSON.stringify(items));
      },
    },

    petitions: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_PETITIONS), []);
      },
      add(petition) {
        const items = safeParse(global.localStorage.getItem(KEY_PETITIONS), []);
        items.unshift({
          id: uuid(),
          createdAt: Date.now(),
          signatures: [],
          ...petition,
        });
        global.localStorage.setItem(KEY_PETITIONS, JSON.stringify(items));
        return items[0];
      },
      sign(petitionId, profile) {
        if (!profile?.id) return;
        const items = safeParse(global.localStorage.getItem(KEY_PETITIONS), []);
        const p = items.find((x) => x.id === petitionId);
        if (!p) return;
        p.signatures = p.signatures || [];
        if (p.signatures.some((s) => s.userId === profile.id)) return;
        p.signatures.push({
          userId: profile.id,
          name: profile.displayName || 'Anonymous',
          createdAt: Date.now(),
        });
        global.localStorage.setItem(KEY_PETITIONS, JSON.stringify(items));
      },
    },

    budgetChallenges: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_BUDGET), []);
      },
      add(challenge) {
        const items = safeParse(global.localStorage.getItem(KEY_BUDGET), []);
        items.unshift({ id: uuid(), createdAt: Date.now(), ...challenge });
        global.localStorage.setItem(KEY_BUDGET, JSON.stringify(items));
        return items[0];
      },
    },
  };

  global.civicHub = hub;
})(window);
