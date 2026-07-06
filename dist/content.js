import { legacyCoverNormalizeFrontmatterOptions, normalizeFrontmatter, } from '@global-torque/content-toolkit/pageData';
export { legacyCoverNormalizeFrontmatterOptions, };
export function normalizeVitePressFrontmatter(page, options = legacyCoverNormalizeFrontmatterOptions) {
    return normalizeFrontmatter(page, options);
}
export function createVitePressFrontmatterRecord(page, options = legacyCoverNormalizeFrontmatterOptions) {
    return {
        ...normalizeVitePressFrontmatter(page, options),
    };
}
//# sourceMappingURL=content.js.map