export type CartLine = {
    id: number;
    product_id: number;
    variant_id: number | null;
    name: string;
    slug: string;
    sku: string;
    options?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    image?: string | null;
    stock: number;
};

export type CartTotals = {
    subtotal: number;
    discount: number;
    delivery_fee: number;
    packing_fee: number;
    vat_amount: number;
    total: number;
    item_count: number;
    coupon_code?: string | null;
    same_day?: boolean;
    free_delivery_threshold?: number;
};

export type CartPayload = {
    id: number | null;
    items: CartLine[];
    totals: CartTotals;
};
