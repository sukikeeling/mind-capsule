/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/playlists.pb.js — 业务 collection + REST CRUD 路由 (self-contained)
//
// 由 mcp__rh-pb-hooks__install_business_collection 装. 不要直接 Read+Write 这个文件.
// 业务字段: track_no:number, title:text, artist:text, duration:text, companion_note:text, audio_url:text
// 路由: list,get,create,update,delete
// list filter 字段: (none)
// list 默认排序: track_no

onBootstrap(function (e) {
  e.next()
  try {
    var existing = null
    try { existing = $app.findCollectionByNameOrId("playlists") } catch (_) { existing = null }
    if (existing) {
      var changed = false
      function hasField(name) {
        try { return !!existing.fields.getByName(name) } catch (_) {}
        try {
          for (var i = 0; i < existing.fields.length; i++) {
            if (String(existing.fields[i].name) === String(name)) return true
          }
        } catch (_) {}
        return false
      }
      function addField(def) {
        if (hasField(def.name)) return
        try { existing.fields.add(new Field(def)); changed = true } catch (_) {}
      }
      addField({ name: 'track_no', type: 'number', required: true })
      addField({ name: 'title', type: 'text', required: true, max: 120 })
      addField({ name: 'artist', type: 'text', required: true, max: 120 })
      addField({ name: 'duration', type: 'text', max: 12 })
      addField({ name: 'companion_note', type: 'text' })
      addField({ name: 'audio_url', type: 'text' })
      addField({ name: "created", type: "autodate", onCreate: true })
      addField({ name: "updated", type: "autodate", onCreate: true, onUpdate: true })
      if (changed) {
        $app.save(existing)
        try { $app.logger().info("playlists collection upgraded") } catch (_) {}
      }
    } else {
      var col = new Collection({
        type: "base",
        name: "playlists",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
          { name: 'track_no', type: 'number', required: true },
          { name: 'title', type: 'text', required: true, max: 120 },
          { name: 'artist', type: 'text', required: true, max: 120 },
          { name: 'duration', type: 'text', max: 12 },
          { name: 'companion_note', type: 'text' },
          { name: 'audio_url', type: 'text' },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      })
      $app.save(col)
      try { $app.logger().info("playlists collection created") } catch (_) {}
    }
  } catch (err) {
    try { $app.logger().error("playlists bootstrap: " + String(err && err.message || err)) } catch (_) {}
  }
})

// GET /api/playlists?page=1&perPage=50&sort=-created
routerAdd("GET", "/api/playlists", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("playlists") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "playlists",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'track_no', type: 'number', required: true },
          { name: 'title', type: 'text', required: true, max: 120 },
          { name: 'artist', type: 'text', required: true, max: 120 },
          { name: 'duration', type: 'text', max: 12 },
          { name: 'companion_note', type: 'text' },
          { name: 'audio_url', type: 'text' },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("playlists")
  }
  try {
    ensureCollLocal()
    var info = e.requestInfo()
    var query = info.query || {}
    var page = parseInt(String(query.page || "1"), 10) || 1
    var perPage = parseInt(String(query.perPage || "50"), 10) || 50
    if (perPage > 200) perPage = 200
    var sort = String(query.sort || "track_no")
    var filterParts = []
    var params = {}
    // no list_filter_fields configured
    var filter = filterParts.length > 0 ? filterParts.join(" && ") : ""
    var records = filter
      ? $app.findRecordsByFilter("playlists", filter, sort, perPage, (page - 1) * perPage, params)
      : $app.findRecordsByFilter("playlists", "", sort, perPage, (page - 1) * perPage)
    var items = []
    for (var i = 0; i < records.length; i++) {
      items.push(records[i].publicExport())
    }
    return e.json(200, { items: items, page: page, perPage: perPage, totalItems: items.length })
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("playlists list: " + msg) } catch (_) {}
    return e.json(500, { error: "list_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// GET /api/playlists/{id}
routerAdd("GET", "/api/playlists/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("playlists", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "get_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// POST /api/playlists  body 字段: track_no, title, artist, duration, companion_note, audio_url
routerAdd("POST", "/api/playlists", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("playlists") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "playlists",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'track_no', type: 'number', required: true },
          { name: 'title', type: 'text', required: true, max: 120 },
          { name: 'artist', type: 'text', required: true, max: 120 },
          { name: 'duration', type: 'text', max: 12 },
          { name: 'companion_note', type: 'text' },
          { name: 'audio_url', type: 'text' },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("playlists")
  }
  try {
    var coll = ensureCollLocal()
    var body = e.requestInfo().body || {}
    var rec = new Record(coll)
    rec.set("track_no", (body.track_no === undefined || body.track_no === null) ? 0 : Number(body.track_no))
    rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    rec.set("artist", body.artist === undefined || body.artist === null ? "" : String(body.artist))
    rec.set("duration", body.duration === undefined || body.duration === null ? "" : String(body.duration))
    rec.set("companion_note", body.companion_note === undefined || body.companion_note === null ? "" : String(body.companion_note))
    rec.set("audio_url", body.audio_url === undefined || body.audio_url === null ? "" : String(body.audio_url))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("playlists create: " + msg) } catch (_) {}
    return e.json(500, { error: "create_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// PATCH /api/playlists/{id}  body 字段同 POST, 只更新 body 里出现的字段
routerAdd("PATCH", "/api/playlists/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("playlists", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    var body = e.requestInfo().body || {}
    if ("track_no" in body) rec.set("track_no", (body.track_no === undefined || body.track_no === null) ? 0 : Number(body.track_no))
    if ("title" in body) rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    if ("artist" in body) rec.set("artist", body.artist === undefined || body.artist === null ? "" : String(body.artist))
    if ("duration" in body) rec.set("duration", body.duration === undefined || body.duration === null ? "" : String(body.duration))
    if ("companion_note" in body) rec.set("companion_note", body.companion_note === undefined || body.companion_note === null ? "" : String(body.companion_note))
    if ("audio_url" in body) rec.set("audio_url", body.audio_url === undefined || body.audio_url === null ? "" : String(body.audio_url))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "update_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// DELETE /api/playlists/{id}
routerAdd("DELETE", "/api/playlists/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("playlists", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    $app.delete(rec)
    return e.json(200, { ok: true })
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "delete_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
