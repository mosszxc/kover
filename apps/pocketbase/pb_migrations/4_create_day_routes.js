/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "day_routes",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "day", type: "number", required: true, min: 0, max: 6 },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_day_routes_day ON day_routes (day)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("day_routes")
  app.delete(collection)
})
