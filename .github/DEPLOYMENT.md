# GitHub Pages Auto-Deployment Setup

## ✅ Current Configuration

### GitHub Actions Workflow
- **File**: `.github/workflows/deploy.yml`
- **Trigger**: Automatic on every push to `main` branch
- **Manual trigger**: Available via workflow_dispatch

### What Happens Automatically

1. **On Push to Main**:
   - GitHub Actions workflow starts
   - Installs Node.js dependencies
   - Runs `npm run build`
   - Creates production bundle in `dist/`
   - Uploads to GitHub Pages
   - Deploys to live site

2. **Live URL**: https://top-5.github.io/klondike/

3. **Status Badge**: Shows deployment status in README

## 🛠️ Required GitHub Settings

To ensure this works, verify these settings in your GitHub repository:

1. Go to: **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source**: Should be set to **GitHub Actions** (not "Deploy from a branch")
3. Under **Settings** → **Environments**:
   - Should see `github-pages` environment

## 🔄 Deployment Methods

### Method 1: Automatic (Recommended)
```bash
git add .
git commit -m "Your changes"
git push
# GitHub Actions automatically builds and deploys!
```

### Method 2: Manual via npm script
```bash
npm run deploy
# Uses gh-pages package to deploy directly
```

### Method 3: Manual workflow trigger
- Go to GitHub → Actions → Deploy to GitHub Pages
- Click "Run workflow"

## 📊 Monitoring

- **Workflow runs**: https://github.com/top-5/klondike/actions
- **Deployment status**: Check the badge in README.md
- **Live site**: https://top-5.github.io/klondike/

## 🎯 Benefits of Auto-Deploy

✅ No manual deployment needed
✅ Always deploys latest from main branch
✅ Build errors caught in CI/CD
✅ Deployment history tracked in Actions
✅ Consistent build environment
✅ Status visible via badge

## 🔧 Troubleshooting

If deployment fails:
1. Check the Actions tab for error logs
2. Verify GitHub Pages is set to use "GitHub Actions"
3. Check workflow permissions (needs `pages: write`)
4. Ensure repository has Pages enabled
