Set WshShell = CreateObject("WScript.Shell")
' 隐藏窗口启动 npm run dev
WshShell.Run "cmd /c cd /d ""C:\Users\unscomic\AppData\Roaming\CherryStudio\Data\Agents\4553n15vc"" && npm run dev", 0, False
' 等6秒服务器启动后打开浏览器
WScript.Sleep 6000
WshShell.Run "http://localhost:3000"
