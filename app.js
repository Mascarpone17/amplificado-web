(function(){
  "use strict";

  var auth = firebase.auth();
  var db = firebase.firestore();
  var FieldValue = firebase.firestore.FieldValue;

  // ---------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------
  function escapeHtml(str){
    return String(str == null ? "" : str).replace(/[&<>"']/g, function(c){
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function initials(name){
    name = (name || "?").trim();
    if(!name) return "?";
    var parts = name.split(/\s+/);
    var s = parts[0][0] || "";
    if(parts.length > 1) s += parts[parts.length - 1][0] || "";
    return s.toUpperCase();
  }
  function avatarHtml(profile, size){
    size = size || "sm";
    var cls = "avatar avatar-" + size;
    if(profile && profile.photoData){
      return '<img class="' + cls + '" src="' + profile.photoData + '" alt="" />';
    }
    return '<span class="avatar-placeholder avatar-' + size + '">' + escapeHtml(initials(profile && profile.displayName)) + '</span>';
  }
  function formatTime(ts){
    if(!ts || !ts.toDate) return "";
    var d = ts.toDate();
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    if(sameDay) return d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
    return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }) + " " + d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
  }
  function resizeImageToDataURL(file, maxDim, quality){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onerror = function(){ reject(new Error("No se pudo leer el archivo.")); };
      reader.onload = function(e){
        var img = new Image();
        img.onerror = function(){ reject(new Error("No se pudo leer la imagen.")); };
        img.onload = function(){
          var w = img.width, h = img.height;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement("canvas");
          canvas.width = cw; canvas.height = ch;
          canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  var boot = document.getElementById("boot");
  var app = document.getElementById("app");
  var topbar = document.getElementById("topbar");
  var brandBtn = document.getElementById("brandBtn");
  var userChip = document.getElementById("userChip");
  var ownAvatarSlot = document.getElementById("ownAvatarSlot");
  var ownProfileBtn = document.getElementById("ownProfileBtn");
  var logoutBtn = document.getElementById("logoutBtn");
  var views = {
    login: document.getElementById("view-login"),
    feed: document.getElementById("view-feed"),
    "new": document.getElementById("view-new"),
    instrument: document.getElementById("view-instrument"),
    profile: document.getElementById("view-profile"),
    profileEdit: document.getElementById("view-profile-edit"),
    chats: document.getElementById("view-chats"),
    chat: document.getElementById("view-chat")
  };

  var currentUser = null;
  var myProfile = null;
  var profileCache = {}; // uid -> profile object
  var activeChatUnsub = null;
  var activeChatListUnsub = null;

  function showView(name){
    Object.keys(views).forEach(function(k){ views[k].hidden = (k !== name); });
    topbar.hidden = (name === "login");
    Array.prototype.forEach.call(document.querySelectorAll(".navlinks a"), function(a){
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });
    window.scrollTo(0, 0);
    if(name !== "chat" && activeChatUnsub){ activeChatUnsub(); activeChatUnsub = null; }
    if(name !== "chats" && activeChatListUnsub){ activeChatListUnsub(); activeChatListUnsub = null; }
  }

  function getProfile(uid){
    if(profileCache[uid]) return Promise.resolve(profileCache[uid]);
    return db.collection("users").doc(uid).get().then(function(snap){
      var data = snap.exists ? snap.data() : { displayName: "Usuario", bio:"", mainInstrument:"", photoData:"" };
      data.uid = uid;
      profileCache[uid] = data;
      return data;
    });
  }
  function refreshOwnProfile(){
    return db.collection("users").doc(currentUser.uid).get().then(function(snap){
      myProfile = snap.exists ? snap.data() : null;
      if(myProfile){ myProfile.uid = currentUser.uid; profileCache[currentUser.uid] = myProfile; }
      renderTopbarUser();
      return myProfile;
    });
  }
  function renderTopbarUser(){
    userChip.textContent = (myProfile && myProfile.displayName) || (currentUser && currentUser.email) || "";
    ownAvatarSlot.innerHTML = avatarHtml(myProfile, "sm");
  }

  // ---------------------------------------------------------------------
  // auth errors + auth form
  // ---------------------------------------------------------------------
  var AUTH_ERRORS = {
    "auth/email-already-in-use":"Ese email ya tiene una cuenta. Probá iniciar sesión.",
    "auth/invalid-email":"El email no es válido.",
    "auth/weak-password":"La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found":"Email o contraseña incorrectos.",
    "auth/wrong-password":"Email o contraseña incorrectos.",
    "auth/invalid-credential":"Email o contraseña incorrectos.",
    "auth/invalid-login-credentials":"Email o contraseña incorrectos.",
    "auth/too-many-requests":"Demasiados intentos. Probá de nuevo en unos minutos.",
    "auth/network-request-failed":"Error de conexión. Revisá tu internet e intentá de nuevo.",
    "auth/missing-password":"Ingresá una contraseña."
  };
  function authErrorMessage(err){
    return AUTH_ERRORS[err && err.code] || "Ocurrió un error. Probá de nuevo.";
  }

  var tabLogin = document.getElementById("tabLogin");
  var tabSignup = document.getElementById("tabSignup");
  var authForm = document.getElementById("authForm");
  var authSubmit = document.getElementById("authSubmit");
  var authError = document.getElementById("authError");
  var authNotice = document.getElementById("authNotice");
  var passHint = document.getElementById("passHint");
  var forgotBtn = document.getElementById("forgotBtn");
  var authMode = "login";

  function setAuthMode(next){
    authMode = next;
    tabLogin.setAttribute("aria-selected", String(authMode === "login"));
    tabSignup.setAttribute("aria-selected", String(authMode === "signup"));
    authSubmit.textContent = authMode === "login" ? "Entrar" : "Crear cuenta";
    passHint.hidden = authMode === "login";
    authError.textContent = "";
    authNotice.textContent = "";
  }
  tabLogin.addEventListener("click", function(){ setAuthMode("login"); });
  tabSignup.addEventListener("click", function(){ setAuthMode("signup"); });

  authForm.addEventListener("submit", function(e){
    e.preventDefault();
    var email = document.getElementById("emailField").value.trim();
    var pass = document.getElementById("passField").value;
    authError.textContent = "";
    authNotice.textContent = "";
    if(!email || !pass){
      authError.textContent = "Completá email y contraseña.";
      return;
    }
    authSubmit.disabled = true;
    var action = authMode === "login"
      ? auth.signInWithEmailAndPassword(email, pass)
      : auth.createUserWithEmailAndPassword(email, pass);
    action.catch(function(err){
      authError.textContent = authErrorMessage(err);
    }).finally(function(){
      authSubmit.disabled = false;
    });
  });

  forgotBtn.addEventListener("click", function(){
    var email = document.getElementById("emailField").value.trim();
    authError.textContent = "";
    authNotice.textContent = "";
    if(!email){
      authError.textContent = "Escribí tu email arriba y volvé a tocar este link.";
      return;
    }
    auth.sendPasswordResetEmail(email).then(function(){
      authNotice.textContent = "Te enviamos un email para restablecer tu contraseña.";
    }).catch(function(err){
      authError.textContent = authErrorMessage(err);
    });
  });

  logoutBtn.addEventListener("click", function(){ auth.signOut(); });
  brandBtn.addEventListener("click", function(){ location.hash = "#/feed"; });
  ownProfileBtn.addEventListener("click", function(){ location.hash = "#/profile/" + currentUser.uid; });
  Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function(el){
    el.addEventListener("click", function(){ location.hash = el.getAttribute("data-nav"); });
  });

  auth.onAuthStateChanged(function(user){
    currentUser = user;
    boot.hidden = true;
    app.hidden = false;
    if(user){
      db.collection("users").doc(user.uid).get().then(function(snap){
        if(snap.exists){
          return refreshOwnProfile().then(function(){ router(); });
        }
        var fallbackName = (user.email || "Músico").split("@")[0];
        return db.collection("users").doc(user.uid).set({
          displayName: fallbackName,
          bio: "",
          mainInstrument: "",
          photoData: "",
          createdAt: FieldValue.serverTimestamp()
        }).then(function(){
          return refreshOwnProfile();
        }).then(function(){
          location.hash = "#/profile/edit";
          router();
        });
      });
    } else {
      myProfile = null;
      profileCache = {};
      showView("login");
    }
  });

  // ---------------------------------------------------------------------
  // router
  // ---------------------------------------------------------------------
  function router(){
    if(!currentUser) return;
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    if(parts.length === 0){ location.hash = "#/feed"; return; }

    if(parts[0] === "feed"){ showView("feed"); renderFeed(); return; }
    if(parts[0] === "new"){ showView("new"); resetNewForm(); return; }
    if(parts[0] === "instrument" && parts[1]){ showView("instrument"); renderInstrumentDetail(parts[1]); return; }
    if(parts[0] === "profile" && parts[1] === "edit"){ showView("profileEdit"); renderProfileEdit(); return; }
    if(parts[0] === "profile" && parts[1]){ showView("profile"); renderProfile(parts[1]); return; }
    if(parts[0] === "chats"){ showView("chats"); renderChatsList(); return; }
    if(parts[0] === "chat" && parts[1]){ showView("chat"); renderChatWindow(parts[1]); return; }

    location.hash = "#/feed";
  }
  window.addEventListener("hashchange", router);

  // ---------------------------------------------------------------------
  // feed
  // ---------------------------------------------------------------------
  var INSTRUMENT_TYPES = ["Guitarra eléctrica", "Guitarra acústica", "Bajo", "Amplificador", "Otro"];
  var feedState = { type: "all", items: [] };
  var filtersEl = document.getElementById("filters");
  var gridEl = document.getElementById("grid");
  var feedCountEl = document.getElementById("feedCount");
  var feedEmptyEl = document.getElementById("feedEmpty");
  document.getElementById("feedRefreshBtn").addEventListener("click", loadFeed);

  function renderFilters(){
    var chips = ["all"].concat(INSTRUMENT_TYPES);
    filtersEl.innerHTML = chips.map(function(t){
      var label = t === "all" ? "Todos" : t;
      var pressed = feedState.type === t;
      return '<button type="button" class="chip" data-type="' + escapeHtml(t) + '" aria-pressed="' + pressed + '">' + escapeHtml(label) + '</button>';
    }).join("");
    Array.prototype.forEach.call(filtersEl.querySelectorAll(".chip"), function(btn){
      btn.addEventListener("click", function(){
        feedState.type = btn.getAttribute("data-type");
        renderFilters();
        renderGrid();
      });
    });
  }

  function renderFeed(){
    renderFilters();
    gridEl.innerHTML = "";
    feedCountEl.textContent = "Cargando…";
    feedEmptyEl.innerHTML = "";
    loadFeed();
  }

  function loadFeed(){
    db.collection("instruments").orderBy("createdAt", "desc").limit(100).get().then(function(qs){
      feedState.items = qs.docs.map(function(d){ var o = d.data(); o.id = d.id; return o; });
      renderGrid();
    }).catch(function(err){
      feedCountEl.textContent = "";
      gridEl.innerHTML = '<p class="empty-state">No se pudo cargar el muro. ' + escapeHtml(err.message || "") + '</p>';
    });
  }

  function renderGrid(){
    var list = feedState.items.filter(function(g){ return feedState.type === "all" || g.type === feedState.type; });
    feedCountEl.textContent = list.length + (list.length === 1 ? " instrumento publicado" : " instrumentos publicados");

    if(feedState.items.length === 0){
      feedEmptyEl.innerHTML = '' +
        '<div class="empty-state">' +
          '<p>Todavía no hay nada publicado en el muro. Sé el primero en compartir tu instrumento, o cargá el catálogo de ejemplo para ver cómo se ve Amplificado en acción.</p>' +
          '<button class="btn btn-ghost btn-sm" type="button" id="seedBtn">Cargar catálogo de ejemplo</button>' +
        '</div>';
      var seedBtn = document.getElementById("seedBtn");
      if(seedBtn) seedBtn.addEventListener("click", function(){
        seedBtn.disabled = true;
        seedBtn.textContent = "Cargando…";
        seedDemoData().then(loadFeed).catch(function(err){
          alert("No se pudo cargar el catálogo de ejemplo: " + (err.message || err));
        });
      });
    } else {
      feedEmptyEl.innerHTML = "";
    }

    if(list.length === 0){
      gridEl.innerHTML = feedState.items.length ? '<p class="empty-state">No hay instrumentos en esta categoría todavía.</p>' : "";
      return;
    }

    gridEl.innerHTML = list.map(function(g){
      var liked = myProfile && Array.isArray(myProfile.likedInstrumentIds) && myProfile.likedInstrumentIds.indexOf(g.id) !== -1;
      return '' +
        '<article class="card" data-id="' + g.id + '" tabindex="0" role="button" aria-label="Ver ' + escapeHtml(g.name) + '">' +
          '<div class="card-art"><img src="' + g.photoData + '" alt="' + escapeHtml(g.name) + '" loading="lazy" /></div>' +
          '<div class="card-body">' +
            '<span class="card-type">' + escapeHtml(g.type || "") + '</span>' +
            '<h3 class="card-name">' + escapeHtml(g.name) + '</h3>' +
            '<p class="card-blurb">' + escapeHtml(g.description || "") + '</p>' +
            '<div class="card-owner">' + avatarHtml({ photoData: g.ownerPhotoData, displayName: g.ownerName }, "xs") + '<span>' + escapeHtml(g.ownerName || "") + '</span></div>' +
            '<div class="card-foot">' +
              '<button type="button" class="like-btn" data-like-id="' + g.id + '" data-liked="' + !!liked + '">' + (liked ? "♥" : "♡") + ' <span>' + (g.likesCount || 0) + '</span></button>' +
              '<span class="card-cta">Ver →</span>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join("");

    Array.prototype.forEach.call(gridEl.querySelectorAll(".card"), function(card){
      card.addEventListener("click", function(e){
        if(e.target.closest(".like-btn")) return;
        location.hash = "#/instrument/" + card.getAttribute("data-id");
      });
      card.addEventListener("keydown", function(e){
        if((e.key === "Enter" || e.key === " ") && !e.target.closest(".like-btn")){
          e.preventDefault();
          location.hash = "#/instrument/" + card.getAttribute("data-id");
        }
      });
    });
    Array.prototype.forEach.call(gridEl.querySelectorAll(".like-btn"), function(btn){
      btn.addEventListener("click", function(e){
        e.stopPropagation();
        toggleLike(btn.getAttribute("data-like-id"));
      });
    });
  }

  function toggleLike(instrumentId){
    var userRef = db.collection("users").doc(currentUser.uid);
    var instRef = db.collection("instruments").doc(instrumentId);
    db.runTransaction(function(tx){
      return tx.get(userRef).then(function(userSnap){
        var liked = userSnap.data().likedInstrumentIds || [];
        var isLiked = liked.indexOf(instrumentId) !== -1;
        tx.update(userRef, {
          likedInstrumentIds: isLiked ? FieldValue.arrayRemove(instrumentId) : FieldValue.arrayUnion(instrumentId)
        });
        tx.update(instRef, { likesCount: FieldValue.increment(isLiked ? -1 : 1) });
        return !isLiked;
      });
    }).then(function(nowLiked){
      if(myProfile){
        myProfile.likedInstrumentIds = myProfile.likedInstrumentIds || [];
        var idx = myProfile.likedInstrumentIds.indexOf(instrumentId);
        if(nowLiked && idx === -1) myProfile.likedInstrumentIds.push(instrumentId);
        if(!nowLiked && idx !== -1) myProfile.likedInstrumentIds.splice(idx, 1);
      }
      var item = feedState.items.filter(function(g){ return g.id === instrumentId; })[0];
      if(item) item.likesCount = (item.likesCount || 0) + (nowLiked ? 1 : -1);
      if(!views.feed.hidden) renderGrid();
      if(!views.instrument.hidden) renderInstrumentDetail(instrumentId, true);
    }).catch(function(err){
      alert("No se pudo actualizar el like: " + (err.message || err));
    });
  }

  function seedDemoData(){
    if(typeof seedInstruments === "undefined" || !seedInstruments.length) return Promise.resolve();
    var batch = db.batch();
    seedInstruments.forEach(function(item){
      var ref = db.collection("instruments").doc();
      var data = Object.assign({}, item, {
        ownerId: "demo",
        ownerName: "Amplificado Demo",
        ownerPhotoData: "",
        likesCount: 0,
        createdAt: FieldValue.serverTimestamp()
      });
      batch.set(ref, data);
    });
    return batch.commit();
  }

  // ---------------------------------------------------------------------
  // new instrument form (dynamic specs + hotspot pins)
  // ---------------------------------------------------------------------
  var newForm = document.getElementById("newForm");
  var specsEditor = document.getElementById("specsEditor");
  var addSpecBtn = document.getElementById("addSpecBtn");
  var pinSection = document.getElementById("pinSection");
  var photoPreviewWrap = document.getElementById("photoPreviewWrap");
  var instPhotoInput = document.getElementById("instPhoto");
  var newError = document.getElementById("newError");
  var newSubmit = document.getElementById("newSubmit");

  var specRows = [];   // { label, value }
  var hotspots = [];   // { specIndex, x, y }
  var armedSpecIndex = -1;
  var currentPhotoData = "";

  function resetNewForm(){
    newForm.reset();
    specRows = [{ label:"", value:"" }, { label:"", value:"" }];
    hotspots = [];
    armedSpecIndex = -1;
    currentPhotoData = "";
    photoPreviewWrap.hidden = true;
    photoPreviewWrap.innerHTML = "";
    pinSection.hidden = true;
    newError.textContent = "";
    renderSpecsEditor();
  }

  function renderSpecsEditor(){
    specsEditor.innerHTML = specRows.map(function(row, i){
      var hasContent = row.label.trim() && row.value.trim();
      var pinned = hotspots.some(function(h){ return h.specIndex === i; });
      var armed = armedSpecIndex === i;
      return '' +
        '<div class="spec-row" data-idx="' + i + '">' +
          '<input type="text" class="spec-label" placeholder="Ej: Pastillas" value="' + escapeHtml(row.label) + '" />' +
          '<input type="text" class="spec-value" placeholder="Ej: Humbucker cerámico" value="' + escapeHtml(row.value) + '" />' +
          '<button type="button" class="pin-toggle" data-armed="' + armed + '" data-pinned="' + pinned + '" ' + (hasContent ? "" : "disabled") + '>📍 ' + (armed ? "Tocá la foto…" : (pinned ? "Anclado" : "Anclar")) + '</button>' +
          '<button type="button" class="row-remove">✕</button>' +
        '</div>';
    }).join("");

    Array.prototype.forEach.call(specsEditor.querySelectorAll(".spec-row"), function(rowEl){
      var i = Number(rowEl.getAttribute("data-idx"));
      rowEl.querySelector(".spec-label").addEventListener("input", function(e){ specRows[i].label = e.target.value; syncPinAvailability(); });
      rowEl.querySelector(".spec-value").addEventListener("input", function(e){ specRows[i].value = e.target.value; syncPinAvailability(); });
      rowEl.querySelector(".pin-toggle").addEventListener("click", function(){
        armedSpecIndex = (armedSpecIndex === i) ? -1 : i;
        renderSpecsEditor();
      });
      rowEl.querySelector(".row-remove").addEventListener("click", function(){
        specRows.splice(i, 1);
        hotspots = hotspots.filter(function(h){ return h.specIndex !== i; }).map(function(h){
          return { specIndex: h.specIndex > i ? h.specIndex - 1 : h.specIndex, x:h.x, y:h.y };
        });
        if(armedSpecIndex === i) armedSpecIndex = -1;
        renderSpecsEditor();
      });
    });
  }
  function syncPinAvailability(){
    // re-render only the pin-toggle disabled state without losing focus each keystroke
    Array.prototype.forEach.call(specsEditor.querySelectorAll(".spec-row"), function(rowEl){
      var i = Number(rowEl.getAttribute("data-idx"));
      var hasContent = specRows[i].label.trim() && specRows[i].value.trim();
      rowEl.querySelector(".pin-toggle").disabled = !hasContent;
    });
  }
  addSpecBtn.addEventListener("click", function(){
    specRows.push({ label:"", value:"" });
    renderSpecsEditor();
  });

  function renderPhotoPreview(){
    pinSection.hidden = !currentPhotoData;
    if(!currentPhotoData){ photoPreviewWrap.hidden = true; photoPreviewWrap.innerHTML = ""; return; }
    photoPreviewWrap.hidden = false;
    photoPreviewWrap.innerHTML = '<div class="hotspot-stage" id="newPhotoStage"><img src="' + currentPhotoData + '" alt="" />' +
      hotspots.map(function(h){
        var row = specRows[h.specIndex];
        var label = row ? row.label : "";
        return '<button type="button" class="hotspot-pin" style="left:' + h.x + '%;top:' + h.y + '%;" title="' + escapeHtml(label) + '" data-spec-idx="' + h.specIndex + '">•</button>';
      }).join("") +
      '</div>';
    var stage = document.getElementById("newPhotoStage");
    stage.addEventListener("click", function(e){
      if(e.target.closest(".hotspot-pin") || armedSpecIndex === -1) return;
      var rect = stage.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      hotspots = hotspots.filter(function(h){ return h.specIndex !== armedSpecIndex; });
      hotspots.push({ specIndex: armedSpecIndex, x: x.toFixed(1), y: y.toFixed(1) });
      armedSpecIndex = -1;
      renderSpecsEditor();
      renderPhotoPreview();
    });
    Array.prototype.forEach.call(stage.querySelectorAll(".hotspot-pin"), function(pin){
      pin.addEventListener("click", function(e){
        e.stopPropagation();
        var idx = Number(pin.getAttribute("data-spec-idx"));
        hotspots = hotspots.filter(function(h){ return h.specIndex !== idx; });
        renderSpecsEditor();
        renderPhotoPreview();
      });
    });
  }

  instPhotoInput.addEventListener("change", function(){
    var file = instPhotoInput.files[0];
    if(!file) return;
    newError.textContent = "";
    resizeImageToDataURL(file, 900, 0.75).then(function(dataUrl){
      currentPhotoData = dataUrl;
      hotspots = [];
      renderPhotoPreview();
    }).catch(function(err){
      newError.textContent = err.message || "No se pudo procesar la imagen.";
    });
  });

  newForm.addEventListener("submit", function(e){
    e.preventDefault();
    newError.textContent = "";
    var type = document.getElementById("instType").value;
    var name = document.getElementById("instName").value.trim();
    var brand = document.getElementById("instBrand").value.trim();
    var description = document.getElementById("instDesc").value.trim();

    if(!name){ newError.textContent = "Ponele un nombre al instrumento."; return; }
    if(!currentPhotoData){ newError.textContent = "Subí una foto del instrumento."; return; }

    var finalSpecs = [];
    var indexMap = {};
    specRows.forEach(function(row, i){
      if(row.label.trim() && row.value.trim()){
        indexMap[i] = finalSpecs.length;
        finalSpecs.push({ label: row.label.trim(), value: row.value.trim() });
      }
    });
    var finalHotspots = hotspots.filter(function(h){ return indexMap.hasOwnProperty(h.specIndex); })
      .map(function(h){ return { specIndex: indexMap[h.specIndex], x: Number(h.x), y: Number(h.y) }; });

    newSubmit.disabled = true;
    newSubmit.textContent = "Publicando…";
    db.collection("instruments").add({
      ownerId: currentUser.uid,
      ownerName: (myProfile && myProfile.displayName) || currentUser.email,
      ownerPhotoData: (myProfile && myProfile.photoData) || "",
      type: type,
      name: name,
      brand: brand,
      description: description,
      photoData: currentPhotoData,
      specs: finalSpecs,
      hotspots: finalHotspots,
      likesCount: 0,
      createdAt: FieldValue.serverTimestamp()
    }).then(function(ref){
      location.hash = "#/instrument/" + ref.id;
    }).catch(function(err){
      newError.textContent = err.message || "No se pudo publicar.";
    }).finally(function(){
      newSubmit.disabled = false;
      newSubmit.textContent = "Publicar";
    });
  });

  // ---------------------------------------------------------------------
  // instrument detail (hotspots + like + owner card)
  // ---------------------------------------------------------------------
  var detailContent = document.getElementById("detailContent");

  function renderInstrumentDetail(id, silentRefresh){
    if(!silentRefresh) detailContent.innerHTML = '<p class="empty-state">Cargando…</p>';
    db.collection("instruments").doc(id).get().then(function(snap){
      if(!snap.exists){ detailContent.innerHTML = '<p class="empty-state">Ese instrumento ya no existe.</p>'; return; }
      var g = snap.data(); g.id = snap.id;
      var liked = myProfile && Array.isArray(myProfile.likedInstrumentIds) && myProfile.likedInstrumentIds.indexOf(g.id) !== -1;
      var specs = g.specs || [];
      var hotspotsByIdx = {};
      (g.hotspots || []).forEach(function(h){ hotspotsByIdx[h.specIndex] = h; });

      var pinsHtml = (g.hotspots || []).map(function(h){
        var row = specs[h.specIndex];
        if(!row) return "";
        return '<button type="button" class="hotspot-pin" style="left:' + h.x + '%;top:' + h.y + '%;" data-spec-idx="' + h.specIndex + '">•</button>';
      }).join("");

      var specRowsHtml = specs.map(function(r, i){
        return '<tr data-pinned="' + !!hotspotsByIdx[i] + '"><th>' + escapeHtml(r.label) + (hotspotsByIdx[i] ? " 📍" : "") + '</th><td>' + escapeHtml(r.value) + '</td></tr>';
      }).join("");

      detailContent.innerHTML = '' +
        '<div class="hotspot-stage" id="detailStage"><img src="' + g.photoData + '" alt="' + escapeHtml(g.name) + '" />' + pinsHtml + '</div>' +
        '<div class="detail-info">' +
          '<span class="detail-type">' + escapeHtml(g.type || "") + '</span>' +
          '<h1 class="detail-name">' + escapeHtml(g.name) + '</h1>' +
          (g.brand ? '<p class="detail-brand">' + escapeHtml(g.brand) + '</p>' : '') +
          '<div class="detail-actions">' +
            '<button type="button" class="btn btn-ghost" id="detailLikeBtn" data-liked="' + !!liked + '">' + (liked ? "♥ Te gusta" : "♡ Me gusta") + ' (' + (g.likesCount || 0) + ')</button>' +
          '</div>' +
          (g.description ? '<p class="detail-blurb">' + escapeHtml(g.description) + '</p>' : '') +
          (specs.length ? '<table class="spec-table">' + specRowsHtml + '</table>' : '') +
          '<button type="button" class="owner-card" id="ownerCardBtn" data-owner="' + g.ownerId + '">' +
            avatarHtml({ photoData: g.ownerPhotoData, displayName: g.ownerName }, "md") +
            '<span><span class="owner-label">Publicado por</span><br /><span class="owner-name">' + escapeHtml(g.ownerName || "") + '</span></span>' +
          '</button>' +
        '</div>';

      document.getElementById("detailLikeBtn").addEventListener("click", function(){ toggleLike(g.id); });
      var ownerBtn = document.getElementById("ownerCardBtn");
      if(g.ownerId && g.ownerId !== "demo"){
        ownerBtn.addEventListener("click", function(){ location.hash = "#/profile/" + g.ownerId; });
      } else {
        ownerBtn.style.cursor = "default";
      }

      var stage = document.getElementById("detailStage");
      var openTooltip = null;
      function closeTooltip(){ if(openTooltip){ openTooltip.remove(); openTooltip = null; } Array.prototype.forEach.call(stage.querySelectorAll(".hotspot-pin"), function(p){ p.classList.remove("open"); }); }
      Array.prototype.forEach.call(stage.querySelectorAll(".hotspot-pin"), function(pin){
        var idx = Number(pin.getAttribute("data-spec-idx"));
        var row = specs[idx];
        function openTip(){
          closeTooltip();
          pin.classList.add("open");
          var tip = document.createElement("div");
          tip.className = "hotspot-tooltip";
          tip.innerHTML = '<span class="k">' + escapeHtml(row.label) + '</span>' + escapeHtml(row.value);
          var left = parseFloat(pin.style.left), top = parseFloat(pin.style.top);
          tip.style.left = Math.min(left + 4, 70) + "%";
          tip.style.top = Math.max(top - 4, 2) + "%";
          stage.appendChild(tip);
          openTooltip = tip;
        }
        pin.addEventListener("mouseenter", openTip);
        pin.addEventListener("mouseleave", closeTooltip);
        pin.addEventListener("click", function(e){ e.stopPropagation(); openTip(); });
      });
      stage.addEventListener("click", closeTooltip);
    }).catch(function(err){
      detailContent.innerHTML = '<p class="empty-state">Error al cargar: ' + escapeHtml(err.message || "") + '</p>';
    });
  }

  // ---------------------------------------------------------------------
  // profile view + edit
  // ---------------------------------------------------------------------
  var profileContent = document.getElementById("profileContent");

  function renderProfile(uid){
    profileContent.innerHTML = '<p class="empty-state">Cargando…</p>';
    Promise.all([
      getProfile(uid),
      db.collection("instruments").where("ownerId", "==", uid).orderBy("createdAt", "desc").get()
    ]).then(function(results){
      var profile = results[0];
      var items = results[1].docs.map(function(d){ var o = d.data(); o.id = d.id; return o; });
      var isMe = uid === currentUser.uid;

      var itemsHtml = items.length ? items.map(function(g){
        return '' +
          '<article class="card" data-id="' + g.id + '">' +
            '<div class="card-art"><img src="' + g.photoData + '" alt="' + escapeHtml(g.name) + '" loading="lazy" /></div>' +
            '<div class="card-body">' +
              '<span class="card-type">' + escapeHtml(g.type || "") + '</span>' +
              '<h3 class="card-name">' + escapeHtml(g.name) + '</h3>' +
              '<div class="card-foot"><span class="mono">♥ ' + (g.likesCount || 0) + '</span><span class="card-cta">Ver →</span></div>' +
            '</div>' +
          '</article>';
      }).join("") : '<p class="empty-state">' + (isMe ? "Todavía no publicaste ningún instrumento." : "Este usuario todavía no publicó instrumentos.") + '</p>';

      profileContent.innerHTML = '' +
        '<div class="profile-head">' +
          avatarHtml(profile, "lg") +
          '<div>' +
            '<h1 class="profile-name">' + escapeHtml(profile.displayName || "") + '</h1>' +
            (profile.mainInstrument ? '<p class="profile-main-instr">🎸 ' + escapeHtml(profile.mainInstrument) + '</p>' : '') +
            (profile.bio ? '<p class="profile-bio">' + escapeHtml(profile.bio) + '</p>' : '') +
            '<div class="profile-actions">' +
              (isMe
                ? '<button class="btn btn-ghost" type="button" id="editProfileLink">Editar perfil</button>'
                : '<button class="btn" type="button" id="messageBtn">Enviar mensaje</button>') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="section-label">' + (isMe ? "Mis instrumentos" : "Instrumentos publicados") + '</p>' +
        '<div class="grid">' + itemsHtml + '</div>';

      if(isMe){
        document.getElementById("editProfileLink").addEventListener("click", function(){ location.hash = "#/profile/edit"; });
      } else {
        document.getElementById("messageBtn").addEventListener("click", function(){ location.hash = "#/chat/" + uid; });
      }
      Array.prototype.forEach.call(profileContent.querySelectorAll(".card"), function(card){
        card.addEventListener("click", function(){ location.hash = "#/instrument/" + card.getAttribute("data-id"); });
      });
    }).catch(function(err){
      profileContent.innerHTML = '<p class="empty-state">Error al cargar el perfil: ' + escapeHtml(err.message || "") + '</p>';
    });
  }

  var editProfileForm = document.getElementById("editProfileForm");
  var editAvatarPreview = document.getElementById("editAvatarPreview");
  var profilePhotoInput = document.getElementById("profilePhoto");
  var editProfileError = document.getElementById("editProfileError");
  var editProfileNotice = document.getElementById("editProfileNotice");
  var editProfileSubmit = document.getElementById("editProfileSubmit");
  var pendingProfilePhoto = null;

  function renderProfileEdit(){
    editProfileError.textContent = "";
    editProfileNotice.textContent = "";
    pendingProfilePhoto = null;
    profilePhotoInput.value = "";
    document.getElementById("profileName").value = (myProfile && myProfile.displayName) || "";
    document.getElementById("profileMainInstr").value = (myProfile && myProfile.mainInstrument) || "";
    document.getElementById("profileBio").value = (myProfile && myProfile.bio) || "";
    editAvatarPreview.innerHTML = avatarHtml(myProfile, "lg");
  }
  profilePhotoInput.addEventListener("change", function(){
    var file = profilePhotoInput.files[0];
    if(!file) return;
    resizeImageToDataURL(file, 320, 0.8).then(function(dataUrl){
      pendingProfilePhoto = dataUrl;
      editAvatarPreview.innerHTML = '<img class="avatar avatar-lg" src="' + dataUrl + '" alt="" />';
    }).catch(function(err){
      editProfileError.textContent = err.message || "No se pudo procesar la imagen.";
    });
  });

  editProfileForm.addEventListener("submit", function(e){
    e.preventDefault();
    editProfileError.textContent = "";
    editProfileNotice.textContent = "";
    var name = document.getElementById("profileName").value.trim();
    if(!name){ editProfileError.textContent = "Ponele un nombre a tu perfil."; return; }
    var update = {
      displayName: name,
      mainInstrument: document.getElementById("profileMainInstr").value.trim(),
      bio: document.getElementById("profileBio").value.trim()
    };
    if(pendingProfilePhoto) update.photoData = pendingProfilePhoto;

    editProfileSubmit.disabled = true;
    db.collection("users").doc(currentUser.uid).set(update, { merge: true }).then(function(){
      delete profileCache[currentUser.uid];
      return refreshOwnProfile();
    }).then(function(){
      editProfileNotice.textContent = "Perfil actualizado.";
    }).catch(function(err){
      editProfileError.textContent = err.message || "No se pudo guardar.";
    }).finally(function(){
      editProfileSubmit.disabled = false;
    });
  });

  // ---------------------------------------------------------------------
  // chat
  // ---------------------------------------------------------------------
  function chatIdFor(a, b){ return [a, b].sort().join("_"); }
  var chatsContent = document.getElementById("chatsContent");
  var chatContent = document.getElementById("chatContent");

  function renderChatsList(){
    chatsContent.innerHTML = '<p class="empty-state">Cargando…</p>';
    if(activeChatListUnsub) activeChatListUnsub();
    activeChatListUnsub = db.collection("chats")
      .where("participants", "array-contains", currentUser.uid)
      .orderBy("lastMessageAt", "desc")
      .onSnapshot(function(qs){
        if(qs.empty){
          chatsContent.innerHTML = '<p class="empty-state">Todavía no tenés conversaciones. Andá al perfil de otro músico y tocá "Enviar mensaje".</p>';
          return;
        }
        var rows = qs.docs.map(function(d){
          var c = d.data();
          var otherUid = c.participants.filter(function(p){ return p !== currentUser.uid; })[0];
          var otherName = (c.participantNames && c.participantNames[otherUid]) || "Usuario";
          return '' +
            '<button type="button" class="chat-item" data-uid="' + otherUid + '">' +
              avatarHtml({ displayName: otherName }, "md") +
              '<span class="chat-item-body">' +
                '<p class="chat-item-name">' + escapeHtml(otherName) + '</p>' +
                '<p class="chat-item-preview">' + escapeHtml(c.lastMessage || "") + '</p>' +
              '</span>' +
              '<span class="chat-item-time">' + formatTime(c.lastMessageAt) + '</span>' +
            '</button>';
        }).join("");
        chatsContent.innerHTML = '<div class="chat-list">' + rows + '</div>';
        Array.prototype.forEach.call(chatsContent.querySelectorAll(".chat-item"), function(btn){
          btn.addEventListener("click", function(){ location.hash = "#/chat/" + btn.getAttribute("data-uid"); });
        });
      }, function(err){
        chatsContent.innerHTML = '<p class="empty-state">Error al cargar mensajes: ' + escapeHtml(err.message || "") + '</p>';
      });
  }

  function renderChatWindow(otherUid){
    if(otherUid === currentUser.uid){ location.hash = "#/chats"; return; }
    var chatId = chatIdFor(currentUser.uid, otherUid);
    chatContent.innerHTML = '<p class="empty-state">Cargando…</p>';

    getProfile(otherUid).then(function(otherProfile){
      chatContent.innerHTML = '' +
        '<div class="chat-window">' +
          '<div class="chat-header">' + avatarHtml(otherProfile, "sm") + '<span class="name">' + escapeHtml(otherProfile.displayName || "") + '</span></div>' +
          '<div class="chat-messages" id="chatMessages"></div>' +
          '<form class="chat-input-row" id="chatSendForm">' +
            '<input type="text" id="chatInput" placeholder="Escribí un mensaje…" autocomplete="off" />' +
            '<button class="btn" type="submit">Enviar</button>' +
          '</form>' +
        '</div>';

      var messagesEl = document.getElementById("chatMessages");
      var chatRef = db.collection("chats").doc(chatId);

      if(activeChatUnsub) activeChatUnsub();
      activeChatUnsub = chatRef.collection("messages").orderBy("createdAt", "asc").limitToLast(200)
        .onSnapshot(function(qs){
          messagesEl.innerHTML = qs.docs.map(function(d){
            var m = d.data();
            var mine = m.senderId === currentUser.uid;
            return '' +
              '<div class="msg-row' + (mine ? " mine" : "") + '">' +
                '<div class="msg-bubble">' + escapeHtml(m.text) + '<span class="msg-time">' + formatTime(m.createdAt) + '</span></div>' +
              '</div>';
          }).join("");
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }, function(err){
          messagesEl.innerHTML = '<p class="empty-state">Error al cargar la conversación: ' + escapeHtml(err.message || "") + '</p>';
        });

      var form = document.getElementById("chatSendForm");
      var input = document.getElementById("chatInput");
      form.addEventListener("submit", function(e){
        e.preventDefault();
        var text = input.value.trim();
        if(!text) return;
        input.value = "";
        var participantNames = {};
        participantNames[currentUser.uid] = (myProfile && myProfile.displayName) || currentUser.email;
        participantNames[otherUid] = otherProfile.displayName;

        chatRef.set({
          participants: [currentUser.uid, otherUid],
          participantNames: participantNames,
          lastMessage: text,
          lastMessageAt: FieldValue.serverTimestamp()
        }, { merge: true }).then(function(){
          return chatRef.collection("messages").add({
            senderId: currentUser.uid,
            text: text,
            createdAt: FieldValue.serverTimestamp()
          });
        }).catch(function(err){
          alert("No se pudo enviar el mensaje: " + (err.message || err));
        });
      });
    });
  }

})();
