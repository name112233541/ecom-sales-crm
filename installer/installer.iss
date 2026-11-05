[Setup]
AppName=电商销售台
AppVersion=1.0.0
AppPublisher=电商销售台
DefaultDirName={localappdata}\EcomSalesCRM
DefaultGroupName=电商销售台
OutputDir=..\downloads
OutputBaseFilename=EcomSalesCRM-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\crm.ico
SetupIconFile=crm.ico

[Files]
Source: "crm.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "team.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "launch-crm.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "launch-team.vbs"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autodesktop}\电商销售台"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launch-crm.vbs"""; IconFilename: "{app}\crm.ico"; WorkingDir: "{app}"
Name: "{autodesktop}\Agent 工作台"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launch-team.vbs"""; IconFilename: "{app}\team.ico"; WorkingDir: "{app}"
Name: "{group}\电商销售台"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launch-crm.vbs"""; IconFilename: "{app}\crm.ico"; WorkingDir: "{app}"
Name: "{group}\Agent 工作台"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launch-team.vbs"""; IconFilename: "{app}\team.ico"; WorkingDir: "{app}"

[Run]
Filename: "{sys}\wscript.exe"; Parameters: """{app}\launch-crm.vbs"""; Description: "打开电商销售台"; Flags: nowait postinstall skipifsilent
