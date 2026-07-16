/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true, // ルーティングを out/page/index.html 形式に統一(静的配信と相性が良い)
};

module.exports = nextConfig;