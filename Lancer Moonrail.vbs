Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = folder
On Error Resume Next
shell.Run "pyw serve.py", 0, False
If Err.Number <> 0 Then
  Err.Clear
  shell.Run "cmd /c LANCER_MOONRAIL.bat", 1, False
End If
On Error GoTo 0
