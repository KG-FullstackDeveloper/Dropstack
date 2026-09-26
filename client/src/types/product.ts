export interface Product {
id: string;
name: string;
slug: string;
description: string;
category: string;
price: number;
currency: string;

image_url: string | null;
video_url: string | null;

supplier_name: string | null;
supplier_product_id: string | null;

warehouse_country: string | null;
processing_time: string | null;
delivery_time: string | null;

supplier_cost: number;
shipping_cost: number;
other_cost: number;

profit_per_unit: number;
profit_margin: number;

active: number;
created_at: string;
}

export interface CreateProductInput {
name: string;
slug: string;
description: string;
category: string;

price: number;
currency?: string;

image_url?: string;
video_url?: string;

supplier_name?: string;
supplier_product_id?: string;

warehouse_country?: string;
processing_time?: string;
delivery_time?: string;

supplier_cost?: number;
shipping_cost?: number;
other_cost?: number;
}
