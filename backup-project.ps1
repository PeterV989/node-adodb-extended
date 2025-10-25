# Smart Node.js Monorepo Backup Script
# Automatically excludes unnecessary folders but includes all project directories

param(
    [string]$BackupPath = "$env:USERPROFILE\Downloads",
    [switch]$OpenFolder
)

# Get current directory name for the zip file
$projectName = Split-Path -Leaf (Get-Location)
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$zipName = "$projectName-$timestamp.zip"
$zipPath = Join-Path $BackupPath $zipName

# Folders/files to exclude (add more as needed)
$excludePatterns = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".nyc_output",
    "logs",
    "*.log",
    ".DS_Store",
    "Thumbs.db",
    ".env.local",
    ".env.*.local",
    "*.tmp",
    "*.temp"
)

Write-Host "🚀 Starting backup of '$projectName'..." -ForegroundColor Green
Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Get all files and folders, excluding the patterns
Write-Host "📦 Collecting files (excluding unnecessary folders)..." -ForegroundColor Yellow

# Create a temporary folder for staging
$tempDir = Join-Path $env:TEMP "backup-staging-$(Get-Random)"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

try {
    # Copy files with exclusions
    $allItems = Get-ChildItem -Path "." -Recurse
    # $totalItems = $allItems.Count
    $copiedItems = 0

    foreach ($item in $allItems) {
        $relativePath = $item.FullName.Substring((Get-Location).Path.Length + 1)

        # Check if item matches any exclude pattern
        $shouldExclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($relativePath -like "*$pattern*" -or $item.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }

        if (-not $shouldExclude) {
            $destPath = Join-Path $tempDir $relativePath
            $destDir = Split-Path $destPath -Parent

            if (-not (Test-Path $destDir)) {
                New-Item -Path $destDir -ItemType Directory -Force | Out-Null
            }

            if ($item.PSIsContainer) {
                if (-not (Test-Path $destPath)) {
                    New-Item -Path $destPath -ItemType Directory -Force | Out-Null
                }
            } else {
                Copy-Item $item.FullName $destPath -Force
                $copiedItems++
            }
        }
    }

    # Create the zip file
    Write-Host "🗜️  Creating zip file..." -ForegroundColor Yellow
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

    # Get zip file size
    $zipSize = (Get-Item $zipPath).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)

    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $zipPath" -ForegroundColor Cyan
    Write-Host "📊 Files backed up: $copiedItems" -ForegroundColor Cyan
    Write-Host "💾 Zip size: $zipSizeMB MB" -ForegroundColor Cyan

    # Show what was excluded
    Write-Host "`n🚫 Excluded patterns:" -ForegroundColor Yellow
    $excludePatterns | ForEach-Object { Write-Host "   - $_" -ForegroundColor DarkYellow }

    # Optionally open the backup folder
    if ($OpenFolder) {
        Start-Process explorer.exe -ArgumentList $BackupPath
    }

} finally {
    # Clean up temp directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host "`n🎉 Ready to upload to Google Drive!" -ForegroundColor Green
Write-Host "💡 Tip: Use -OpenFolder to open Downloads folder automatically" -ForegroundColor DarkGray
