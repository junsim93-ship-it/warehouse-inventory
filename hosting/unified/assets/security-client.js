(() => {
  (function() {
    "use strict";
    var appHandle, authHandle, retryIdentity;
    function clean(data) {
      if (data == null) return data;
      var copy = Object.assign({}, data);
      delete copy._revision;
      return copy;
    }
    function start(app, onIdentity) {
      appHandle = app;
      authHandle = firebase.auth(app);
      var db = firebase.firestore(app), roleStop = null, generation = 0, sessionAuthTime = 0;
      var activityKey = "warehouse:lastActivity";
      ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"].forEach(function(event) {
        document.addEventListener(event, function(e) {
          var last = Number(sessionStorage.getItem(activityKey)) || sessionAuthTime;
          if (e.isTrusted && authHandle.currentUser && sessionAuthTime && Date.now() - last < 30 * 60 * 1e3 && Date.now() - sessionAuthTime < 8 * 3600 * 1e3)
            sessionStorage.setItem(activityKey, String(Date.now()));
        }, { passive: true });
      });
      ["boms-v1", "stock-v2", "stock-prev-v1"].forEach(function(k) {
        try {
          localStorage.removeItem(k);
        } catch (e) {
        }
      });
      authHandle.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(function() {
        if (window.UnifiedSession) {
          const stop = window.UnifiedSession.connect({ subscribe: (cb) => authHandle.onAuthStateChanged((u) => cb(u ? u.uid : null)), getUser: () => authHandle.currentUser?.uid || null, signOut: () => authHandle.signOut(), reload: () => location.reload() });
          window.addEventListener("pagehide", stop, { once: true });
        }
        const handleIdentity = async function(user) {
          var gen = ++generation;
          if (roleStop) {
            roleStop();
            roleStop = null;
          }
          onIdentity({ user, tier: 0, ready: !user, preserveDraft: !!user });
          sessionAuthTime = 0;
          if (!user) {
            sessionStorage.removeItem(activityKey);
            return;
          }
          var authTime;
          try {
            var token = await user.getIdTokenResult();
            authTime = Date.parse(token.authTime);
            if (gen !== generation) return;
            var lastActivity = Number(sessionStorage.getItem(activityKey)) || authTime;
            if (Date.now() - lastActivity >= 30 * 60 * 1e3 || Date.now() - authTime >= 8 * 3600 * 1e3) {
              await authHandle.signOut();
              return;
            }
            sessionAuthTime = authTime;
            sessionStorage.setItem(activityKey, String(lastActivity));
          } catch (e) {
            if (gen === generation) await authHandle.signOut();
            return;
          }
          roleStop = db.doc("roles/" + user.uid).onSnapshot(function(doc) {
            if (gen !== generation) return;
            var role = doc.exists ? doc.data() : {};
            var tier = role.sessionValidAfter > authTime / 1e3 ? 0 : role.tier;
            onIdentity({ user, tier: tier === 1 || tier === 2 ? tier : 0, ready: true });
          }, function(error) {
            if (gen === generation) onIdentity({ user, tier: 0, ready: true, error: true, preserveDraft: !["permission-denied", "unauthenticated"].includes(error?.code) });
          });
        };
        authHandle.onAuthStateChanged(handleIdentity);
        retryIdentity = () => handleIdentity(authHandle.currentUser);
      }).catch(function() {
        onIdentity({ user: null, tier: 0, ready: true, error: true });
      });
      setInterval(async function() {
        var user = authHandle.currentUser;
        if (!user) return;
        try {
          var token = await user.getIdTokenResult();
          var lastActivity = Number(sessionStorage.getItem(activityKey)) || Date.parse(token.authTime);
          if (Date.now() - lastActivity >= 30 * 60 * 1e3 || Date.now() - Date.parse(token.authTime) >= 8 * 3600 * 1e3) await authHandle.signOut();
        } catch (e) {
          await authHandle.signOut();
        }
      }, 3e4);
    }
    async function save(mutations) {
      if (!authHandle || !authHandle.currentUser) throw new Error("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
      try {
        return (await appHandle.functions("asia-northeast3").httpsCallable("saveInventory")({ mutations })).data;
      } catch (e) {
        if (e.code === "functions/unauthenticated") await authHandle.signOut();
        throw new Error(/^functions\/(aborted|invalid-argument|permission-denied|resource-exhausted|unauthenticated|failed-precondition)$/.test(e.code) ? e.message : "\uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC5F0\uACB0\uACFC \uCD5C\uC2E0 \uB370\uC774\uD130\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
      }
    }
    window.InventorySecurity = { start, save, clean, retry: () => retryIdentity?.() };
  })();
})();
