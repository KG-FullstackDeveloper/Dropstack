import { Hono } from "hono";

import { orders } from "../data/store";

const ordersRoute =
new Hono();

ordersRoute.get(
"/",
(c) => {
return c.json({
success: true,

  data: [
    ...orders,
  ].reverse(),
});

}
);

ordersRoute.get(
"/:id",
(c) => {
const id =
c.req.param("id");

const order =
  orders.find(
    (item) =>
      item.id === id
  );

if (!order) {
  return c.json(
    {
      success: false,
      error:
        "Order not found.",
    },
    404
  );
}

return c.json({
  success: true,
  data: order,
});

}
);

export default ordersRoute;
