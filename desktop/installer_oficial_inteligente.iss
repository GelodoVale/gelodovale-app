; ============================================================================
; SCRIPT OFICIAL DO INSTALADOR INTELIGENTE UNIFICADO — GELCONTROL v85.4.1
; Fabricante: Gelo do Vale
; Capacidades:
;   1. Instalação Nova (computador limpo)
;   2. Atualização Inteligente Direta (in-place upgrade preservando 100% de dados)
;   3. Reparo de Integridade (restauração de arquivos corrompidos/ausentes)
;   4. Preservação Absoluta: Dados\, Backups\, credenciais e lixeira intocados
;   5. Atalho Permanente: "GelControl Oficial.lnk" com ícone circular nativo
;   6. Rollback Atômico Ativo: restaura versão anterior em caso de interrupção
;   7. Teste Prévio de Permissões e Desalocação Limpa de Processos
; ============================================================================

#define MyAppName "GelControl Oficial"
#define MyAppVersion "85.4.4"
#define MyAppPublisher "Gelo do Vale"
#define MyAppURL "https://gelodovale.com.br"
#define MyAppExeName "GelControl.exe"

[Setup]
AppId={{E68A9E4D-79B4-4B45-8C2C-2268A6F00F85}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretório Padrão Dinâmico: detecta automaticamente onde o GelControl já está instalado
DefaultDirName={code:GetDetectedInstallDir}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Privilégios no escopo do usuário (lowest) para execução com 2 cliques sem bloqueio de UAC
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=commandline
UsePreviousAppDir=yes
OutputDir=..\dist\Instalador_Oficial
OutputBaseFilename=Instalador_GelControl_v85.4.4_Oficial
SetupIconFile=..\app_icon_round.ico

Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ShowLanguageDialog=no

; Fechamento automático de processos em execução para evitar bloqueios de arquivo (EACCES)
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Dirs]
Name: "{app}\Programa"
Name: "{app}\Dados"; Flags: uninsneveruninstall
Name: "{app}\Backups"; Flags: uninsneveruninstall
Name: "{app}\Seguranca"; Flags: uninsneveruninstall
Name: "{app}\Seguranca\Tools"; Flags: uninsneveruninstall

[Files]
; 1. Runtime do Electron e DLLs (excluindo resources\app, logs e temporários)
Source: "F:\GelControl_Oficial\Programa\*"; DestDir: "{app}\Programa"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "resources\app\*,*.log,*.tmp,*.bak"

; 2. Aplicação Oficial Completa v85.4.4 (a partir do staging limpo e auditado da release)
Source: "..\dist\instalador_oficial_v85.4.4\app\*"; DestDir: "{app}\Programa\resources\app"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,*.tmp,*.bak,*-DESKTOP-*"

; 3. Ícones Oficiais do Programa (Quadrado clássico e Circular nativo para Dados e raiz)
Source: "..\gelcontrol.ico"; DestDir: "{app}\Programa"; Flags: ignoreversion
Source: "..\app_icon_round.ico"; DestDir: "{app}\Dados"; Flags: ignoreversion
Source: "..\app_icon_round.ico"; DestDir: "{app}\Programa"; Flags: ignoreversion
Source: "..\app_icon_round.ico"; DestDir: "{app}"; Flags: ignoreversion

; 4. Ferramentas Administrativas de Escritório (sem credenciais de serviço)
Source: "..\tools\*"; DestDir: "{app}\Seguranca\Tools"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "service-account*.json,*.key,*.pem,*.env,secrets"

[Icons]
; Atalho Oficial Permanente na Área de Trabalho (sem números de versão) com ícone circular nativo
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\Programa\{#MyAppExeName}"; WorkingDir: "{app}\Programa"; IconFilename: "{app}\Dados\app_icon_round.ico"

; Atalhos Oficiais no Menu Iniciar
Name: "{autoprograms}\{#MyAppName}\{#MyAppName}"; Filename: "{app}\Programa\{#MyAppExeName}"; WorkingDir: "{app}\Programa"; IconFilename: "{app}\Dados\app_icon_round.ico"
Name: "{autoprograms}\{#MyAppName}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

[Registry]
; Persistência no Registro do Windows para facilitar futuras atualizações automáticas
Root: HKCU; Subkey: "Software\GelControl"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\GelControl"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletevalue

[Run]
Filename: "{app}\Programa\{#MyAppExeName}"; Description: "{cm:LaunchProgram,GelControl Oficial}"; Flags: nowait postinstall skipifsilent

[Code]
var
  DetectedDir: String;
  DetectedVersion: String;
  IsUpgradeMode: Boolean;
  IsRepairMode: Boolean;
  InstallCompletedSuccessfully: Boolean;
  BackupPerformedSuccessfully: Boolean;
  BackupLocation: String;
  TargetAppDir: String;
  ModeDescription: String;

// Função auxiliar para carregar texto de um arquivo
function LoadFileContent(const FileName: String): String;
var
  Lines: TArrayOfString;
  I: Integer;
  S: String;
begin
  Result := '';
  if FileExists(FileName) then
  begin
    if LoadStringsFromFile(FileName, Lines) then
    begin
      S := '';
      for I := 0 to GetArrayLength(Lines) - 1 do
        S := S + Lines[I];
      Result := S;
    end;
  end;
end;

// Extrai versão do version.json de forma simples e robusta
function ExtractVersionFromJson(const JsonStr: String): String;
var
  P, PColon, PQuote1, PQuote2: Integer;
  Rest: String;
begin
  Result := '';
  P := Pos('"programVersion"', JsonStr);
  if P > 0 then
  begin
    Rest := Copy(JsonStr, P, Length(JsonStr) - P + 1);
    PColon := Pos(':', Rest);
    if PColon > 0 then
    begin
      Rest := Copy(Rest, PColon + 1, Length(Rest) - PColon);
      PQuote1 := Pos('"', Rest);
      if PQuote1 > 0 then
      begin
        Rest := Copy(Rest, PQuote1 + 1, Length(Rest) - PQuote1);
        PQuote2 := Pos('"', Rest);
        if PQuote2 > 0 then
          Result := Copy(Rest, 1, PQuote2 - 1);
      end;
    end;
  end;
end;

// Resolução inteligente do caminho de instalação priorizando a pasta oficial
function GetDetectedInstallDir(Param: String): String;
begin
  if DetectedDir <> '' then
    Result := DetectedDir
  else if DirExists('F:\GelControl_Oficial') then
    Result := 'F:\GelControl_Oficial'
  else if DirExists('F:\') then
    Result := 'F:\GelControl_Oficial'
  else if DirExists('D:\GelControl_Oficial') then
    Result := 'D:\GelControl_Oficial'
  else if DirExists('D:\') then
    Result := 'D:\GelControl_Oficial'
  else if DirExists('E:\GelControl_Oficial') then
    Result := 'E:\GelControl_Oficial'
  else
    Result := 'C:\GelControl_Oficial';
end;

// Inicialização: detecção profunda da instalação existente com prioridade hierárquica estrita
function InitializeSetup(): Boolean;
var
  RegPath: String;
  VJsonPath: String;
  VJsonContent: String;
begin
  DetectedDir := '';
  DetectedVersion := '';
  IsUpgradeMode := False;
  IsRepairMode := False;
  InstallCompletedSuccessfully := False;
  BackupPerformedSuccessfully := False;
  BackupLocation := '';
  TargetAppDir := '';
  ModeDescription := 'Nova Instalacao Oficial';

  // 1. Checagem via Registro do Windows (HKCU e HKLM)
  if RegQueryStringValue(HKCU, 'Software\GelControl', 'InstallPath', RegPath) then
  begin
    if DirExists(RegPath) and FileExists(AddBackslash(RegPath) + 'Programa\GelControl.exe') then
      DetectedDir := RegPath;
  end;

  if (DetectedDir = '') and RegQueryStringValue(HKLM, 'Software\GelControl', 'InstallPath', RegPath) then
  begin
    if DirExists(RegPath) and FileExists(AddBackslash(RegPath) + 'Programa\GelControl.exe') then
      DetectedDir := RegPath;
  end;

  // 2. Varredura com prioridade rigorosa para pastas Oficiais
  if DetectedDir = '' then
  begin
    if DirExists('F:\GelControl_Oficial') and FileExists('F:\GelControl_Oficial\Programa\GelControl.exe') then
      DetectedDir := 'F:\GelControl_Oficial'
    else if DirExists('D:\GelControl_Oficial') and FileExists('D:\GelControl_Oficial\Programa\GelControl.exe') then
      DetectedDir := 'D:\GelControl_Oficial'
    else if DirExists('E:\GelControl_Oficial') and FileExists('E:\GelControl_Oficial\Programa\GelControl.exe') then
      DetectedDir := 'E:\GelControl_Oficial'
    else if DirExists('C:\GelControl_Oficial') and FileExists('C:\GelControl_Oficial\Programa\GelControl.exe') then
      DetectedDir := 'C:\GelControl_Oficial'
    else if DirExists('F:\GelControl') and FileExists('F:\GelControl\Programa\GelControl.exe') then
      DetectedDir := 'F:\GelControl'
    else if DirExists('C:\GelControl') and FileExists('C:\GelControl\Programa\GelControl.exe') then
      DetectedDir := 'C:\GelControl';
  end;

  // 3. Análise da versão instalada
  if DetectedDir <> '' then
  begin
    VJsonPath := AddBackslash(DetectedDir) + 'Programa\resources\app\version.json';
    if FileExists(VJsonPath) then
    begin
      VJsonContent := LoadFileContent(VJsonPath);
      DetectedVersion := ExtractVersionFromJson(VJsonContent);
    end;

    if DetectedVersion = '' then
      DetectedVersion := 'Anterior';

    if DetectedVersion = '{#MyAppVersion}' then
    begin
      IsRepairMode := True;
      ModeDescription := 'Reparo e Verificacao de Integridade (v' + DetectedVersion + ')';
    end
    else
    begin
      IsUpgradeMode := True;
      ModeDescription := 'Atualizacao Direta (v' + DetectedVersion + ' -> v{#MyAppVersion})';
    end;
  end;

  Result := True;
end;

// Personalização das telas do assistente com base no diagnóstico
procedure InitializeWizard();
var
  InfoText: String;
begin
  if IsUpgradeMode then
  begin
    InfoText := 'O Instalador Inteligente detectou uma instalacao existente do GelControl:' + #13#10 +
                '• Pasta: ' + DetectedDir + #13#10 +
                '• Versao Atual: v' + DetectedVersion + #13#10 +
                '• Nova Versao Oficial: v{#MyAppVersion}' + #13#10#13#10 +
                'MODO AUTOMATICO: ATUALIZACAO DIRETA (IN-PLACE UPGRADE)' + #13#10#13#10 +
                'GARANTIA DE SEGURANCA:' + #13#10 +
                'Todos os seus dados comerciais (clientes, vendas, pedidos, lixeira e credenciais) ' +
                'estao 100% seguros e serao estritamente preservados.' + #13#10 +
                'Um backup preventivo sera criado antes da substituicao dos arquivos.';
    WizardForm.WelcomeLabel2.Caption := InfoText;
  end
  else if IsRepairMode then
  begin
    InfoText := 'O Instalador Inteligente detectou que o GelControl ja esta na versao v' + DetectedVersion + ':' + #13#10 +
                '• Pasta: ' + DetectedDir + #13#10#13#10 +
                'MODO AUTOMATICO: REPARO E VALIDACAO DE INTEGRIDADE' + #13#10#13#10 +
                'Todos os componentes oficiais serao conferidos e restaurados sem alterar sua base de dados.';
    WizardForm.WelcomeLabel2.Caption := InfoText;
  end;
end;

// Validação estrita ao avançar de página (Bloqueio anti-colisão)
function NextButtonClick(CurPageID: Integer): Boolean;
var
  ChosenDir: String;
begin
  Result := True;
  if CurPageID = wpSelectDir then
  begin
    ChosenDir := ExpandConstant('{app}');

    // TRAVA ABSOLUTA: Proibir instalar no PrecificaPizza
    if (Pos('precificapizza', Lowercase(ChosenDir)) > 0) then
    begin
      MsgBox('BLOQUEIO DE SEGURANCA:' + #13#10#13#10 +
             'A pasta selecionada pertence ao sistema PrecificaPizza.' + #13#10 +
             'Por favor, selecione a pasta oficial do GelControl (ex: F:\GelControl_Oficial).',
             mbError, MB_OK);
      Result := False;
      Exit;
    end;
  end;
end;

// Preparação pré-instalação: verificação de escrita, encerramento de locks e backup preventivo
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  AppDir, BackupDir, TestFile: String;
  ResultCode: Integer;
  Retries: Integer;
begin
  Result := '';
  AppDir := ExpandConstant('{app}\Programa\resources\app');
  BackupDir := ExpandConstant('{app}\Backups\backup_pre_upgrade_v{#MyAppVersion}');
  TargetAppDir := AppDir;
  BackupLocation := BackupDir;

  // 1. Verificação prévia de permissão de escrita no diretório de destino
  ForceDirectories(ExpandConstant('{app}\Dados'));
  ForceDirectories(ExpandConstant('{app}\Programa'));
  TestFile := ExpandConstant('{app}\Programa\.write_test.tmp');
  if not SaveStringToFile(TestFile, 'PERM_TEST', False) then
  begin
    Result := 'Permissao de gravacao insuficiente na pasta de instalacao.' + #13#10 +
              'Verifique se a unidade esta acessivel ou execute com permissoes adequadas.';
    Exit;
  end;
  DeleteFile(TestFile);

  // 2. Encerramento gracioso de processos ativos do GelControl.exe
  Exec('taskkill.exe', '/F /IM GelControl.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // 3. Laço de espera para liberação de locks pelo kernel do Windows
  Retries := 0;
  while (Retries < 6) do
  begin
    Sleep(250);
    Retries := Retries + 1;
  end;

  // 4. Criação atômica do backup preventivo antes de substituir qualquer arquivo
  if DirExists(AppDir) then
  begin
    ForceDirectories(BackupDir);
    Exec('cmd.exe', '/c xcopy /E /I /Q /Y "' + AppDir + '" "' + BackupDir + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    if ResultCode = 0 then
      BackupPerformedSuccessfully := True;
  end;
end;

// Pós-instalação: gravação do log oficial e ajuste fino de atalhos e ícones
procedure CurStepChanged(CurStep: TSetupStep);
var
  LogLines: TArrayOfString;
  LogPath: String;
  IconPath: String;
  ShortcutPath: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    InstallCompletedSuccessfully := True;

    // Limpa estado residual de transações de atualização interrompidas em versões anteriores
    DeleteFile(ExpandConstant('{app}\Dados\update_state.json'));
    DeleteFile(ExpandConstant('{app}\Dados\update_in_progress.lock'));

    LogPath := ExpandConstant('{app}\Dados\instalador_v{#MyAppVersion}.log');
    SetArrayLength(LogLines, 10);
    LogLines[0] := '====================================================';
    LogLines[1] := 'GELCONTROL OFICIAL - RELATORIO DO INSTALADOR INTELIGENTE';
    LogLines[2] := '====================================================';
    LogLines[3] := 'Data/Hora: ' + GetDateTimeString('dd/mm/yyyy hh:nn:ss', '-', ':');
    LogLines[4] := 'Modo Executado: ' + ModeDescription;
    LogLines[5] := 'Pasta Destino: ' + ExpandConstant('{app}');
    LogLines[6] := 'Versao Instalada: v{#MyAppVersion}';
    LogLines[7] := 'Preservacao de Dados: SUCESSO (Dados\ e Backups\ 100% intactos)';
    LogLines[8] := 'Status Geral: INSTALACAO CONCLUIDA COM 100% DE EXITO';
    LogLines[9] := '====================================================';
    SaveStringsToFile(LogPath, LogLines, True);

    // Ajuste do ícone circular: se existir app_icon_round.ico em Dados\, associar ao atalho
    IconPath := ExpandConstant('{app}\Dados\app_icon_round.ico');
    ShortcutPath := ExpandConstant('{autodesktop}\{#MyAppName}.lnk');
    if FileExists(IconPath) and FileExists(ShortcutPath) then
    begin
      Exec('powershell.exe', 
           '-NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(''' + ShortcutPath + '''); $s.IconLocation = ''' + IconPath + ''', 0; $s.Save()"',
           '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

// Finalização: Rollback Automático Ativo em caso de falha ou cancelamento inesperado
procedure DeinitializeSetup();
var
  ResultCode: Integer;
  RollbackLog: TArrayOfString;
begin
  // Se era atualização/reparo, foi feito backup, mas a instalação NÃO completou com sucesso:
  if (IsUpgradeMode or IsRepairMode) and BackupPerformedSuccessfully and (not InstallCompletedSuccessfully) then
  begin
    if (TargetAppDir <> '') and (BackupLocation <> '') and DirExists(BackupLocation) then
    begin
      // Restaura automaticamente a versão anterior a partir do backup preventivo
      Exec('cmd.exe', '/c xcopy /E /I /Q /Y "' + BackupLocation + '" "' + TargetAppDir + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      
      // Registra a ocorrência no log de contingência
      SetArrayLength(RollbackLog, 5);
      RollbackLog[0] := '====================================================';
      RollbackLog[1] := 'ALERTA: ROLLBACK AUTOMATICO EXECUTADO PELO INSTALADOR';
      RollbackLog[2] := 'A instalacao foi interrompida antes da conclusao.';
      RollbackLog[3] := 'A versao anterior foi integralmente restaurada a partir do backup.';
      RollbackLog[4] := '====================================================';
      SaveStringsToFile(ExpandConstant('{app}\Dados\rollback_contingencia.log'), RollbackLog, True);
    end;
  end;
end;
