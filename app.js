(function (global) {
  'use strict';

  // Optional server config (you fill this in)
  // Example:
  // window._civicHubSupabase = { url: 'https://xxxx.supabase.co', anonKey: '...' }
  const SUPABASE_URL = global._civicHubSupabase?.url || '';
  const SUPABASE_ANON_KEY = global._civicHubSupabase?.anonKey || '';

  // Storage keys (v2 schema)
  const KEY_CURRENT = 'civicHub_currentProfile_v2';
  const KEY_PROFILES = 'civicHub_profiles_v2';
  const KEY_ISSUES = 'civicHub_issues_v2';
  const KEY_PETITIONS = 'civicHub_petitions_v2';
  const KEY_BUDGET = 'civicHub_budgetChallenges_v2';
  const KEY_POSTS = 'civicHub_posts_v1';

  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      const v = JSON.parse(raw);
      return v ?? fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function uuid() {
    try {
      if (global.crypto?.randomUUID) return global.crypto.randomUUID();
    } catch (_e) {}

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function normalize(s) {
    return (s || '').trim().toLowerCase();
  }

  const hub = {
    fmtTime(ts) {
      return new Date(ts).toLocaleString();
    },

    // Utility helpers
    utils: {
      readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          if (!file) return resolve('');
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      },
      normalize,
    },

    // The current user's profile (local-only unless Supabase is configured)
    profile: {
      getCurrent() {
        return safeParse(global.localStorage.getItem(KEY_CURRENT), null);
      },
      saveCurrent(input) {
        const now = Date.now();
        const existing = safeParse(global.localStorage.getItem(KEY_CURRENT), null);
        const profile = {
          ...existing,
          ...input,
          id: input?.id || existing?.id || uuid(),
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };

        global.localStorage.setItem(KEY_CURRENT, JSON.stringify(profile));
        hub.profiles._upsertIndex(profile);
        return profile;
      },
      clearCurrent() {
        global.localStorage.removeItem(KEY_CURRENT);
      },

      // Server save (best effort; requires Supabase URL + anon key and tables/bucket to exist)
      async saveCurrentToServer(input) {
        const profile = hub.profile.saveCurrent(input);
        const photoFile = input?.photoFile;
        await hub.server.upsertProfile(profile, photoFile);
        return profile;
      },
    },

    profiles: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_PROFILES), []);
      },
      _saveAll(list) {
        global.localStorage.setItem(KEY_PROFILES, JSON.stringify(list));
      },
      _upsertIndex(profile) {
        const list = hub.profiles.list();
        const idx = list.findIndex((p) => p.id === profile.id);
        const entry = {
          id: profile.id,
          displayName: profile.displayName || 'Anonymous',
          handle: profile.handle || '',
          isPublic: !!profile.isPublic,
          photoData: profile.photoData || '',
          updatedAt: profile.updatedAt || Date.now(),
        };
        if (idx >= 0) list[idx] = entry;
        else list.unshift(entry);
        hub.profiles._saveAll(list);
      },
      search(query) {
        const q = normalize(query);
        if (!q) return hub.profiles.list();
        return hub.profiles
          .list()
          .filter((p) => normalize(p.displayName).includes(q) || normalize(p.handle).includes(q));
      },
    },

    // Posts are purely local for now (server-only if you want)
    posts: {
      _loadAll() {
        return safeParse(global.localStorage.getItem(KEY_POSTS), []);
      },
      _saveAll(list) {
        global.localStorage.setItem(KEY_POSTS, JSON.stringify(list));
      },
      add(post) {
        const list = hub.posts._loadAll();
        list.unshift({
          id: uuid(),
          ...post,
          createdAt: Date.now(),
        });
        hub.posts._saveAll(list);
      },
      listForProfile(profileId) {
        return hub.posts._loadAll().filter((p) => p.authorId === profileId);
      },
    },

    feed: {
      listForProfile(profileId) {
        const posts = hub.posts.listForProfile(profileId);
        const issues = hub.issues.list().filter((i) => i.createdById === profileId);
        const petitions = hub.petitions.list().filter((p) => p.createdById === profileId);

        const mapIssue = issues.map((i) => ({
          type: 'issue',
          id: i.id,
          title: i.title,
          details: i.details,
          createdAt: i.createdAt,
        }));

        const mapPet = petitions.map((p) => ({
          type: 'petition',
          id: p.id,
          title: p.title,
          details: p.problem,
          createdAt: p.createdAt,
        }));

        return [...posts, ...mapIssue, ...mapPet].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      },
    },

    issues: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_ISSUES), []);
      },
      save(list) {
        global.localStorage.setItem(KEY_ISSUES, JSON.stringify(list));
      },
      add(input) {
        const list = hub.issues.list();
        list.unshift({
          id: uuid(),
          createdAt: Date.now(),
          status: 'Open',
          notes: [],
          ...input,
        });
        hub.issues.save(list);
      },
      addNote(issueId, note) {
        const list = hub.issues.list();
        const idx = list.findIndex((i) => i.id === issueId);
        if (idx < 0) return;
        const notes = list[idx].notes || [];
        notes.push({ ...note, createdAt: Date.now() });
        list[idx] = { ...list[idx], notes };
        hub.issues.save(list);
      },
    },

    petitions: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_PETITIONS), []);
      
      },
      save(list) {
        global.localStorage.setItem(KEY_PETITIONS, JSON.stringify(list));
      },
      add(input) {
        const list = hub.petitions.list();
        list.unshift({
          id: uuid(),
          createdAt: Date.now(),
          signatures: [],
          ...input,
        });
        hub.petitions.save(list);
      },
      sign(petitionId, signature) {
        const list = hub.petitions.list();
        const idx = list.findIndex((p) => p.id === petitionId);
        if (idx < 0) return false;
        const sigs = list[idx].signatures || [];
        const userId = signature?.userId;
        if (userId && sigs.some((s) => s.userId === userId)) return false;
        sigs.push({ ...signature, createdAt: Date.now() });
        list[idx] = { ...list[idx], signatures: sigs };
        hub.petitions.save(list);
        return true;
      },
    },

    budgetChallenges: {
      list() {
        return safeParse(global.localStorage.getItem(KEY_BUDGET), []);
      },
      save(list) {
        global.localStorage.setItem(KEY_BUDGET, JSON.stringify(list));
      },
      add(input) {
        const list = hub.budgetChallenges.list();
        list.unshift({
          id: uuid(),
          createdAt: Date.now(),
          ...input,
        });
        hub.budgetChallenges.save(list);
      },
    },

    server: {
      client: null,
      hasClient: false,
      init() {
        try {
          if (SUPABASE_URL && SUPABASE_ANON_KEY && global.supabase?.createClient) {
            hub.server.client = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            hub.server.hasClient = true;
          }
        } catch (_e) {
          hub.server.client = null;
          hub.server.hasClient = false;
        }
      },

      async upsertProfile(profile, photoFile) {
        if (!hub.server.hasClient) return { error: 'No server config' };
        const supabase = hub.server.client;

        // Photo upload is optional. If you don't have a bucket named "profile_photos", skip.
        let photoUrl = profile.photoUrl || profile.photoData || '';
        if (photoFile) {
          const path = `${profile.id}/${Date.now()}_${photoFile.name || 'photo'}`;
          const { error: uploadErr } = await supabase.storage.from('profile_photos').upload(path, photoFile, { upsert: true });
          if (uploadErr) return { error: uploadErr.message || 'Upload failed' };
          const { data } = supabase.storage.from('profile_photos').getPublicUrl(path);
          photoUrl = data?.publicUrl || photoUrl;
        }

        const payload = {
          id: profile.id,
          display_name: profile.displayName || null,
          handle: profile.handle || null,
          is_public: !!profile.isPublic,
          bio: profile.bio || null,
          photo_url: photoUrl || null,
          updated_at: new Date(profile.updatedAt).toISOString(),
          created_at: new Date(profile.createdAt).toISOString(),
        };

        // only store contact info publicly if they opted in
        if (profile.isPublic) {
          payload.contact_email = profile.contactEmail || null;
          payload.contact_phone = profile.contactPhone || null;
        }

        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) return { error: error.message || 'Save failed' };

        return { ok: true, profileUrl: photoUrl };
      },
    },
  };

  hub.server.init();

  // Backward compatibility: if issues/petitions are added without createdById, attach current user.
  const originalIssueAdd = hub.issues.add.bind(hub.issues);
  hub.issues.add = function (input) {
    const current = hub.profile.getCurrent();
    const enriched = { ...input };
    if (current?.id) {
      enriched.createdById = current.id;
      enriched.createdBy = input?.createdBy || current.displayName;
    }
    return originalIssueAdd(enriched);
  };

  const originalPetitionAdd = hub.petitions.add.bind(hub.petitions);
  hub.petitions.add = function (input) {
    const current = hub.profile.getCurrent();
    const enriched = { ...input };
    if (current?.id) {
      enriched.createdById = current.id;
      enriched.createdBy = input?.createdBy || current.displayName;
    }
    return originalPetitionAdd(enriched);
  };

  hub.profiles.getById=hub.profiles.getById||function(id){if(!id)return null;return(hub.profiles.list()||[]).find(p=>p?.id===id)||null;};hub.profiles.addCurrentToIndex=hub.profiles.addCurrentToIndex||function(){const c=hub.profile.getCurrent();if(!c?.id)return;hub.profiles._upsertIndex(c);};hub.profiles.rebuildIndexFromLocal=hub.profiles.rebuildIndexFromLocal||function(){try{localStorage.removeItem(KEY_PROFILES);}catch(_e){}const c=hub.profile.getCurrent();if(c?.id)hub.profiles._upsertIndex(c);};const origProfileUpsertIndex=hub.profiles._upsertIndex.bind(hub.profiles);hub.profiles._upsertIndex=function(profile){const enriched={...profile};enriched.photoUrl=profile.photoUrl||profile.photoDataUrl||profile.photoData||profile.photo_url||profile.photoDataURL||null;enriched.photoDataUrl=profile.photoDataUrl||profile.photoData||profile.photoDataURL||null;enriched.photoData=profile.photoData||profile.photoDataUrl||profile.photoDataURL||null;enriched.publicEmail=profile.publicEmail||profile.contactEmail||profile.contact_email||null;enriched.publicPhone=profile.publicPhone||profile.contactPhone||profile.contact_phone||null;return origProfileUpsertIndex(enriched);};const originalIssueListForProfile=hub.issues.listForProfile.bind(hub.issues);hub.issues.listForProfile=function(profileId){return(originalIssueListForProfile(profileId)||[]).map(x=>({kind:'issue',type:x?.type||'issue',...x}));};const originalPetitionListForProfile=hub.petitions.listForProfile.bind(hub.petitions);hub.petitions.listForProfile=function(profileId){return(originalPetitionListForProfile(profileId)||[]).map(x=>({kind:'petition',type:x?.type||'petition',...x}));};hub.feed.listForProfile=function(profileId){const profile=profileId?hub.profiles.getById(profileId):hub.profile.getCurrent();if(!profile?.id)return[];const pid=profile.id;const issues=hub.issues.listForProfile(pid).map(i=>({kind:'issue',issueId=i.id,title=i.title,status=i.status||'open',createdById=i.createdById,createdBy=i.createdBy,createdAt=i.createdAt||i.created_at||Date.now(),updatedAt=i.updatedAt||i.updated_at||i.createdAt||i.created_at||Date.now(),likes=i.likes||0,dislikes=i.dislikes||0}));const petitions=hub.petitions.listForProfile(pid).map(p=>({kind:'petition',petitionId=p.id,problem=p.problem||p.title||p.problemSummary,requestedChange=p.requestedChange||p.requested_change,createdById=p.createdById,createdBy=p.createdBy,createdAt=p.createdAt||p.created_at||Date.now(),updatedAt=p.updatedAt||p.updated_at||p.createdAt||p.created_at||Date.now(),likes=p.likes||0,dislikes=p.dislikes||0}));const posts=hub.posts.listForProfile(pid).map(p=>({kind:'post',postId=p.id,content=p.content,createdById=p.authorId||p.createdById||p.author?.id,createdBy=p.author||p.createdBy,createdAt=p.createdAt||p.created_at||Date.now(),updatedAt=p.updatedAt||p.updated_at||p.createdAt||p.created_at||Date.now(),likes=p.likes||0,dislikes=p.dislikes||0}));return[...issues,...petitions,...posts].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));};const originalPostAdd=hub.posts.add.bind(hub.posts);hub.posts.add=function(input){const current=hub.profile.getCurrent();const enriched={...input};if(current?.id){enriched.authorId=input?.authorId||current.id;enriched.author=input?.author||current.displayName;}return originalPostAdd(enriched);};global.civicHub=hub;;
})(typeof window !== 'undefined' ? window : globalThis);
