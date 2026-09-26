import { Hono } from "hono";

import { products } from "../data/store";

const productsRoute =
new Hono();

productsRoute.get(
"/",
(c) => {
const activeProducts =
products.filter(
(product) =>
product.active === 1
);

return c.json({
  success: true,
  data: activeProducts,
});

}
);

productsRoute.get(
"/all",
(c) => {
return c.json({
success: true,
data: [
...products,
].reverse(),
});
}
);

productsRoute.get(
"/:id",
(c) => {
const id =
c.req.param("id");

const product =
  products.find(
    (item) =>
      item.id === id &&
      item.active === 1
  );

if (!product) {
  return c.json(
    {
      success: false,
      error:
        "Product not found.",
    },
    404
  );
}

return c.json({
  success: true,
  data: product,
});

}
);

productsRoute.get(
"/slug/:slug",
(c) => {
const slug =
c.req.param("slug");

const product =
  products.find(
    (item) =>
      item.slug === slug &&
      item.active === 1
  );

if (!product) {
  return c.json(
    {
      success: false,
      error:
        "Product not found.",
    },
    404
  );
}

return c.json({
  success: true,
  data: product,
});

}
);

export default productsRoute;
