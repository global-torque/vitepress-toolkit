const DEFAULT_FONT_PATTERN = /Avenir[-a-zA-Z0-9.]+\.(woff2|ttf|eot|svg)$/;
export function createFontPreloadTransform({ fontNames, fontPattern, firstOnly = false, } = {}) {
    const resolvedPattern = fontPattern
        ?? (fontNames?.length
            ? new RegExp(`(${fontNames.join('|')})[-a-zA-Z0-9.]+\\.(woff2|ttf|eot|svg)$`)
            : DEFAULT_FONT_PATTERN);
    return ({ assets }) => {
        const matches = assets.filter((file) => resolvedPattern.test(file));
        const selectedAssets = firstOnly ? matches.slice(0, 1) : matches;
        if (!selectedAssets.length) {
            return undefined;
        }
        return selectedAssets.map((fontFile) => {
            const ext = fontFile.split('.').pop();
            return [
                'link',
                {
                    rel: 'preload',
                    href: fontFile,
                    as: 'font',
                    type: `font/${ext}`,
                    crossorigin: '',
                },
            ];
        });
    };
}
//# sourceMappingURL=head.js.map