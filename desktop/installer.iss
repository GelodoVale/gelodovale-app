; ============================================================================
; SCRIPT DO INSTALADOR WINDOWS — GELCONTROL v85 (INNO SETUP)
; Instalação Inteligente, Multi-Unidade (F:, D:, G:, C:) com Preservação de Dados
; Dois Modos: Computador Principal (Admin) e Estação de Trabalho (Comercial)
; ============================================================================

#define MyAppName "GelControl"
#define MyAppVersion "85.4.0"
#define MyAppPublisher "Gelo do Vale"
#define MyAppURL "https://gelodovale.com.br"
#define MyAppOnlineURL "https://gelodovale.github.io/gelodovale-app/"
#define MyAppExeName "GelControl.exe"

[Setup]
AppId={{E68A9E4D-79B4-4B45-8C2C-2268A6F00F85}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretório padrão dinâmico: Prioriza F:\GelControl se F: existir (PC 1), senão D: ou C:
DefaultDirName={code:GetDefaultInstallDir}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Privilégios administrativos para criar atalhos globais e configurar permissões
PrivilegesRequired=admin
OutputDir=Output
OutputBaseFilename=Instalador_GelControl_v85.4.0_Oficial
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

; Idioma em Português do Brasil
ShowLanguageDialog=no

[Types]
Name: "principal"; Description: "Computador Principal (Fábrica / Escritório — com Ferramentas Administrativas)"; Flags: iscustom
Name: "estacao"; Description: "Estação de Trabalho (Balcão / Motoristas — apenas Aplicativo Comercial)"

[Components]
Name: "program"; Description: "Aplicativo Comercial GelControl (Executável e Recursos)"; Types: principal estacao; Flags: fixed
Name: "admin_tools"; Description: "Ferramentas Administrativas de Escritório (tools/)"; Types: principal

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; 1. Arquivos do Programa Executável (sempre instalados na subpasta Programa da unidade escolhida)
Source: "F:\GelControl\Programa\*"; DestDir: "{app}\Programa"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: program; Excludes: "*.log,*.tmp,*.bak"

; 2. Ferramentas Administrativas Locais (Instaladas SOMENTE no Computador Principal)
; NUNCA inclui chaves privadas, service-account.json ou segredos
Source: "..\tools\*"; DestDir: "{app}\Seguranca\Tools"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: admin_tools; Excludes: "service-account*.json,*.key,*.pem,*.env,secrets"

[Dirs]
; Garante a criação estruturada das pastas na unidade e caminho escolhidos pelo usuário
Name: "{app}\Programa"
Name: "{app}\Dados"; Flags: uninsneveruninstall
Name: "{app}\Backups"; Flags: uninsneveruninstall
Name: "{app}\Seguranca"; Flags: uninsneveruninstall; Components: admin_tools
Name: "{app}\Seguranca\Tools"; Components: admin_tools

[Icons]
; Atalhos na Área de Trabalho
Name: "{autodesktop}\GelControl — Local"; Filename: "{app}\Programa\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\Programa\{#MyAppExeName}"
Name: "{autodesktop}\GelControl — Online"; Filename: "{#MyAppOnlineURL}"; Tasks: desktopicon

; Atalhos no Menu Iniciar
Name: "{autoprograms}\{#MyAppName}\GelControl — Local"; Filename: "{app}\Programa\{#MyAppExeName}"
Name: "{autoprograms}\{#MyAppName}\GelControl — Online"; Filename: "{#MyAppOnlineURL}"
Name: "{autoprograms}\{#MyAppName}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\Programa\{#MyAppExeName}"; Description: "{cm:LaunchProgram,GelControl}"; Flags: nowait postinstall skipifsilent

[Code]
// Resolução Dinâmica da Unidade Padrão: Prioriza F:\, D:\ ou C:\
function GetDefaultInstallDir(Param: String): String;
begin
  if DirExists('F:\') then
    Result := 'F:\GelControl'
  else if DirExists('D:\') then
    Result := 'D:\GelControl'
  else
    Result := 'C:\GelControl';
end;

// Validação prévia de integridade e notificação de dados preservados
function NextButtonClick(CurPageID: Integer): Boolean;
var
  DadosDir, BackupsDir: String;
begin
  Result := True;
  if CurPageID = wpSelectDir then
  begin
    DadosDir := ExpandConstant('{app}\Dados');
    BackupsDir := ExpandConstant('{app}\Backups');
    if DirExists(DadosDir) or DirExists(BackupsDir) then
    begin
      MsgBox('Uma instalação ou base de dados anterior foi detectada nesta pasta.' + #13#10#13#10 +
             'Seus dados comerciais e backups históricos estão 100% seguros e serão rigorosamente preservados.', 
             mbInformation, MB_OK);
    end;
  end;
end;

// Preservação de dados durante desinstalação
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    // As pastas Dados e Backups com uninsneveruninstall permanecem intactas no disco
  end;
end;
