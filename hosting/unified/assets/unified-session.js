(() => {
  (function(root) {
    if (root.parent !== root && root.parent.UnifiedSession) {
      root.UnifiedSession = root.parent.UnifiedSession;
      return;
    }
    const peers = /* @__PURE__ */ new Set();
    let activeUser;
    function connect(adapter) {
      const peer = { adapter, seen: false, user: null, reloading: false };
      peers.add(peer);
      const unsubscribe = adapter.subscribe((user) => {
        const previous = peer.user;
        if (peer.seen && user === previous) return;
        peer.seen = true;
        peer.user = user;
        if (!user && !previous) {
          if (activeUser && !peer.reloading) {
            peer.reloading = true;
            adapter.reload();
          }
          return;
        }
        if (user === activeUser) return;
        if (!user && previous !== activeUser) return;
        activeUser = user;
        for (const other of peers) {
          if (other === peer || !other.seen) continue;
          if (user) {
            if (other.adapter.getUser() !== user && !other.reloading) {
              other.reloading = true;
              other.adapter.reload();
            }
          } else if (other.adapter.getUser()) {
            Promise.resolve(other.adapter.signOut()).then(() => other.adapter.reload(), () => other.adapter.reload());
          }
        }
      });
      const stop = () => {
        peers.delete(peer);
        unsubscribe?.();
      };
      return stop;
    }
    root.UnifiedSession = { connect };
  })(window);
})();
