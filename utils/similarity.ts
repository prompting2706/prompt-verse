export function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const bigrams = (str: string) => {
        const bg = new Set<string>();
        for (let i = 0; i < str.length - 1; i++) {
            bg.add(str.substring(i, i + 2));
        }
        return bg;
    }

    const set1 = bigrams(s1);
    const set2 = bigrams(s2);
    
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersectionSize = 0;
    set1.forEach(x => {
        if (set2.has(x)) intersectionSize++;
    });

    const unionSize = set1.size + set2.size - intersectionSize;

    if (unionSize === 0) return 0;
    return (intersectionSize / unionSize) * 100;
}
