/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "clients",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "name", type: "text", required: true, max: 300 },
      { name: "originalName", type: "text", max: 500 },
      { name: "address", type: "text", max: 500 },
      { name: "mats", type: "json" },
      { name: "frequency", type: "number", min: 1, max: 7 },
      { name: "days", type: "json" },
      { name: "dayReplacements", type: "json" },
      { name: "notes", type: "text", max: 2000 },
      { name: "isActive", type: "bool" },
      { name: "lat", type: "number" },
      { name: "lng", type: "number" },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("clients")
  app.delete(collection)
})
