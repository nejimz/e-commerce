type PackingSlipItem = {
    id: number;
    product_name_snapshot: string;
    options_snapshot?: string | null;
    sku_snapshot?: string | null;
    quantity: number;
};

type PackingSlipOrder = {
    order_number: string;
    shipping_recipient?: string | null;
    shipping_line1?: string | null;
    shipping_city?: string | null;
    shipping_province?: string | null;
    shipping_postal_code?: string | null;
    shipping_country_code?: string | null;
    shipping_phone?: string | null;
    hide_prices?: boolean;
    items: PackingSlipItem[];
};

export default function PackingSlip({ order }: { order: PackingSlipOrder }) {
    return (
        <div className="mx-auto max-w-2xl bg-white p-8 text-black print:max-w-none">
            <h1 className="text-2xl font-semibold">Packing slip</h1>
            <p className="mt-1">{order.order_number}</p>
            <p className="mt-4">
                {order.shipping_recipient}
                <br />
                {order.shipping_line1}
                <br />
                {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
                {order.shipping_country_code ? (
                    <>
                        <br />
                        {order.shipping_country_code}
                    </>
                ) : null}
                <br />
                {order.shipping_phone}
            </p>
            <table className="mt-6 w-full text-left text-sm">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Qty</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((i) => (
                        <tr key={i.id}>
                            <td>
                                {i.product_name_snapshot} {i.options_snapshot}
                            </td>
                            <td>{i.sku_snapshot}</td>
                            <td>{i.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {order.hide_prices ? null : <p className="mt-6 hidden">Prices omitted on packing slips.</p>}
            <style>{`@media print { button { display: none } }`}</style>
            <button type="button" className="mt-6 h-11 rounded-md border px-4" onClick={() => window.print()}>
                Print
            </button>
        </div>
    );
}
