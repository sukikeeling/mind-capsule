/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/rooms.pb.js — 业务 collection + REST CRUD 路由 (self-contained)
//
// 由 mcp__rh-pb-hooks__install_business_collection 装. 不要直接 Read+Write 这个文件.
// 业务字段: specimen_id:text, title:text, roman_num:text, specimen_svg:text, theme_color:text, route_target:text
// 路由: list,get,create,update,delete
// list filter 字段: (none)
// list 默认排序: -created

onBootstrap(function (e) {
  e.next()
  try {
    var existing = null
    try { existing = $app.findCollectionByNameOrId("rooms") } catch (_) { existing = null }
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
      addField({ name: 'specimen_id', type: 'text', required: true, max: 50 })
      addField({ name: 'title', type: 'text', required: true, max: 100 })
      addField({ name: 'roman_num', type: 'text', max: 10 })
      addField({ name: 'specimen_svg', type: 'text' })
      addField({ name: 'theme_color', type: 'text', max: 20 })
      addField({ name: 'route_target', type: 'text', max: 50 })
      addField({ name: "created", type: "autodate", onCreate: true })
      addField({ name: "updated", type: "autodate", onCreate: true, onUpdate: true })
      if (changed) {
        $app.save(existing)
        try { $app.logger().info("rooms collection upgraded") } catch (_) {}
      }
    } else {
      var col = new Collection({
        type: "base",
        name: "rooms",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
          { name: 'specimen_id', type: 'text', required: true, max: 50 },
          { name: 'title', type: 'text', required: true, max: 100 },
          { name: 'roman_num', type: 'text', max: 10 },
          { name: 'specimen_svg', type: 'text' },
          { name: 'theme_color', type: 'text', max: 20 },
          { name: 'route_target', type: 'text', max: 50 },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      })
      $app.save(col)
      try { $app.logger().info("rooms collection created") } catch (_) {}
    }
  } catch (err) {
    try { $app.logger().error("rooms bootstrap: " + String(err && err.message || err)) } catch (_) {}
  }
})

// GET /api/rooms?page=1&perPage=50&sort=-created
routerAdd("GET", "/api/rooms", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("rooms") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "rooms",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'specimen_id', type: 'text', required: true, max: 50 },
          { name: 'title', type: 'text', required: true, max: 100 },
          { name: 'roman_num', type: 'text', max: 10 },
          { name: 'specimen_svg', type: 'text' },
          { name: 'theme_color', type: 'text', max: 20 },
          { name: 'route_target', type: 'text', max: 50 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("rooms")
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
      ? $app.findRecordsByFilter("rooms", filter, sort, perPage, (page - 1) * perPage, params)
      : $app.findRecordsByFilter("rooms", "", sort, perPage, (page - 1) * perPage)
    var items = []
    for (var i = 0; i < records.length; i++) {
      items.push(records[i].publicExport())
    }
    return e.json(200, { items: items, page: page, perPage: perPage, totalItems: items.length })
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("rooms list: " + msg) } catch (_) {}
    return e.json(500, { error: "list_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// GET /api/rooms/{id}
routerAdd("GET", "/api/rooms/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("rooms", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "get_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// POST /api/rooms  body 字段: specimen_id, title, roman_num, specimen_svg, theme_color, route_target
routerAdd("POST", "/api/rooms", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("rooms") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "rooms",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'specimen_id', type: 'text', required: true, max: 50 },
          { name: 'title', type: 'text', required: true, max: 100 },
          { name: 'roman_num', type: 'text', max: 10 },
          { name: 'specimen_svg', type: 'text' },
          { name: 'theme_color', type: 'text', max: 20 },
          { name: 'route_target', type: 'text', max: 50 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("rooms")
  }
  try {
    var coll = ensureCollLocal()
    var body = e.requestInfo().body || {}
    var rec = new Record(coll)
    rec.set("specimen_id", body.specimen_id === undefined || body.specimen_id === null ? "" : String(body.specimen_id))
    rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    rec.set("roman_num", body.roman_num === undefined || body.roman_num === null ? "" : String(body.roman_num))
    rec.set("specimen_svg", body.specimen_svg === undefined || body.specimen_svg === null ? "" : String(body.specimen_svg))
    rec.set("theme_color", body.theme_color === undefined || body.theme_color === null ? "" : String(body.theme_color))
    rec.set("route_target", body.route_target === undefined || body.route_target === null ? "" : String(body.route_target))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("rooms create: " + msg) } catch (_) {}
    return e.json(500, { error: "create_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// PATCH /api/rooms/{id}  body 字段同 POST, 只更新 body 里出现的字段
routerAdd("PATCH", "/api/rooms/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("rooms", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    var body = e.requestInfo().body || {}
    if ("specimen_id" in body) rec.set("specimen_id", body.specimen_id === undefined || body.specimen_id === null ? "" : String(body.specimen_id))
    if ("title" in body) rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    if ("roman_num" in body) rec.set("roman_num", body.roman_num === undefined || body.roman_num === null ? "" : String(body.roman_num))
    if ("specimen_svg" in body) rec.set("specimen_svg", body.specimen_svg === undefined || body.specimen_svg === null ? "" : String(body.specimen_svg))
    if ("theme_color" in body) rec.set("theme_color", body.theme_color === undefined || body.theme_color === null ? "" : String(body.theme_color))
    if ("route_target" in body) rec.set("route_target", body.route_target === undefined || body.route_target === null ? "" : String(body.route_target))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "update_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// DELETE /api/rooms/{id}
routerAdd("DELETE", "/api/rooms/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("rooms", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    $app.delete(rec)
    return e.json(200, { ok: true })
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "delete_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
