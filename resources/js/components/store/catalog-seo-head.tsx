import { Head } from '@inertiajs/react';

export type CatalogSeo = {
    title: string;
    description?: string | null;
    canonical: string;
    robots: string;
    og_image?: string | null;
    og_type?: string | null;
    jsonLd?: object | null;
};

export function CatalogSeoHead({ seo }: { seo: CatalogSeo }) {
    return (
        <Head title={seo.title}>
            {seo.description ? <meta head-key="description" name="description" content={seo.description} /> : null}
            <meta head-key="robots" name="robots" content={seo.robots} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            {seo.description ? <meta head-key="og:description" property="og:description" content={seo.description} /> : null}
            <meta head-key="og:url" property="og:url" content={seo.canonical} />
            <meta head-key="og:type" property="og:type" content={seo.og_type || 'website'} />
            {seo.og_image ? <meta head-key="og:image" property="og:image" content={seo.og_image} /> : null}
            {seo.jsonLd ? <script type="application/ld+json">{JSON.stringify(seo.jsonLd)}</script> : null}
        </Head>
    );
}
