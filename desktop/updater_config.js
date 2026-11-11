// ============================================================================
// GELCONTROL — CONFIGURAÇÃO CENTRAL DE DISTRIBUIÇÃO E ATUALIZAÇÕES
// Define chaves públicas oficiais, URLs de manifestos e origens permitidas
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Chave Pública Oficial de Homologação (Ed25519)
 * Usada pelo GelControl para validar a assinatura dos manifestos de homologação.
 * A chave privada NUNCA é incluída no aplicativo.
 */
const HOMOLOGACAO_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAmkjedd3X8TziGiy5J4SujNg/UAdopsJl8C25FeHqz2o=
-----END PUBLIC KEY-----`;

/**
 * Chave Pública Oficial de Produção (Ed25519)
 * Usada pelo GelControl para validar a assinatura dos manifestos de produção.
 */
const PRODUCAO_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAoZerTtvOCXmxChGKmG451bISOobZg2/AygX+vtqz9ZQ=
-----END PUBLIC KEY-----`;

/**
 * Endereço HTTPS Oficial Permanente de Homologação (GitHub Releases)
 */
const PERMANENT_HOMOLOGACAO_MANIFEST_URL = 'https://github.com/GelodoVale/gelodovale-app/releases/download/homologacao-latest/manifest_homologacao.json';

/**
 * Endereço HTTPS Oficial Permanente de Produção (GitHub Releases)
 */
const PERMANENT_PRODUCAO_MANIFEST_URL = 'https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/manifest_producao.json';

/**
 * Endereços Ativos dos Manifestos por Canal
 * Ambos os canais ativados com seus respectivos endpoints isolados.
 */
const ACTIVE_MANIFEST_URLS = {
    homologacao: PERMANENT_HOMOLOGACAO_MANIFEST_URL,
    producao: PERMANENT_PRODUCAO_MANIFEST_URL
};

/**
 * Origens HTTPS Confiáveis para Manifestos e Downloads de Pacotes
 * Inclui os domínios oficiais do GitHub (Releases, CDN e Pages)
 */
const ALLOWED_ORIGINS = [
    'https://github.com',
    'https://objects.githubusercontent.com',
    'https://release-assets.githubusercontent.com',
    'https://raw.githubusercontent.com',
    'https://gelodovale.github.io'
];

/**
 * Retorna a configuração do atualizador para o canal especificado
 */
function getUpdaterConfig(channel = 'homologacao', options = {}) {
    const isHomologation = (channel === 'homologacao');

    const manifestUrl = options.manifestUrl !== undefined
        ? options.manifestUrl
        : ACTIVE_MANIFEST_URLS[channel];

    return {
        channel: channel,
        activePublicKey: isHomologation ? HOMOLOGACAO_PUBLIC_KEY_PEM : PRODUCAO_PUBLIC_KEY_PEM,
        manifestUrl: manifestUrl,
        allowedOrigins: ALLOWED_ORIGINS,
        permanentHomologacaoUrl: PERMANENT_HOMOLOGACAO_MANIFEST_URL,
        trustedPublicKeys: {
            homologacao: HOMOLOGACAO_PUBLIC_KEY_PEM,
            producao: PRODUCAO_PUBLIC_KEY_PEM
        },
        manifestUrls: {
            homologacao: channel === 'homologacao' ? manifestUrl : null,
            producao: channel === 'producao' ? manifestUrl : null
        }
    };
}

module.exports = {
    HOMOLOGACAO_PUBLIC_KEY_PEM,
    PRODUCAO_PUBLIC_KEY_PEM,
    PERMANENT_HOMOLOGACAO_MANIFEST_URL,
    PERMANENT_PRODUCAO_MANIFEST_URL,
    ACTIVE_MANIFEST_URLS,
    ALLOWED_ORIGINS,
    getUpdaterConfig
};
