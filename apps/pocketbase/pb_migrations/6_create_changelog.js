/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "changelog",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "type", type: "text", required: true, max: 50 },
      { name: "action", type: "text", required: true, max: 50 },
      { name: "description", type: "text", max: 2000 },
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("changelog")
  app.delete(collection)
})
