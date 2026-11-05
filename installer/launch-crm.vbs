Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
q = Chr(34)
url = "https://name112233541.github.io/ecom-sales-crm/?v=3"
edge = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
If Not fso.FileExists(edge) Then
  edge = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe"
End If
If fso.FileExists(edge) Then
  shell.Run q & edge & q & " --app=" & q & url & q, 1, False
Else
  shell.Run q & url & q, 1, False
End If
