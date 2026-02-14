/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "drivers",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "name", type: "text", required: true, max: 200 },
      { name: "phone", type: "text", max: 50 },
      { name: "isActive", type: "bool" },
      { name: "workDays", type: "json" },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("drivers")
  app.delete(collection)
})
