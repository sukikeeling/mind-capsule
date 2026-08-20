/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/user_configs.pb.js — 业务 collection + REST CRUD 路由 (self-contained)
//
// 由 mcp__rh-pb-hooks__install_business_collection 装. 不要直接 Read+Write 这个文件.
// 业务字段: user_id:text, font_size:number, density:text, grain_level:text, motion_intensity:text, night_mode:bool, think_collapsed:bool, tools_collapsed:bool, streaming_text:bool
// 路由: list,get,create,update,delete
// list filter 字段: (none)
// list 默认排序: -created

onBootstrap(function (e) {
  e.next()
  try {
    var existing = null
    try { existing = $app.findCollectionByNameOrId("user_configs") } catch (_) { existing = null }
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
      addField({ name: 'user_id', type: 'text', max: 50 })
      addField({ name: 'font_size', type: 'number' })
      addField({ name: 'density', type: 'text', max: 20 })
      addField({ name: 'grain_level', type: 'text', max: 20 })
      addField({ name: 'motion_intensity', type: 'text', max: 20 })
      addField({ name: 'night_mode', type: 'bool' })
      addField({ name: 'think_collapsed', type: 'bool' })
      addField({ name: 'tools_collapsed', type: 'bool' })
      addField({ name: 'streaming_text', type: 'bool' })
      addField({ name: "created", type: "autodate", onCreate: true })
      addField({ name: "updated", type: "autodate", onCreate: true, onUpdate: true })
      if (changed) {
        $app.save(existing)
        try { $app.logger().info("user_configs collection upgraded") } catch (_) {}
      }
    } else {
      var col = new Collection({
        type: "base",
        name: "user_configs",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
          { name: 'user_id', type: 'text', max: 50 },
          { name: 'font_size', type: 'number' },
          { name: 'density', type: 'text', max: 20 },
          { name: 'grain_level', type: 'text', max: 20 },
          { name: 'motion_intensity', type: 'text', max: 20 },
          { name: 'night_mode', type: 'bool' },
          { name: 'think_collapsed', type: 'bool' },
          { name: 'tools_collapsed', type: 'bool' },
          { name: 'streaming_text', type: 'bool' },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      })
      $app.save(col)
      try { $app.logger().info("user_configs collection created") } catch (_) {}
    }
  } catch (err) {
    try { $app.logger().error("user_configs bootstrap: " + String(err && err.message || err)) } catch (_) {}
  }
})

// GET /api/user_configs?page=1&perPage=50&sort=-created
routerAdd("GET", "/api/user_configs", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("user_configs") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "user_configs",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'user_id', type: 'text', max: 50 },
          { name: 'font_size', type: 'number' },
          { name: 'density', type: 'text', max: 20 },
          { name: 'grain_level', type: 'text', max: 20 },
          { name: 'motion_intensity', type: 'text', max: 20 },
          { name: 'night_mode', type: 'bool' },
          { name: 'think_collapsed', type: 'bool' },
          { name: 'tools_collapsed', type: 'bool' },
          { name: 'streaming_text', type: 'bool' },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("user_configs")
  }
  try {
    ensureCollLocal()
    var info = e.requestInfo()
    var query = info.query || {}
    var page = parseInt(String(query.page || "1"), 10) || 1
    var perPage = parseInt(String(query.perPage || "50"), 10) || 50
    if (perPage > 200) perPage = 200
    var sort = String(query.sort || "-created")
    var filterParts = []
    var params = {}
    // no list_filter_fields configured
    var filter = filterParts.length > 0 ? filterParts.join(" && ") : ""
    var records = filter
      ? $app.findRecordsByFilter("user_configs", filter, sort, perPage, (page - 1) * perPage, params)
      : $app.findRecordsByFilter("user_configs", "", sort, perPage, (page - 1) * perPage)
    var items = []
    for (var i = 0; i < records.length; i++) {
      items.push(records[i].publicExport())
    }
    return e.json(200, { items: items, page: page, perPage: perPage, totalItems: items.length })
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("user_configs list: " + msg) } catch (_) {}
    return e.json(500, { error: "list_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// GET /api/user_configs/{id}
routerAdd("GET", "/api/user_configs/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("user_configs", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "get_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// POST /api/user_configs  body 字段: user_id, font_size, density, grain_level, motion_intensity, night_mode, think_collapsed, tools_collapsed, streaming_text
routerAdd("POST", "/api/user_configs", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("user_configs") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "user_configs",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'user_id', type: 'text', max: 50 },
          { name: 'font_size', type: 'number' },
          { name: 'density', type: 'text', max: 20 },
          { name: 'grain_level', type: 'text', max: 20 },
          { name: 'motion_intensity', type: 'text', max: 20 },
          { name: 'night_mode', type: 'bool' },
          { name: 'think_collapsed', type: 'bool' },
          { name: 'tools_collapsed', type: 'bool' },
          { name: 'streaming_text', type: 'bool' },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("user_configs")
  }
  try {
    var coll = ensureCollLocal()
    var body = e.requestInfo().body || {}
    var rec = new Record(coll)
    rec.set("user_id", body.user_id === undefined || body.user_id === null ? "" : String(body.user_id))
    rec.set("font_size", (body.font_size === undefined || body.font_size === null) ? 0 : Number(body.font_size))
    rec.set("density", body.density === undefined || body.density === null ? "" : String(body.density))
    rec.set("grain_level", body.grain_level === undefined || body.grain_level === null ? "" : String(body.grain_level))
    rec.set("motion_intensity", body.motion_intensity === undefined || body.motion_intensity === null ? "" : String(body.motion_intensity))
    rec.set("night_mode", !!body.night_mode)
    rec.set("think_collapsed", !!body.think_collapsed)
    rec.set("tools_collapsed", !!body.tools_collapsed)
    rec.set("streaming_text", !!body.streaming_text)
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("user_configs create: " + msg) } catch (_) {}
    return e.json(500, { error: "create_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// PATCH /api/user_configs/{id}  body 字段同 POST, 只更新 body 里出现的字段
routerAdd("PATCH", "/api/user_configs/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("user_configs", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    var body = e.requestInfo().body || {}
    if ("user_id" in body) rec.set("user_id", body.user_id === undefined || body.user_id === null ? "" : String(body.user_id))
    if ("font_size" in body) rec.set("font_size", (body.font_size === undefined || body.font_size === null) ? 0 : Number(body.font_size))
    if ("density" in body) rec.set("density", body.density === undefined || body.density === null ? "" : String(body.density))
    if ("grain_level" in body) rec.set("grain_level", body.grain_level === undefined || body.grain_level === null ? "" : String(body.grain_level))
    if ("motion_intensity" in body) rec.set("motion_intensity", body.motion_intensity === undefined || body.motion_intensity === null ? "" : String(body.motion_intensity))
    if ("night_mode" in body) rec.set("night_mode", !!body.night_mode)
    if ("think_collapsed" in body) rec.set("think_collapsed", !!body.think_collapsed)
    if ("tools_collapsed" in body) rec.set("tools_collapsed", !!body.tools_collapsed)
    if ("streaming_text" in body) rec.set("streaming_text", !!body.streaming_text)
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "update_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// DELETE /api/user_configs/{id}
routerAdd("DELETE", "/api/user_configs/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("user_configs", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    $app.delete(rec)
    return e.json(200, { ok: true })
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "delete_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
