(function(){
  'use strict';
  var appHandle, authHandle;
  function clean(data){
    if(data==null)return data;
    var copy=Object.assign({},data);delete copy._revision;return copy;
  }
  function start(app,onIdentity){
    appHandle=app;authHandle=firebase.auth(app);
    var db=firebase.firestore(app),roleStop=null,generation=0,lastActivity=Date.now();
    ['pointerdown','keydown','touchstart'].forEach(function(event){document.addEventListener(event,function(){lastActivity=Date.now();},{passive:true});});
    // Clear only this application's legacy, unprotected business-data caches.
    ['boms-v1','stock-v2','stock-prev-v1'].forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});
    authHandle.setPersistence(firebase.auth.Auth.Persistence.SESSION).then(function(){
      authHandle.onAuthStateChanged(function(user){
        var gen=++generation;
        if(roleStop){roleStop();roleStop=null;}
        onIdentity({user:user,tier:0,ready:!user});
        if(!user)return;
        lastActivity=Date.now();
        roleStop=db.doc('roles/'+user.uid).onSnapshot(function(doc){
          if(gen!==generation)return;
          var tier=doc.exists?doc.data().tier:0;
          onIdentity({user:user,tier:tier===1||tier===2?tier:0,ready:true});
        },function(){if(gen===generation)onIdentity({user:user,tier:0,ready:true,error:true});});
      });
    }).catch(function(){onIdentity({user:null,tier:0,ready:true,error:true});});
    setInterval(async function(){
      var user=authHandle.currentUser;
      if(!user)return;
      try{
        var token=await user.getIdTokenResult();
        if(Date.now()-lastActivity>30*60*1000||Date.now()-Date.parse(token.authTime)>8*3600*1000)await authHandle.signOut();
      }catch(e){await authHandle.signOut();}
    },30000);
  }
  async function save(mutations){
    if(!authHandle||!authHandle.currentUser)throw new Error('로그인이 필요합니다.');
    try{return (await appHandle.functions('asia-northeast3').httpsCallable('saveInventory')({mutations:mutations})).data;}
    catch(e){
      if(e.code==='functions/unauthenticated')await authHandle.signOut();
      throw new Error(/^functions\/(aborted|invalid-argument|permission-denied|resource-exhausted|unauthenticated|failed-precondition)$/.test(e.code)?e.message:'저장하지 못했습니다. 연결과 최신 데이터를 확인해 주세요.');
    }
  }
  window.InventorySecurity={start:start,save:save,clean:clean};
})();
