# PowerShell script to organize project structure

# Remove unnecessary files
Remove-Item "README.md" -Force
Remove-Item "eslint.config.js" -Force

# Move frontend files to root level
Move-Item "frontend\*" "." -Force

# Clean up
Remove-Item "frontend" -Recurse -Force
