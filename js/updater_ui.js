// ============================================================================
// GELCONTROL — INTERFACE VISUAL DO ATUALIZADOR AUTOMÁTICO (ETAPA 3)
// Visualização, Consulta Manual, Acompanhamento de Download e Segurança
// ============================================================================

import { PROGRAM_VERSION, BUILD_NUMBER, BUILD_DATE, DISTRIBUTION_CHANNEL } from './version.js';

let isChecking = false;
let isDownloading = false;
let isInstalling = false;
let cachedUpdateData = null;
let autoCheckScheduled = false;

/**
 * Traduz códigos técnicos de erro para mensagens amigáveis em português
 */
function translateUpdateError(errorCode) {
    if (!errorCode) return 'Erro desconhecido durante a operação.';
    const code = String(errorCode);

    if (code.includes('CANAL_INCOMPATIVEL')) {
        return 'O pacote de atualização encontrado pertence a outro canal e não pode ser instalado neste aplicativo.';
    }
    if (code.includes('DOWNGRADE_REJEITADO')) {
        return 'A versão encontrada no servidor é igual ou anterior à versão já instalada.';
    }
    if (code.includes('SISTEMA_JA_ATUALIZADO')) {
        return 'O GelControl já está na versão mais recente disponível.';
    }
    if (code.includes('VERSAO_MINIMA_INCOMPATIVEL')) {
        return 'Esta atualização requer uma versão base intermediária do GelControl antes de ser aplicada.';
    }
    if (code.includes('ASSINATURA_DIGITAL_INVALIDA')) {
        return 'Falha de segurança: a assinatura digital do pacote não pôde ser autenticada com a chave oficial.';
    }
    if (code.includes('CHAVE_PUBLICA_NAO_CONFIGURADA')) {
        return 'Chave de segurança criptográfica não configurada para este canal de distribuição.';
    }
    if (code.includes('HASH_SHA256_DIVERGENTE')) {
        return 'Falha de integridade: o hash SHA-256 do arquivo baixado não confere com o esperado.';
    }
    if (code.includes('DOWNLOAD_INCOMPLETO')) {
        return 'O arquivo baixado está corrompido ou foi interrompido antes da conclusão.';
    }
    if (code.includes('TIMEOUT_CONEXAO') || code.includes('TIMEOUT_DOWNLOAD')) {
        return 'Tempo limite de resposta do servidor esgotado. Verifique sua conexão com a internet.';
    }
    if (code.includes('ERRO_REDE') || code.includes('ERRO_CONEXAO')) {
        return 'Não foi possível conectar ao servidor de atualizações. Verifique se o computador possui acesso à internet.';
    }
    if (code.includes('ORIGEM_NAO_AUTORIZADA') || code.includes('PROTOCOLO_INSEGURO')) {
        return 'O servidor de destino não possui certificado seguro autorizado (requer HTTPS oficial).';
    }
    if (code.includes('PACOTE_NAO_BAIXADO')) {
        return 'Nenhum pacote validado encontrado na área temporária para download.';
    }
    if (code.includes('EACCES') || code.includes('EPERM') || code.includes('Permission denied')) {
        return 'Permissão negada pelo Windows para manipular pastas temporárias de atualização. Um arquivo pode estar sendo verificado pelo antivírus ou aberto em outra janela. Feche outras instâncias do GelControl e tente novamente.';
    }
    return `Falha no processo de atualização: ${code}`;
}

/**
 * Formata bytes para exibição legível (KB, MB)
 */
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
}

/**
 * Formata data ISO para padrão brasileiro
 */
function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
    } catch (e) {
        return dateStr;
    }
}

/**
 * Verifica se a execução atual é no ambiente Desktop (Electron com IPC)
 */
function isDesktopEnvironment() {
    return !!(window.gelcontrolDesktop && window.gelcontrolDesktop.updater);
}

/**
 * Inicializa a Interface Visual do Atualizador e preenche os dados do sistema
 */
export async function initUpdaterUI() {
    const isDesktop = isDesktopEnvironment();

    // Referências aos elementos do DOM
    const elSysName = document.getElementById('updater-system-name');
    const elInstVer = document.getElementById('updater-installed-version');
    const elBuildInfo = document.getElementById('updater-build-info');
    const elChannel = document.getElementById('updater-channel-label');
    const elStatusBadge = document.getElementById('updater-status-badge');
    const elLastCheck = document.getElementById('updater-last-check');
    const elAvailVer = document.getElementById('updater-available-version-label');
    const elMsgBox = document.getElementById('updater-status-message-box');

    if (!elInstVer) {
        // Elementos ainda não renderizados na página
        return;
    }

    if (isDesktop) {
        try {
            const ver = await window.gelcontrolDesktop.updater.getInstalledVersion();
            const chan = await window.gelcontrolDesktop.updater.getChannel();
            const stat = await window.gelcontrolDesktop.updater.getStatus();

            if (elSysName) elSysName.textContent = 'GelControl Desktop';
            if (elInstVer) elInstVer.textContent = `v${ver.programVersion || PROGRAM_VERSION}`;
            if (elBuildInfo) elBuildInfo.textContent = `Compilação #${ver.buildNumber || BUILD_NUMBER} (${ver.buildDate || BUILD_DATE})`;

            if (elChannel) {
                const isHomolog = (chan.channel === 'homologacao');
                elChannel.innerHTML = `<span class="badge" style="background: ${isHomolog ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${isHomolog ? '#eab308' : '#22c55e'}; border: 1px solid ${isHomolog ? 'rgba(234, 179, 8, 0.4)' : 'rgba(34, 197, 94, 0.4)'}; padding: 2px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">${chan.channel}</span>`;
            }

            if (elStatusBadge) {
                let badgeColor = 'rgba(0, 240, 255, 0.15)';
                let textColor = 'var(--color-primary)';
                let statusLabel = 'Pronto para consulta';

                if (stat.status === 'not-configured') {
                    badgeColor = 'rgba(148, 163, 184, 0.2)';
                    textColor = '#94a3b8';
                    statusLabel = 'Servidor não configurado';
                } else if (stat.status === 'up-to-date') {
                    badgeColor = 'rgba(34, 197, 94, 0.2)';
                    textColor = '#22c55e';
                    statusLabel = 'Sistema Atualizado';
                } else if (stat.status === 'available') {
                    badgeColor = 'rgba(0, 240, 255, 0.2)';
                    textColor = 'var(--color-primary)';
                    statusLabel = 'Atualização disponível';
                }

                elStatusBadge.innerHTML = `<span style="background: ${badgeColor}; color: ${textColor}; padding: 3px 10px; border-radius: 6px; font-weight: 600; font-size: 0.78rem;">${statusLabel}</span>`;
            }

            if (elLastCheck) {
                elLastCheck.textContent = stat.lastCheckedAt ? formatDateBR(stat.lastCheckedAt) : 'Nenhuma verificação recente';
            }

            if (elAvailVer) {
                if (stat.availableVersion) {
                    elAvailVer.innerHTML = `<strong style="color: var(--color-primary); font-size: 0.9rem;">v${stat.availableVersion}</strong> (Disponível)`;
                } else {
                    elAvailVer.textContent = 'Nenhuma (sistema atualizado)';
                }
            }

        } catch (err) {
            console.error('[initUpdaterUI] Erro ao consultar dados via IPC:', err);
        }
    } else {
        // Modo Navegador / PWA
        if (elSysName) elSysName.textContent = 'GelControl Web (PWA)';
        if (elInstVer) elInstVer.textContent = `v${PROGRAM_VERSION}`;
        if (elBuildInfo) elBuildInfo.textContent = `Compilação #${BUILD_NUMBER} (${BUILD_DATE})`;
        if (elChannel) {
            elChannel.innerHTML = `<span class="badge" style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; padding: 2px 8px; border-radius: 4px;">${DISTRIBUTION_CHANNEL}</span>`;
        }
        if (elStatusBadge) {
            elStatusBadge.innerHTML = '<span style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem;">Execução Web (Navegador)</span>';
        }
        if (elLastCheck) elLastCheck.textContent = 'N/A (Navegador)';
        if (elAvailVer) elAvailVer.textContent = 'Gerenciado via Service Worker';

        if (elMsgBox) {
            elMsgBox.style.display = 'block';
            elMsgBox.innerHTML = `
                <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 8px; padding: 12px; font-size: 0.8rem; color: var(--color-text-muted);">
                    ℹ️ As atualizações automáticas de executável (.exe) são exclusivas do <strong>GelControl Desktop</strong>. Na versão web, as melhorias são recebidas automaticamente através do Service Worker e do cache do navegador.
                </div>
            `;
        }
    }

    if (window.lucide) {
        try { window.lucide.createIcons(); } catch (e) { /* ignora */ }
    }

    // Agenda a verificação automática periódica (10s pós-boot e a cada 4 horas)
    scheduleAutoCheckUpdates();
}

/**
 * Agenda a verificação automática periódica (10s após a inicialização e a cada 4 horas)
 */
export function scheduleAutoCheckUpdates() {
    if (autoCheckScheduled || !isDesktopEnvironment()) return;
    autoCheckScheduled = true;

    // Primeira verificação 10 segundos após a inicialização
    setTimeout(() => {
        executePeriodicCheck();
    }, 10000);

    // Nova verificação a cada 4 horas (4 * 60 * 60 * 1000 ms)
    setInterval(() => {
        executePeriodicCheck();
    }, 4 * 60 * 60 * 1000);
}

/**
 * Executa verificação silenciosa e não invasiva em segundo plano
 */
export async function executePeriodicCheck() {
    if (isChecking || isDownloading || isInstalling || !isDesktopEnvironment()) return;

    try {
        console.log('[AutoUpdater] Executando verificação automática em segundo plano...');
        const result = await window.gelcontrolDesktop.updater.checkUpdate();
        const now = new Date().toISOString();

        const elLastCheck = document.getElementById('updater-last-check');
        if (elLastCheck) elLastCheck.textContent = formatDateBR(now);

        if (result && (result.status === 'available' || result.hasUpdate === true)) {
            cachedUpdateData = result;

            const elAvailVer = document.getElementById('updater-available-version-label');
            const elStatusBadge = document.getElementById('updater-status-badge');
            if (elAvailVer) {
                elAvailVer.innerHTML = `<strong style="color: var(--color-primary); font-size: 0.9rem;">v${result.availableVersion}</strong> (Disponível)`;
            }
            if (elStatusBadge) {
                elStatusBadge.innerHTML = '<span style="background: rgba(0, 240, 255, 0.2); color: var(--color-primary); padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">Nova Versão Disponível</span>';
            }

            // Exibe aviso discreto não invasivo
            if (window.showToast) {
                window.showToast(`Nova versão do GelControl disponível (v${result.availableVersion}). Acesse Atualizações do Sistema para revisar as novidades.`, 'info', 8000);
            }
        }
        // Se not-configured, up-to-date ou erro temporário de rede: silêncio absoluto (sem alarmar o operador)
    } catch (err) {
        console.warn('[AutoUpdater] Verificação automática em segundo plano falhou silenciosamente:', err);
    }
}

/**
 * Consulta manual de atualizações disparada pelo usuário
 */
export async function checkAppUpdates() {
    if (isChecking) return;

    const btnCheck = document.getElementById('btn-check-updates');
    const elMsgBox = document.getElementById('updater-status-message-box');
    const elStatusBadge = document.getElementById('updater-status-badge');
    const elLastCheck = document.getElementById('updater-last-check');
    const elAvailVer = document.getElementById('updater-available-version-label');

    if (!isDesktopEnvironment()) {
        if (window.showToast) {
            window.showToast('Atualizações de executável disponíveis apenas no GelControl Desktop.', 'info');
        } else {
            alert('Atualizações de executável estão disponíveis apenas no aplicativo GelControl Desktop.');
        }
        return;
    }

    // Trava de interface contra múltiplos cliques simultâneos
    isChecking = true;
    if (btnCheck) {
        btnCheck.disabled = true;
        btnCheck.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span> Verificando no servidor...';
    }

    if (elStatusBadge) {
        elStatusBadge.innerHTML = '<span style="background: rgba(0, 240, 255, 0.2); color: var(--color-primary); padding: 3px 10px; border-radius: 6px; font-size: 0.78rem;">Verificando...</span>';
    }

    try {
        const result = await window.gelcontrolDesktop.updater.checkUpdate();
        const now = new Date().toISOString();
        if (elLastCheck) elLastCheck.textContent = formatDateBR(now);

        if (!elMsgBox) return;

        elMsgBox.style.display = 'block';

        if (result.status === 'not-configured') {
            // Servidor não configurado
            elMsgBox.innerHTML = `
                <div style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 10px;">
                    <i data-lucide="info" style="color: #94a3b8; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">Servidor de atualizações não configurado</strong>
                        O servidor de publicação para o canal <strong>${result.channel || 'homologacao'}</strong> ainda não foi ativado nesta etapa. Nenhuma alteração foi realizada no sistema.
                    </div>
                </div>
            `;
            if (elStatusBadge) {
                elStatusBadge.innerHTML = '<span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem;">Servidor não configurado</span>';
            }
            if (elAvailVer) elAvailVer.textContent = 'Servidor inativo';

        } else if (result.status === 'up-to-date' || result.hasUpdate === false) {
            // Sistema já atualizado
            elMsgBox.innerHTML = `
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #86efac; display: flex; align-items: flex-start; gap: 10px;">
                    <i data-lucide="check-circle" style="color: #22c55e; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">O GelControl está atualizado!</strong>
                        A versão instalada (<strong>v${result.currentVersion || PROGRAM_VERSION}</strong>) é a mais recente disponível no canal <strong>${result.channel || 'homologacao'}</strong>.
                    </div>
                </div>
            `;
            if (elStatusBadge) {
                elStatusBadge.innerHTML = '<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">Atualizado</span>';
            }
            if (elAvailVer) elAvailVer.textContent = 'Nenhuma (sistema atualizado)';

        } else if (result.status === 'available' || result.hasUpdate === true) {
            // Nova atualização disponível!
            cachedUpdateData = result;
            elMsgBox.innerHTML = `
                <div style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #e0f2fe; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <i data-lucide="arrow-up-circle" style="color: var(--color-primary); width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
                        <div>
                            <strong style="color: #fff; display: block; font-size: 0.9rem; margin-bottom: 2px;">Nova versão disponível: v${result.availableVersion}!</strong>
                            Uma nova versão oficial foi publicada no canal <strong>${result.channel}</strong> (${formatBytes(result.packageSize)}).
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" onclick="window.openUpdaterModal()" style="font-size: 0.8rem; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> Ver Detalhes da Atualização
                    </button>
                </div>
            `;
            if (elStatusBadge) {
                elStatusBadge.innerHTML = '<span style="background: rgba(0, 240, 255, 0.2); color: var(--color-primary); padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">Nova Versão Disponível</span>';
            }
            if (elAvailVer) {
                elAvailVer.innerHTML = `<strong style="color: var(--color-primary); font-size: 0.9rem;">v${result.availableVersion}</strong> (Publicada em ${result.buildDate || '-'})`;
            }

            // Abre modal de detalhes da nova versão
            openUpdaterModal(result);

        } else {
            // Falha / Erro
            const errorMsg = translateUpdateError(result.error);
            elMsgBox.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #fca5a5; display: flex; align-items: flex-start; gap: 10px;">
                    <i data-lucide="alert-triangle" style="color: #ef4444; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">Não foi possível verificar atualizações</strong>
                        ${errorMsg}
                    </div>
                </div>
            `;
            if (elStatusBadge) {
                elStatusBadge.innerHTML = '<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 3px 10px; border-radius: 6px; font-size: 0.78rem;">Falha na verificação</span>';
            }
        }

    } catch (err) {
        console.error('[checkAppUpdates] Erro durante verificação:', err);
        if (elMsgBox) {
            elMsgBox.style.display = 'block';
            elMsgBox.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #fca5a5; display: flex; align-items: flex-start; gap: 10px;">
                    <i data-lucide="alert-triangle" style="color: #ef4444; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">Erro de comunicação</strong>
                        ${translateUpdateError(err.message)}
                    </div>
                </div>
            `;
        }
    } finally {
        isChecking = false;
        if (btnCheck) {
            btnCheck.disabled = false;
            btnCheck.innerHTML = '<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Verificar Atualizações';
        }
        if (window.lucide) {
            try { window.lucide.createIcons(); } catch (e) { /* ignora */ }
        }
    }
}

/**
 * Abre o Modal com todos os detalhes da atualização disponível
 */
export async function openUpdaterModal(data) {
    const updateData = data || cachedUpdateData;
    if (!updateData) {
        if (isDesktopEnvironment()) {
            const cached = await window.gelcontrolDesktop.updater.getAvailableUpdate();
            if (cached) {
                cachedUpdateData = {
                    hasUpdate: true,
                    status: 'available',
                    currentVersion: PROGRAM_VERSION,
                    availableVersion: cached.latestVersion,
                    buildDate: cached.buildDate,
                    channel: cached.channel,
                    releaseNotes: cached.releaseNotes,
                    packageSize: cached.packageSize,
                    sha256: cached.sha256
                };
                return openUpdaterModal(cachedUpdateData);
            }
        }
        if (window.showToast) window.showToast('Nenhuma atualização disponível para exibição.', 'info');
        return;
    }

    // Preenche dados do modal
    const elCurVer = document.getElementById('modal-updater-current-ver');
    const elTargetVer = document.getElementById('modal-updater-target-ver');
    const elReleaseDate = document.getElementById('modal-updater-release-date');
    const elChannel = document.getElementById('modal-updater-channel');
    const elSize = document.getElementById('modal-updater-package-size');
    const elNotes = document.getElementById('modal-updater-release-notes');
    const elSha = document.getElementById('modal-updater-sha256');
    const elSecStatus = document.getElementById('modal-updater-security-status');
    const elProgBox = document.getElementById('updater-download-progress-container');
    const elResultBox = document.getElementById('updater-download-result-box');
    const btnDownload = document.getElementById('btn-download-update');

    if (elCurVer) elCurVer.textContent = `v${updateData.currentVersion || PROGRAM_VERSION}`;
    if (elTargetVer) elTargetVer.textContent = `v${updateData.availableVersion || '?'}`;
    if (elReleaseDate) elReleaseDate.textContent = updateData.buildDate || '-';
    if (elChannel) elChannel.textContent = updateData.channel || 'homologacao';
    if (elSize) elSize.textContent = formatBytes(updateData.packageSize);
    if (elSha) elSha.textContent = updateData.sha256 || '-';

    if (elSecStatus) {
        elSecStatus.innerHTML = `
            <span style="color: #22c55e; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i> Assinatura Ed25519 e manifesto validados com a chave oficial
            </span>
        `;
    }

    if (elNotes) {
        const notes = Array.isArray(updateData.releaseNotes) ? updateData.releaseNotes : [updateData.releaseNotes || 'Melhorias de desempenho e segurança.'];
        elNotes.innerHTML = notes.map(n => `<li style="margin-bottom: 6px; line-height: 1.4;">${n}</li>`).join('');
    }

    // Reseta caixas de download no modal
    if (elProgBox) elProgBox.style.display = 'none';
    if (elResultBox) elResultBox.style.display = 'none';
    if (btnDownload) {
        btnDownload.disabled = false;
        btnDownload.innerHTML = '<i data-lucide="download" style="width: 14px; height: 14px;"></i> Baixar Atualização Segura';
    }

    // Abre o modal
    if (window.openModal) {
        window.openModal('modal-updater-details');
    } else {
        const m = document.getElementById('modal-updater-details');
        if (m) m.classList.add('active');
    }

    if (window.lucide) {
        try { window.lucide.createIcons(); } catch (e) { /* ignora */ }
    }
}

/**
 * Fecha o Modal de Atualização
 */
export function closeUpdaterModal() {
    if (window.closeModal) {
        window.closeModal('modal-updater-details');
    } else {
        const m = document.getElementById('modal-updater-details');
        if (m) m.classList.remove('active');
    }
}

/**
 * Baixa o pacote para a pasta temporária isolada com validação de hash e tamanho
 */
export async function downloadAppUpdate() {
    if (isDownloading) return;

    const btnDownload = document.getElementById('btn-download-update');
    const elProgBox = document.getElementById('updater-download-progress-container');
    const elProgBar = document.getElementById('updater-download-progress-bar');
    const elProgText = document.getElementById('updater-download-progress-text');
    const elResultBox = document.getElementById('updater-download-result-box');

    if (!isDesktopEnvironment()) {
        alert('O download de pacotes é exclusivo do aplicativo Desktop.');
        return;
    }

    isDownloading = true;
    if (btnDownload) {
        btnDownload.disabled = true;
        btnDownload.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span> Baixando Pacote Seguro...';
    }

    if (elProgBox) elProgBox.style.display = 'block';
    if (elProgBar) {
        elProgBar.style.width = '35%';
        elProgBar.style.backgroundColor = 'var(--color-primary)';
    }
    if (elProgText) elProgText.textContent = 'Baixando pacote criptografado do servidor seguro...';
    if (elResultBox) elResultBox.style.display = 'none';

    try {
        const res = await window.gelcontrolDesktop.updater.downloadUpdate();

        if (res.success) {
            if (elProgBar) {
                elProgBar.style.width = '100%';
                elProgBar.style.backgroundColor = '#22c55e';
            }
            if (elProgText) {
                elProgText.innerHTML = `<strong>Download concluído com 100% de integridade!</strong> (${formatBytes(res.packageSize)})`;
            }

            if (elResultBox) {
                elResultBox.style.display = 'block';
                elResultBox.innerHTML = `
                    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 12px; font-size: 0.8rem; color: #86efac; margin-top: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <i data-lucide="shield-check" style="color: #22c55e; width: 16px; height: 16px;"></i>
                            <strong style="color: #fff;">Pacote Validado e Pronto para Instalação</strong>
                        </div>
                        <p style="margin: 0 0 6px 0; color: var(--color-text-muted); font-size: 0.75rem;">
                            Arquivo armazenado em: <code>Dados\\updates_temp\\</code><br>
                            Hash SHA-256 verificado: <code style="word-break: break-all;">${res.sha256}</code>
                        </p>
                        <div style="background: rgba(34, 197, 94, 0.15); border-left: 3px solid #22c55e; padding: 6px 10px; border-radius: 4px; color: #bbf7d0; font-size: 0.75rem; margin-top: 8px;">
                            ✅ <strong>Pronto para Instalar:</strong> O pacote passou em todas as checagens de integridade e autenticidade. Clique em <strong>"Instalar Atualização"</strong> para aplicar a nova versão com ponto de recuperação automático e reinicialização.
                        </div>
                    </div>
                `;
            }

            // Habilita os botões de instalação na Etapa 4
            const btnMainInstall = document.getElementById('btn-check-and-install-update');
            const btnModalInstall = document.getElementById('modal-btn-install-update');
            if (btnMainInstall) {
                btnMainInstall.disabled = false;
                btnMainInstall.style.opacity = '1';
                btnMainInstall.style.cursor = 'pointer';
                btnMainInstall.title = 'Instalar nova versão e reiniciar o GelControl';
            }
            if (btnModalInstall) {
                btnModalInstall.disabled = false;
                btnModalInstall.style.opacity = '1';
                btnModalInstall.style.cursor = 'pointer';
                btnModalInstall.title = 'Instalar nova versão e reiniciar o GelControl';
            }
        } else {
            // Falha
            if (elProgBar) {
                elProgBar.style.width = '100%';
                elProgBar.style.backgroundColor = '#ef4444';
            }
            if (elProgText) elProgText.textContent = 'Falha no download.';

            if (elResultBox) {
                elResultBox.style.display = 'block';
                elResultBox.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; font-size: 0.8rem; color: #fca5a5; margin-top: 10px;">
                        <strong style="color: #fff; display: block; margin-bottom: 4px;">Falha no download da atualização</strong>
                        ${translateUpdateError(res.error)}
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error('[downloadAppUpdate] Erro durante download:', err);
        if (elProgBar) {
            elProgBar.style.width = '100%';
            elProgBar.style.backgroundColor = '#ef4444';
        }
        if (elResultBox) {
            elResultBox.style.display = 'block';
            elResultBox.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; font-size: 0.8rem; color: #fca5a5; margin-top: 10px;">
                    <strong style="color: #fff; display: block; margin-bottom: 4px;">Erro ao baixar atualização</strong>
                    ${translateUpdateError(err.message)}
                </div>
            `;
        }
    } finally {
        isDownloading = false;
        if (btnDownload) {
            btnDownload.disabled = false;
            btnDownload.innerHTML = '<i data-lucide="download" style="width: 14px; height: 14px;"></i> Baixar Atualização Segura';
        }
        if (window.lucide) {
            try { window.lucide.createIcons(); } catch (e) { /* ignora */ }
        }
    }
}

/**
 * Executa a instalação segura da atualização (Etapa 4): Staging, Ponto de Recuperação e Reinicialização
 */
export async function handleInstallButtonClick() {
    if (isInstalling) return;

    if (!isDesktopEnvironment()) {
        alert('A instalação de atualizações é exclusiva do GelControl Desktop.');
        return;
    }

    try {
        // Validação de segurança no processo principal
        const valStatus = await window.gelcontrolDesktop.updater.getValidationStatus();
        if (!valStatus || !valStatus.hasValidatedPackage) {
            alert('Nenhum pacote validado pronto para instalação. Baixe a atualização primeiro.');
            return;
        }

        // Diálogo de confirmação administrativa
        const targetVer = cachedUpdateData ? cachedUpdateData.availableVersion : 'mais recente';
        const confirmMsg = `Deseja instalar a atualização v${targetVer} agora?\n\nO GelControl salvará o estado, criará um ponto de recuperação automático e reiniciará o aplicativo para aplicar a nova versão.\n\nSeus cadastros, dados comerciais e backups serão 100% preservados.`;

        let proceed = true;
        if (typeof window.confirm === 'function') {
            proceed = window.confirm(confirmMsg);
        }
        if (!proceed) return;

        isInstalling = true;

        const btnMainInstall = document.getElementById('btn-check-and-install-update');
        const btnModalInstall = document.getElementById('modal-btn-install-update');

        if (btnMainInstall) {
            btnMainInstall.disabled = true;
            btnMainInstall.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span> Preparando e Reiniciando...';
        }
        if (btnModalInstall) {
            btnModalInstall.disabled = true;
            btnModalInstall.innerHTML = '<span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span> Preparando e Reiniciando...';
        }

        const elMsgBox = document.getElementById('updater-status-message-box');
        if (elMsgBox) {
            elMsgBox.style.display = 'block';
            elMsgBox.innerHTML = `
                <div style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #e0f2fe; display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="loader-2" class="spin" style="color: var(--color-primary); width: 20px; height: 20px; flex-shrink: 0;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">Iniciando instalação segura...</strong>
                        Criando ponto de recuperação anterior e preparando arquivos. O GelControl será reiniciado em instantes.
                    </div>
                </div>
            `;
            if (window.lucide) {
                try { window.lucide.createIcons(); } catch (e) { /* ignora */ }
            }
        }

        // Coleta de credencial administrativa se houver sessão ativa
        let idToken = null;
        if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
            try {
                idToken = await window.firebase.auth().currentUser.getIdToken(false);
            } catch (eTok) {
                console.warn('[UpdaterUI] Aviso ao ler token da sessão atual:', eTok);
            }
        }

        const res = await window.gelcontrolDesktop.updater.applyUpdate({ idToken: idToken || null });

        if (!res.success) {
            isInstalling = false;
            if (btnMainInstall) {
                btnMainInstall.disabled = false;
                btnMainInstall.innerHTML = '<i data-lucide="download" style="width: 14px; height: 14px;"></i> Instalar Atualização';
            }
            if (btnModalInstall) {
                btnModalInstall.disabled = false;
                btnModalInstall.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Instalar Atualização';
            }
            if (elMsgBox) {
                elMsgBox.style.display = 'block';
                elMsgBox.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #fecaca; display: flex; align-items: flex-start; gap: 10px;">
                        <i data-lucide="alert-triangle" style="color: #ef4444; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
                        <div>
                            <strong style="color: #fff; display: block; margin-bottom: 2px;">Falha ao preparar atualização</strong>
                            ${translateUpdateError(res.error)}
                        </div>
                    </div>
                `;
                if (window.lucide) {
                    try { window.lucide.createIcons(); } catch (_) {}
                }
            }
            alert('Falha ao preparar atualização: ' + translateUpdateError(res.error));
        }

    } catch (err) {
        isInstalling = false;
        if (btnMainInstall) {
            btnMainInstall.disabled = false;
            btnMainInstall.innerHTML = '<i data-lucide="download" style="width: 14px; height: 14px;"></i> Instalar Atualização';
        }
        if (btnModalInstall) {
            btnModalInstall.disabled = false;
            btnModalInstall.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Instalar Atualização';
        }
        if (elMsgBox) {
            elMsgBox.style.display = 'block';
            elMsgBox.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 14px; font-size: 0.82rem; color: #fecaca; display: flex; align-items: flex-start; gap: 10px;">
                    <i data-lucide="alert-triangle" style="color: #ef4444; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="color: #fff; display: block; margin-bottom: 2px;">Erro na instalação</strong>
                        ${err.message}
                    </div>
                </div>
            `;
            if (window.lucide) {
                try { window.lucide.createIcons(); } catch (_) {}
            }
        }
        alert('Erro durante a operação de instalação: ' + err.message);
    }
}

// ============================================================================
// EXPOSIÇÃO GLOBAL PARA EVENTOS ONCLICK DO HTML
// ============================================================================
if (typeof window !== 'undefined') {
    window.initUpdaterUI = initUpdaterUI;
    window.checkAppUpdates = checkAppUpdates;
    window.openUpdaterModal = openUpdaterModal;
    window.closeUpdaterModal = closeUpdaterModal;
    window.downloadAppUpdate = downloadAppUpdate;
    window.handleInstallButtonClick = handleInstallButtonClick;
    window.scheduleAutoCheckUpdates = scheduleAutoCheckUpdates;
    window.executePeriodicCheck = executePeriodicCheck;
}

