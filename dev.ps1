param(
    [Parameter(Position=0)]
    [string]$Action = "start"
)

switch ($Action.ToLower()) {
    "start" {
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
        Write-Host "Vite dev server starting in new window..."
    }
    "stop" {
        Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
        Write-Host "Stopped all Node processes"
    }
    "status" {
        $procs = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
        if ($procs) {
            Write-Host "Running Node processes:"
            $procs | Format-Table ProcessName, Id, StartTime
        } else {
            Write-Host "No Node processes running"
        }
    }
    default {
        Write-Host "Usage: .\dev.ps1 [start|stop|status]"
        Write-Host "  start  - Start Vite dev server in new window"
        Write-Host "  stop   - Stop all Node processes"
        Write-Host "  status - Show running Node processes"
    }
}
