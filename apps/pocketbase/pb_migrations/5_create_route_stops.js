/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const dayRoutes = app.findCollectionByNameOrId("day_routes")
  const clients = app.findCollectionByNameOrId("clients")
  const drivers = app.findCollectionByNameOrId("drivers")

  const collection = new Collection({
    type: "base",
    name: "route_stops",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      {
        name: "dayRoute",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: dayRoutes.id,
        cascadeDelete: true,
      },
      {
        name: "client",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: clients.id,
        cascadeDelete: false,
      },
      {
        name: "driver",
        type: "relation",
        maxSelect: 1,
        collectionId: drivers.id,
        cascadeDelete: false,
      },
      { name: "position", type: "number", required: true, min: 0 },
      { name: "isCompleted", type: "bool" },
      { name: "skippedUntil", type: "text", max: 30 },
    ],
    indexes: [
      "CREATE INDEX idx_route_stops_day_route ON route_stops (dayRoute)",
      "CREATE INDEX idx_route_stops_client ON route_stops (client)",
    ],
  })

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("route_stops")
  app.delete(collection)
})
