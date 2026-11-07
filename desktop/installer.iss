; ============================================================================
; SCRIPT DO INSTALADOR WINDOWS — GELCONTROL v85 (INNO SETUP)
; Instalação Flexível em Qualquer Unidade com Preservação de Dados
; ============================================================================

#define MyAppName "GelControl"
#define MyAppVersion "85.0.0"
#define MyAppPublisher "Gelo do Vale"
#define MyAppURL "https://gelodovale.com.br"
#define MyAppExeName "GelControl.exe"

[Setup]
AppId={{E68A9E4D-79B4-4B45-8C2C-2268A6F00F85}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretório padrão sugerido (o usuário pode alterar livremente para D:, F:, G:, etc.)
DefaultDirName={drive:F:\}\GelControl
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Opção de Privilégios: solicita elevação administrativa para configurar atalhos e pastas
PrivilegesRequired=admin
OutputDir=Output
OutputBaseFilename=Instalador_GelControl_v85
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

[Types]
Name: "full"; Description: "Instalação Completa - Computador Principal (Fábrica / Escritório)"
Name: "workstation"; Description: "Instalação Estação de Trabalho (Motoristas / Balcão / Operação)"
Name: "custom"; Description: "Instalação Personalizada"; Flags: iscustom

[Components]
Name: "program"; Description: "Programa GelControl (Aplicativo e Componentes)"; Types: full workstation custom; Flags: fixed
Name: "admin_tools"; Description: "Ferramentas Administrativas e Gestão de Segredos"; Types: full

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; 1. Arquivos do Programa Executável (sempre instalados na subpasta Programa da unidade escolhida)
Source: "..\Programa\*"; DestDir: "{app}\Programa"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: program

; 2. Ferramentas Administrativas (Instaladas SOMENTE no Computador Principal)
Source: "..\..\..\OneDrive\GelodoVale-system\App\tools\*"; DestDir: "{app}\Seguranca\Tools"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: admin_tools

[Dirs]
; Garante a criação estruturada das pastas na unidade e caminho escolhidos pelo usuário
Name: "{app}\Programa"
Name: "{app}\Dados"; Flags: uninsneveruninstall
Name: "{app}\Backups"; Flags: uninsneveruninstall
Name: "{app}\Seguranca"; Flags: uninsneveruninstall; Components: admin_tools

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\Programa\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\Programa\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\Programa\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Código Pascal para validação prévia de reinstalação e preservação de dados
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

// Preserva integralmente Dados e Backups durante a desinstalação
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    // Os diretórios marcados com uninsneveruninstall são mantidos 100% intactos no disco
  end;
end;
