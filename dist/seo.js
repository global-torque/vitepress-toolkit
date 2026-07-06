const normalizeHeadValue = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
        return value;
    }
    return String(value);
};
export const sanitizeHeadEntries = (head) => (head
    .filter((entry) => (Array.isArray(entry)
    && typeof entry[0] === 'string'))
    .map(([tag, attrs = {}, innerHTML]) => {
    const attrsSafe = {};
    Object.entries(attrs || {}).forEach(([key, value]) => {
        const normalizedValue = normalizeHeadValue(value);
        if (normalizedValue !== undefined) {
            attrsSafe[key] = normalizedValue;
        }
    });
    const normalizedInnerHTML = normalizeHeadValue(innerHTML);
    return normalizedInnerHTML === undefined
        ? [tag, attrsSafe]
        : [tag, attrsSafe, String(normalizedInnerHTML)];
}));
const toAbsoluteUrl = (url, frontendUrl) => {
    if (!url) {
        return undefined;
    }
    if (url.startsWith('http')) {
        return url;
    }
    return `${frontendUrl ?? ''}${url}`;
};
const getFrontmatterImage = (frontmatter) => frontmatter.image;
const createOgAttrs = (attribute, name, content) => ({
    [attribute]: name,
    content: content ?? '',
});
const resolveRobotIndex = (value) => {
    if (value === undefined || value === null || value === '') {
        return true;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'index', 'allow'].includes(normalized)) {
        return true;
    }
    if (['false', '0', 'no', 'noindex', 'deny'].includes(normalized)) {
        return false;
    }
    return Boolean(normalized);
};
export function createTransformPageData({ env, normalizeFrontmatter, stripHtmlAndMarkdown, generateJsonLd, beforeNormalize, resolveDescription = (pageData, seoEnv) => {
    const description = pageData.frontmatter.description
        || pageData.description
        || pageData.frontmatter.summary
        || seoEnv.description;
    if (description) {
        return String(description);
    }
    return [pageData.frontmatter.title || pageData.title, seoEnv.title]
        .filter(Boolean)
        .join(' ');
}, defaultImage = '/images/sharing.png', includeMetaTitle = false, includeTwitterDescription = true, includeSiteName = false, jsonLdMode = 'when-present', ogAttribute = 'name', sanitizeHead = false, }) {
    return (pageData) => {
        beforeNormalize?.(pageData);
        pageData.frontmatter.head ??= [];
        pageData.frontmatter.url = `/${pageData.relativePath.replace('.md', '')}`;
        if (pageData.frontmatter.slug === undefined) {
            pageData.frontmatter.slug = pageData.frontmatter.url.split('/').pop();
        }
        const titleFormatted = stripHtmlAndMarkdown(String(pageData.title));
        if (includeMetaTitle) {
            pageData.frontmatter.head.push(['meta', { name: 'title', content: titleFormatted }]);
        }
        pageData.frontmatter.head.push(['meta', createOgAttrs(ogAttribute, 'og:title', titleFormatted)]);
        pageData.frontmatter.head.push(['meta', { name: 'twitter:title', content: titleFormatted }]);
        normalizeFrontmatter(pageData);
        const seoDescription = stripHtmlAndMarkdown(resolveDescription(pageData, env));
        const canonicalUrl = `${env.FRONTEND_URL ?? ''}${pageData.frontmatter.url}`;
        const imageCandidate = getFrontmatterImage(pageData.frontmatter) || defaultImage;
        const canonicalImage = toAbsoluteUrl(imageCandidate, env.FRONTEND_URL);
        pageData.frontmatter.head.push(['meta', createOgAttrs(ogAttribute, 'og:image', canonicalImage)]);
        pageData.frontmatter.head.push(['meta', { name: 'twitter:image', content: canonicalImage ?? '' }]);
        pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }]);
        pageData.frontmatter.head.push(['meta', createOgAttrs(ogAttribute, 'og:url', canonicalUrl)]);
        pageData.frontmatter.head.push(['meta', { name: 'twitter:url', content: canonicalUrl }]);
        pageData.description = seoDescription;
        pageData.frontmatter.head.push(['meta', { name: 'description', content: seoDescription }]);
        pageData.frontmatter.head.push(['meta', createOgAttrs(ogAttribute, 'og:description', seoDescription)]);
        if (includeTwitterDescription) {
            pageData.frontmatter.head.push(['meta', { name: 'twitter:description', content: seoDescription }]);
        }
        const author = pageData.frontmatter.author || env.author;
        pageData.frontmatter.head.push([
            'meta',
            { name: 'author', content: Array.isArray(author) ? author.join(', ') : String(author ?? '') },
        ]);
        pageData.frontmatter.head.push([
            'meta',
            { name: 'robots', content: resolveRobotIndex(env.robotIndex) ? 'index, follow' : 'noindex, nofollow' },
        ]);
        const keywords = pageData.frontmatter.keywords || pageData.frontmatter.tags || env.keywords;
        const keywordsResult = Array.isArray(keywords) ? keywords.join(', ') : String(keywords ?? '');
        pageData.frontmatter.head.push([
            'meta',
            { name: 'keywords', content: stripHtmlAndMarkdown(keywordsResult) },
        ]);
        pageData.frontmatter.head.push([
            'meta',
            createOgAttrs(ogAttribute, 'og:type', pageData.frontmatter.ogType || 'website'),
        ]);
        const jsonLd = generateJsonLd?.(pageData, env);
        if (jsonLdMode === 'always' || jsonLd) {
            pageData.frontmatter.head.push(['script', { type: 'application/ld+json' }, jsonLd ?? '']);
        }
        if (pageData.frontmatter.audio) {
            pageData.frontmatter.head.push([
                'meta',
                createOgAttrs(ogAttribute, 'og:audio', pageData.frontmatter.audio),
            ]);
        }
        if (pageData.frontmatter.video) {
            pageData.frontmatter.head.push([
                'meta',
                createOgAttrs(ogAttribute, 'og:video', pageData.frontmatter.video),
            ]);
        }
        if (pageData.frontmatter.jsonLDType === 'BlogPosting') {
            if (pageData.frontmatter.lastmod) {
                pageData.frontmatter.head.push([
                    'meta',
                    createOgAttrs(ogAttribute, 'article:modified_time', pageData.frontmatter.lastmod),
                ]);
            }
            pageData.frontmatter.head.push([
                'meta',
                createOgAttrs(ogAttribute, 'article:published_time', pageData.frontmatter.publishDate),
            ]);
        }
        pageData.frontmatter.head.push([
            'meta',
            createOgAttrs(ogAttribute, 'og:locale', pageData.frontmatter.locale || env.locale || ''),
        ]);
        if (includeSiteName) {
            pageData.frontmatter.head.push(['meta', { name: 'site_name', content: env.author || '' }]);
        }
        if (sanitizeHead) {
            pageData.frontmatter.head = sanitizeHeadEntries(pageData.frontmatter.head);
        }
    };
}
//# sourceMappingURL=seo.js.map