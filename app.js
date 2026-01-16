// ============================
// MONE MVP — cierre + confirmación + stars + NOTIFICACIONES IN-APP
// ============================

const LS = {
  users: "mone_users",
  requests: "mone_requests",
  session: "mone_session",
  ratings: "mone_ratings",
  notifications: "mone_notifications"
};

function uid(prefix="id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*100000)}`;
}
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function getUsers() { return load(LS.users, []); }
function setUsers(u) { save(LS.users, u); }

function getRequests() { return load(LS.requests, []); }
function setRequests(r) { save(LS.requests, r); }

function getRatings() { return load(LS.ratings, []); }
function setRatings(r) { save(LS.ratings, r); }

function getNotifications() { return load(LS.notifications, []); }
function setNotifications(n) { save(LS.notifications, n); }

function getSession() { return load(LS.session, null); }
function setSession(s) { save(LS.session, s); }
function logout() { localStorage.removeItem(LS.session); }

// ---------- Notifications core ----------
function addNotification(userId, title, body) {
  const all = getNotifications();
  all.unshift({
    id: uid("n"),
    userId,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false
  });
  setNotifications(all);
}

function countUnread(userId) {
  return getNotifications().filter(n => n.userId === userId && !n.read).length;
}

function updateNotifUI(user) {
  const unread = countUnread(user.id);

  const badge = document.getElementById("notifBadge");
  const pill = document.getElementById("notifCountPill");
  if (badge) {
    badge.style.display = unread > 0 ? "inline-flex" : "none";
    badge.textContent = String(unread);
  }
  if (pill) {
    pill.textContent = `${unread} sin leer`;
  }
}

function renderNotifications(user) {
  const list = document.getElementById("notifList");
  if (!list) return;

  const items = getNotifications().filter(n => n.userId === user.id);
  updateNotifUI(user);

  if (!items.length) {
    list.innerHTML = `<div class="item"><p class="muted">No tienes notificaciones aún.</p></div>`;
    return;
  }

  list.innerHTML = items.map(n => {
    const dotClass = n.read ? "notifDot read" : "notifDot";
    const when = new Date(n.createdAt);
    const whenTxt = `${when.toLocaleDateString()} ${when.toLocaleTimeString().slice(0,5)}`;
    return `
      <div class="item">
        <div class="notif">
          <div class="${dotClass}"></div>
          <div style="flex:1;">
            <p class="notifTitle">${n.title}</p>
            <p class="notifBody">${n.body}</p>
            <p class="notifMeta">${whenTxt}</p>
            <div class="actions">
              ${n.read ? "" : `<button class="btn" onclick="moneMarkNotificationRead('${n.id}')">Marcar leído</button>`}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function moneMarkNotificationRead(notifId) {
  const session = getSession();
  const user = getUsers().find(u => u.id === session.userId);
  if (!user) return;

  const all = getNotifications();
  const n = all.find(x => x.id === notifId && x.userId === user.id);
  if (n) {
    n.read = true;
    setNotifications(all);
  }
  renderNotifications(user);
}

function moneMarkAllNotificationsRead() {
  const session = getSession();
  const user = getUsers().find(u => u.id === session.userId);
  if (!user) return;

  const all = getNotifications();
  all.forEach(n => { if (n.userId === user.id) n.read = true; });
  setNotifications(all);
  renderNotifications(user);
}

function moneClearNotifications() {
  const session = getSession();
  const user = getUsers().find(u => u.id === session.userId);
  if (!user) return;

  if (!confirm("¿Vaciar tus notificaciones?")) return;
  const all = getNotifications().filter(n => n.userId !== user.id);
  setNotifications(all);
  renderNotifications(user);
}

// --------- NAV ----------
function moneNav(which){
  const home = document.getElementById("home");
  const help = document.getElementById("help");
  const notifications = document.getElementById("notifications");
  const navHome = document.getElementById("navHome");
  const navHelp = document.getElementById("navHelp");
  const navNotif = document.getElementById("navNotif");

  const show = (el, on) => { if (el) el.style.display = on ? "block" : "none"; };

  show(home, which === "home");
  show(help, which === "help");
  show(notifications, which === "notifications");

  if (navHome) navHome.classList.toggle("active", which === "home");
  if (navHelp) navHelp.classList.toggle("active", which === "help");
  if (navNotif) navNotif.classList.toggle("active", which === "notifications");

  // al entrar en notificaciones, renderiza
  if (which === "notifications") {
    const session = getSession();
    const user = getUsers().find(u => u.id === session?.userId);
    if (user) renderNotifications(user);
  }
}

// --------- ENTER ----------
function moneEnter() {
  const name = (document.getElementById("name")?.value || "").trim();
  const role = document.getElementById("role")?.value;
  const zone = document.getElementById("zone")?.value;

  if (!name) { alert("Pon un nombre"); return; }

  const users = getUsers();
  let user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.role === role);

  if (!user) {
    user = {
      id: uid("u"),
      name,
      role,
      zone,
      ratingSum: 0,
      ratingCount: 0
    };
    users.push(user);
    setUsers(users);

    addNotification(user.id, "Bienvenido a MONE", "Tu cuenta MVP está lista. Ya puedes usar la plataforma.");
  } else {
    user.zone = zone;
    setUsers(users);
  }

  setSession({ userId: user.id });
  window.location.href = "dashboard.html";
}

function moneLogout() {
  logout();
  window.location.href = "index.html";
}

// --------- BOOT ----------
function moneBootDashboard() {
  const session = getSession();
  if (!session) { window.location.href = "index.html"; return; }

  const user = getUsers().find(u => u.id === session.userId);
  if (!user) { moneLogout(); return; }

  const who = document.getElementById("whoami");
  if (who) who.textContent = `${user.name} · ${user.role} · ${user.zone}`;

  const views = {
    "acompañado": "view-acompañado",
    "moderador": "view-moderador",
    "acompañante": "view-acompañante"
  };

  Object.values(views).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  document.getElementById(views[user.role]).style.display = "block";

  // Notif badge
  updateNotifUI(user);

  // default view
  moneNav("home");
  moneRender(user);
}

// --------- REQUESTS ----------
function moneCreateRequest() {
  const session = getSession();
  const user = getUsers().find(u => u.id === session.userId);
  if (!user || user.role !== "acompañado") return;

  const type = document.getElementById("reqType").value;
  const when = document.getElementById("reqWhen").value.trim();
  if (!when) { alert("Pon fecha y hora"); return; }

  const req = {
    id: uid("r"),
    accompaniedId: user.id,
    accompaniedName: user.name,
    zone: user.zone,
    type,
    when,
    status: "NUEVA",
    moderatorId: null,
    companionId: null,
    companionName: null,
    closedByCompanionAt: null,
    confirmedByAccompaniedAt: null
  };

  const reqs = getRequests();
  reqs.unshift(req);
  setRequests(reqs);

  addNotification(user.id, "Solicitud creada", `Has creado una solicitud: ${type} · ${when}.`);

  document.getElementById("reqWhen").value = "";
  moneRender(user);
}

function moneAssign(requestId, companionId) {
  const session = getSession();
  const mod = getUsers().find(u => u.id === session.userId);
  if (!mod || mod.role !== "moderador") return;

  const users = getUsers();
  const companion = users.find(u => u.id === companionId && u.role === "acompañante");
  const reqs = getRequests();
  const req = reqs.find(r => r.id === requestId);
  if (!req || !companion) return;

  req.moderatorId = mod.id;
  req.companionId = companion.id;
  req.companionName = companion.name;
  req.status = "PENDIENTE_ACEPTACION";

  setRequests(reqs);

  addNotification(companion.id, "Nueva asignación", `Te han asignado: ${req.type} · ${req.when} · ${req.zone}.`);
  addNotification(mod.id, "Asignación enviada", `Asignaste a ${companion.name} una solicitud de ${req.accompaniedName}.`);

  moneRender(mod);
  updateNotifUI(mod);
}

function moneAccept(requestId) {
  const session = getSession();
  const comp = getUsers().find(u => u.id === session.userId);
  if (!comp || comp.role !== "acompañante") return;

  const reqs = getRequests();
  const req = reqs.find(r => r.id === requestId);
  if (!req || req.companionId !== comp.id) return;

  req.status = "ACEPTADA";
  setRequests(reqs);

  addNotification(comp.id, "Acompañamiento aceptado", `Has aceptado: ${req.type} · ${req.when}.`);
  addNotification(req.accompaniedId, "Acompañante confirmado", `${comp.name} ha aceptado tu solicitud: ${req.type} · ${req.when}.`);
  if (req.moderatorId) addNotification(req.moderatorId, "Aceptación", `${comp.name} aceptó una solicitud de ${req.accompaniedName}.`);

  moneRender(comp);
  updateNotifUI(comp);
}

function moneReject(requestId) {
  const session = getSession();
  const comp = getUsers().find(u => u.id === session.userId);
  if (!comp || comp.role !== "acompañante") return;

  const reqs = getRequests();
  const req = reqs.find(r => r.id === requestId);
  if (!req || req.companionId !== comp.id) return;

  req.status = "RECHAZADA";
  req.companionId = null;
  req.companionName = null;

  setRequests(reqs);

  addNotification(comp.id, "Asignación rechazada", `Has rechazado una asignación: ${req.type} · ${req.when}.`);
  if (req.moderatorId) addNotification(req.moderatorId, "Rechazo", `${comp.name} rechazó una solicitud de ${req.accompaniedName}.`);

  moneRender(comp);
  updateNotifUI(comp);
}

// Acompañante marca finalizado → pasa a "CIERRE_SOLICITADO"
function moneRequestClose(requestId) {
  const session = getSession();
  const comp = getUsers().find(u => u.id === session.userId);
  if (!comp || comp.role !== "acompañante") return;

  const reqs = getRequests();
  const req = reqs.find(r => r.id === requestId);
  if (!req || req.companionId !== comp.id) return;
  if (req.status !== "ACEPTADA") return;

  req.status = "CIERRE_SOLICITADO";
  req.closedByCompanionAt = new Date().toISOString();

  setRequests(reqs);

  addNotification(comp.id, "Cierre solicitado", `Marcaste como finalizado: ${req.type} · ${req.when}.`);
  addNotification(req.accompaniedId, "Confirma la finalización", `Confirma si el acompañamiento ha finalizado: ${req.type} · ${req.when}.`);

  moneRender(comp);
  updateNotifUI(comp);
}

// Acompañado confirma finalización → "COMPLETADA"
function moneConfirmClose(requestId) {
  const session = getSession();
  const acc = getUsers().find(u => u.id === session.userId);
  if (!acc || acc.role !== "acompañado") return;

  const reqs = getRequests();
  const req = reqs.find(r => r.id === requestId);
  if (!req || req.accompaniedId !== acc.id) return;
  if (req.status !== "CIERRE_SOLICITADO") return;

  req.status = "COMPLETADA";
  req.confirmedByAccompaniedAt = new Date().toISOString();

  setRequests(reqs);

  addNotification(acc.id, "Acompañamiento completado", "Gracias. Puedes valorar ahora.");
  if (req.companionId) addNotification(req.companionId, "Acompañamiento completado", "Gracias. Puedes valorar ahora.");

  moneRender(acc);
  updateNotifUI(acc);
}

// --------- RATINGS ----------
function hasRated(requestId, fromUserId) {
  const ratings = getRatings();
  return ratings.some(r => r.requestId === requestId && r.fromUserId === fromUserId);
}

function applyRating(toUserId, score) {
  const users = getUsers();
  const target = users.find(u => u.id === toUserId);
  if (target) {
    target.ratingSum = (target.ratingSum || 0) + score;
    target.ratingCount = (target.ratingCount || 0) + 1;
    setUsers(users);
  }
}

function submitRating(requestId, fromUserId, toUserId, score) {
  const ratings = getRatings();
  ratings.push({
    id: uid("rat"),
    requestId,
    fromUserId,
    toUserId,
    score,
    at: new Date().toISOString()
  });
  setRatings(ratings);
  applyRating(toUserId, score);
}

function userRatingLabel(userId) {
  const u = getUsers().find(x => x.id === userId);
  if (!u || !u.ratingCount) return "Sin valoraciones";
  const avg = (u.ratingSum / u.ratingCount).toFixed(1);
  return `${avg} / 5 (${u.ratingCount})`;
}

// ⭐ Stars widget
function starsWidgetHTML(requestId, targetUserId) {
  const id = `stars_${requestId}_${targetUserId}`;
  return `
    <div class="starbox" role="group" aria-label="Valoración de 1 a 5">
      <div class="stars" id="${id}">
        ${[1,2,3,4,5].map(n => `
          <button class="starbtn" type="button" aria-label="${n} estrellas"
            onclick="moneClickStar('${requestId}','${targetUserId}',${n})">★</button>
        `).join("")}
      </div>
      <div class="starhint">Pulsa una estrella</div>
    </div>
  `;
}

function paintStars(containerId, n) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const btns = box.querySelectorAll(".starbtn");
  btns.forEach((b, i) => b.classList.toggle("on", i < n));
}

function moneClickStar(requestId, targetUserId, score) {
  const session = getSession();
  const from = getUsers().find(u => u.id === session.userId);
  if (!from) return;

  const req = getRequests().find(r => r.id === requestId);
  if (!req || req.status !== "COMPLETADA") {
    alert("Solo se puede valorar cuando esté completado.");
    return;
  }
  if (hasRated(requestId, from.id)) {
    alert("Ya has valorado este acompañamiento.");
    return;
  }

  paintStars(`stars_${requestId}_${targetUserId}`, score);
  submitRating(requestId, from.id, targetUserId, score);

  addNotification(from.id, "Valoración enviada", `Has valorado con ${score} estrellas.`);
  addNotification(targetUserId, "Has recibido una valoración", `Has recibido ${score} estrellas.`);

  moneRender(from);
  updateNotifUI(from);
}

// --------- UI ----------
function statusChip(status){
  const map = {
    "NUEVA": { cls:"new", label:"Nueva" },
    "PENDIENTE_ACEPTACION": { cls:"pending", label:"Pendiente" },
    "ACEPTADA": { cls:"accepted", label:"Confirmada" },
    "RECHAZADA": { cls:"rejected", label:"Rechazada" },
    "CIERRE_SOLICITADO": { cls:"pending", label:"Cierre solicitado" },
    "COMPLETADA": { cls:"accepted", label:"Completada" },
  };
  const m = map[status] || {cls:"", label:status};
  return `<span class="chip ${m.cls}">${m.label}</span>`;
}

function moneRender(user) {
  if (user.role === "acompañado") renderAccompanied(user);
  if (user.role === "moderador") renderModerator(user);
  if (user.role === "acompañante") renderCompanion(user);
}

function renderAccompanied(user) {
  const list = document.getElementById("myRequests");
  if (!list) return;

  const reqs = getRequests().filter(r => r.accompaniedId === user.id);

  if (!reqs.length) {
    list.innerHTML = `<div class="item"><p class="muted">Aún no has creado solicitudes.</p></div>`;
    return;
  }

  list.innerHTML = reqs.map(r => {
    const showComp = (["ACEPTADA","CIERRE_SOLICITADO","COMPLETADA"].includes(r.status))
      ? `<p class="meta"><b>Acompañante:</b> ${r.companionName} · <span class="muted small">${userRatingLabel(r.companionId)}</span></p>`
      : "";

    const confirmBtn = (r.status === "CIERRE_SOLICITADO")
      ? `<button class="btn primary" onclick="moneConfirmClose('${r.id}')">Confirmar finalización</button>`
      : "";

    const rateBlock = (r.status === "COMPLETADA" && !hasRated(r.id, user.id))
      ? starsWidgetHTML(r.id, r.companionId)
      : (r.status === "COMPLETADA" ? `<span class="muted small">Gracias, valoración enviada.</span>` : "");

    return `
      <div class="item">
        <h4>${r.type}</h4>
        <p class="meta"><b>Barrio:</b> ${r.zone}</p>
        <p class="meta"><b>Cuándo:</b> ${r.when}</p>
        ${showComp}
        ${statusChip(r.status)}
        <div class="actions">
          ${confirmBtn}
          ${rateBlock}
        </div>
      </div>
    `;
  }).join("");

  updateNotifUI(user);
}

function renderModerator(user) {
  const container = document.getElementById("modRequests");
  if (!container) return;

  const reqs = getRequests();
  const queue = reqs.filter(r => r.status === "NUEVA" || r.status === "RECHAZADA");
  const inProgress = reqs.filter(r => ["PENDIENTE_ACEPTACION","ACEPTADA","CIERRE_SOLICITADO"].includes(r.status));

  const kpiP = document.getElementById("kpiPending");
  const kpiI = document.getElementById("kpiInProgress");
  if (kpiP) kpiP.textContent = String(queue.length);
  if (kpiI) kpiI.textContent = String(inProgress.length);

  const companions = getUsers().filter(u => u.role === "acompañante");

  if (!queue.length) {
    container.innerHTML = `<div class="item"><p class="muted">No hay solicitudes pendientes ahora mismo.</p></div>`;
    updateNotifUI(user);
    return;
  }

  container.innerHTML = queue.map(r => {
    const eligible = companions.filter(c => c.zone === r.zone);
    const options = eligible.length
      ? eligible.map(c => `<option value="${c.id}">${c.name} · ${c.zone} · ${userRatingLabel(c.id)}</option>`).join("")
      : `<option value="">Sin acompañantes en ${r.zone}</option>`;

    return `
      <div class="item">
        <h4>${r.type}</h4>
        <p class="meta"><b>Acompañado:</b> ${r.accompaniedName}</p>
        <p class="meta"><b>Barrio:</b> ${r.zone} · <b>Cuándo:</b> ${r.when}</p>
        ${statusChip(r.status)}
        <div class="actions">
          <select class="input" style="max-width:420px;" id="sel_${r.id}">
            ${options}
          </select>
          <button class="btn primary" onclick="(function(){
            const v=document.getElementById('sel_${r.id}').value;
            if(!v){alert('No hay acompañante disponible en ese barrio');return;}
            moneAssign('${r.id}', v);
          })()">Asignar</button>
        </div>
      </div>
    `;
  }).join("");

  updateNotifUI(user);
}

function renderCompanion(user) {
  const pendingDiv = document.getElementById("myAssignmentsPending");
  const activeDiv = document.getElementById("myAssignmentsActive");
  if (!pendingDiv || !activeDiv) return;

  const reqs = getRequests().filter(r => r.companionId === user.id);

  const pending = reqs.filter(r => r.status === "PENDIENTE_ACEPTACION");
  const active = reqs.filter(r => ["ACEPTADA","CIERRE_SOLICITADO","COMPLETADA"].includes(r.status));

  pendingDiv.innerHTML = pending.length
    ? pending.map(r => `
      <div class="item">
        <h4>${r.type}</h4>
        <p class="meta"><b>Acompañado:</b> ${r.accompaniedName}</p>
        <p class="meta"><b>Barrio:</b> ${r.zone} · <b>Cuándo:</b> ${r.when}</p>
        ${statusChip(r.status)}
        <div class="actions">
          <button class="btn primary" onclick="moneAccept('${r.id}')">Aceptar</button>
          <button class="btn danger" onclick="moneReject('${r.id}')">Rechazar</button>
        </div>
      </div>
    `).join("")
    : `<div class="item"><p class="muted">No tienes decisiones pendientes.</p></div>`;

  activeDiv.innerHTML = active.length
    ? active.map(r => {
      const closeBtn = (r.status === "ACEPTADA")
        ? `<button class="btn primary" onclick="moneRequestClose('${r.id}')">Marcar finalizado</button>`
        : "";

      const waitingConfirm = (r.status === "CIERRE_SOLICITADO")
        ? `<span class="muted small">Esperando confirmación del acompañado.</span>`
        : "";

      const rateBlock = (r.status === "COMPLETADA" && !hasRated(r.id, user.id))
        ? starsWidgetHTML(r.id, r.accompaniedId)
        : (r.status === "COMPLETADA" ? `<span class="muted small">Gracias, valoración enviada.</span>` : "");

      return `
        <div class="item">
          <h4>${r.type}</h4>
          <p class="meta"><b>Acompañado:</b> ${r.accompaniedName} · <span class="muted small">${userRatingLabel(r.accompaniedId)}</span></p>
          <p class="meta"><b>Barrio:</b> ${r.zone} · <b>Cuándo:</b> ${r.when}</p>
          ${statusChip(r.status)}
          <div class="actions">
            ${closeBtn}
            ${waitingConfirm}
            ${rateBlock}
          </div>
        </div>
      `;
    }).join("")
    : `<div class="item"><p class="muted">Aún no tienes acompañamientos activos.</p></div>`;

  updateNotifUI(user);
}

// --------- RESET + DEMO ----------
function moneResetAll() {
  if (!confirm("¿Borrar todo el almacenamiento local?")) return;
  localStorage.removeItem(LS.users);
  localStorage.removeItem(LS.requests);
  localStorage.removeItem(LS.session);
  localStorage.removeItem(LS.ratings);
  localStorage.removeItem(LS.notifications);
  window.location.href = "index.html";
}

function moneSeedDemoData() {
  const users = [
    { id: uid("u"), name:"Iker", role:"moderador", zone:"Sant Francesc", ratingSum:0, ratingCount:0 },
    { id: uid("u"), name:"Pau", role:"acompañante", zone:"Ruzafa", ratingSum:18, ratingCount:4 },
    { id: uid("u"), name:"Maria", role:"acompañante", zone:"El Carme", ratingSum:10, ratingCount:2 },
    { id: uid("u"), name:"Carmen", role:"acompañado", zone:"Ruzafa", ratingSum:0, ratingCount:0 },
  ];
  setUsers(users);

  const reqs = [{
    id: uid("r"),
    accompaniedId: users[3].id,
    accompaniedName: users[3].name,
    zone: users[3].zone,
    type: "Cita médica",
    when: "Viernes 10:30",
    status: "NUEVA",
    moderatorId: null,
    companionId: null,
    companionName: null,
    closedByCompanionAt: null,
    confirmedByAccompaniedAt: null
  }];
  setRequests(reqs);

  setRatings([]);
  setNotifications([]);

  // Notif welcome
  users.forEach(u => addNotification(u.id, "Demo lista", "Se han creado usuarios y una solicitud para probar el flujo."));

  setSession({ userId: users[0].id });
  window.location.href = "dashboard.html";
}
