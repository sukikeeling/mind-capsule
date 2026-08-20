/// <reference path="../pb_data/types.d.ts" />
// pb_hooks/memories.pb.js — 业务 collection + REST CRUD 路由 (self-contained)
//
// 由 mcp__rh-pb-hooks__install_business_collection 装. 不要直接 Read+Write 这个文件.
// 业务字段: bucket_id:text, title:text, content:text, weight:number, tag:text
// 路由: list,get,create,update,delete
// list filter 字段: (none)
// list 默认排序: -created

onBootstrap(function (e) {
  e.next()
  try {
    var existing = null
    try { existing = $app.findCollectionByNameOrId("memories") } catch (_) { existing = null }
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
      addField({ name: 'bucket_id', type: 'text', max: 50 })
      addField({ name: 'title', type: 'text', max: 100 })
      addField({ name: 'content', type: 'text' })
      addField({ name: 'weight', type: 'number' })
      addField({ name: 'tag', type: 'text', max: 50 })
      addField({ name: "created", type: "autodate", onCreate: true })
      addField({ name: "updated", type: "autodate", onCreate: true, onUpdate: true })
      if (changed) {
        $app.save(existing)
        try { $app.logger().info("memories collection upgraded") } catch (_) {}
      }
    } else {
      var col = new Collection({
        type: "base",
        name: "memories",
        listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
        fields: [
          { name: 'bucket_id', type: 'text', max: 50 },
          { name: 'title', type: 'text', max: 100 },
          { name: 'content', type: 'text' },
          { name: 'weight', type: 'number' },
          { name: 'tag', type: 'text', max: 50 },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      })
      $app.save(col)
      try { $app.logger().info("memories collection created") } catch (_) {}
    }
  } catch (err) {
    try { $app.logger().error("memories bootstrap: " + String(err && err.message || err)) } catch (_) {}
  }
})

// GET /api/memories?page=1&perPage=50&sort=-created
routerAdd("GET", "/api/memories", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("memories") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "memories",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'bucket_id', type: 'text', max: 50 },
          { name: 'title', type: 'text', max: 100 },
          { name: 'content', type: 'text' },
          { name: 'weight', type: 'number' },
          { name: 'tag', type: 'text', max: 50 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("memories")
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
      ? $app.findRecordsByFilter("memories", filter, sort, perPage, (page - 1) * perPage, params)
      : $app.findRecordsByFilter("memories", "", sort, perPage, (page - 1) * perPage)
    var items = []
    for (var i = 0; i < records.length; i++) {
      items.push(records[i].publicExport())
    }
    return e.json(200, { items: items, page: page, perPage: perPage, totalItems: items.length })
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("memories list: " + msg) } catch (_) {}
    return e.json(500, { error: "list_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// GET /api/memories/{id}
routerAdd("GET", "/api/memories/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("memories", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "get_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// POST /api/memories  body 字段: bucket_id, title, content, weight, tag
routerAdd("POST", "/api/memories", function (e) {
  function ensureCollLocal() {
    try { return $app.findCollectionByNameOrId("memories") } catch (_) {}
    var col = new Collection({
      type: "base",
      name: "memories",
      listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
      fields: [
          { name: 'bucket_id', type: 'text', max: 50 },
          { name: 'title', type: 'text', max: 100 },
          { name: 'content', type: 'text' },
          { name: 'weight', type: 'number' },
          { name: 'tag', type: 'text', max: 50 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    })
    $app.save(col)
    return $app.findCollectionByNameOrId("memories")
  }
  try {
    var coll = ensureCollLocal()
    var body = e.requestInfo().body || {}
    var rec = new Record(coll)
    rec.set("bucket_id", body.bucket_id === undefined || body.bucket_id === null ? "" : String(body.bucket_id))
    rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    rec.set("content", body.content === undefined || body.content === null ? "" : String(body.content))
    rec.set("weight", (body.weight === undefined || body.weight === null) ? 0 : Number(body.weight))
    rec.set("tag", body.tag === undefined || body.tag === null ? "" : String(body.tag))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    try { $app.logger().error("memories create: " + msg) } catch (_) {}
    return e.json(500, { error: "create_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// PATCH /api/memories/{id}  body 字段同 POST, 只更新 body 里出现的字段
routerAdd("PATCH", "/api/memories/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("memories", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    var body = e.requestInfo().body || {}
    if ("bucket_id" in body) rec.set("bucket_id", body.bucket_id === undefined || body.bucket_id === null ? "" : String(body.bucket_id))
    if ("title" in body) rec.set("title", body.title === undefined || body.title === null ? "" : String(body.title))
    if ("content" in body) rec.set("content", body.content === undefined || body.content === null ? "" : String(body.content))
    if ("weight" in body) rec.set("weight", (body.weight === undefined || body.weight === null) ? 0 : Number(body.weight))
    if ("tag" in body) rec.set("tag", body.tag === undefined || body.tag === null ? "" : String(body.tag))
    $app.save(rec)
    return e.json(200, rec.publicExport())
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "update_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
// DELETE /api/memories/{id}
routerAdd("DELETE", "/api/memories/{id}", function (e) {
  try {
    var id = e.request.pathValue("id")
    if (!id) return e.json(400, { error: "id_required" })
    var rec = null
    try { rec = $app.findRecordById("memories", id) } catch (_) { rec = null }
    if (!rec) return e.json(404, { error: "not_found" })
    $app.delete(rec)
    return e.json(200, { ok: true })
  } catch (err) {
    var msg = String(err && err.message || err)
    return e.json(500, { error: "delete_failed", message: msg, fingerprint: msg.substring(0, 80) })
  }
})
