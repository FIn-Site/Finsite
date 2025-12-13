# Deployment Guide

This guide covers building, deploying, and maintaining Finsite in production.

---

## Quick Start (One-Press Deploy)

Finsite supports **automatic deployment** via Netlify or GitHub Pages:

### Option 1: Netlify (Recommended)

1. **Fork the repository** on GitHub
2. **Sign up** at [netlify.com](https://netlify.com)
3. **Click "Add new site"** → "Import an existing project"
4. **Connect to GitHub** and select your fork
5. **Configure build settings:**
   - Build command: `npm run build` (will be added)
   - Publish directory: `dist`
6. **Click "Deploy"**

**Auto-deploy:** Every push to `main` triggers automatic deployment (< 2 minutes).

### Option 2: GitHub Pages

1. **Enable GitHub Pages** in repository settings
2. **Set source** to "GitHub Actions"
3. **Push to main** - GitHub Actions workflow deploys automatically

---

## Build Process

### Development Build

```bash
npm run dev
```

Starts Vite development server with:
- Hot Module Replacement (HMR)
- Source maps for debugging
- Fast incremental rebuilds

### Production Build

```bash
npm run build
```

Creates optimized production bundle in `dist/`:
- Minified JavaScript and CSS
- Tree-shaking (removes unused code)
- Asset optimization and hashing
- Source maps (optional)

**Output structure:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── ChartJS/
```

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing before deployment.

---

## Deployment Options

### Netlify (Recommended)

**Why Netlify:**
- One-click setup with GitHub integration
- Automatic HTTPS
- CDN with global edge locations
- Deploy previews for pull requests
- Instant rollback capability
- Free tier sufficient for most uses

**Setup:**

1. **Create `netlify.toml`** in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Connect repository:**
   - Go to [netlify.com](https://netlify.com)
   - New site from Git → Select repository
   - Settings auto-detected from `netlify.toml`

3. **Deploy:**
   ```bash
   git push origin main
   ```
   Deployment starts automatically.

**Custom Domain:**
- Settings → Domain management → Add custom domain
- Update DNS records as instructed
- HTTPS enabled automatically via Let's Encrypt

---

### GitHub Pages

**Why GitHub Pages:**
- Free hosting for public repos
- Integrated with GitHub workflow
- Custom domain support
- Simple setup

**Setup:**

1. **Create `.github/workflows/deploy.yml`:**
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [main]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Build
           run: npm run build
           
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `root`

3. **Push to trigger deployment:**
   ```bash
   git push origin main
   ```

**Access:** `https://[username].github.io/Finsite/`

---

### Vercel

**Setup:**
1. Sign up at [vercel.com](https://vercel.com)
2. Import Git repository
3. Configure:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy

**Auto-deploy:** Every push to `main` triggers deployment.

---

### Self-Hosting

For VPS or dedicated server:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Serve static files:**
   
   **Using nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/finsite/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   **Using Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/finsite/dist
       
       <Directory /var/www/finsite/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

3. **Upload dist/ folder** to server via FTP, SCP, or rsync

---

## Verification Checklist

After deployment, verify the following:

### Functional Testing
- [ ] App loads without errors (check browser console)
- [ ] All pages render correctly (Dashboard, Transactions, Categories)
- [ ] Navigation works between pages
- [ ] Can add new transaction
- [ ] Charts display on dashboard
- [ ] Sidebar collapse/expand works
- [ ] Search and filters function correctly
- [ ] Data persists after page reload (IndexedDB)

### Performance Testing
- [ ] Page loads in < 3 seconds (first load)
- [ ] Lighthouse score > 90 (Performance)
- [ ] No console errors or warnings
- [ ] Assets load from CDN (if applicable)
- [ ] HTTPS enabled and working

### Browser Compatibility
- [ ] Works in Chrome/Edge (Chromium)
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Mobile responsive (test on phone)

### Data Integrity
- [ ] IndexedDB creates successfully
- [ ] Transactions save and load correctly
- [ ] Dashboard aggregates calculate properly
- [ ] No data loss on page reload

---

## Rollback Procedure

### Netlify
1. Go to site dashboard → Deploys
2. Find last working deployment
3. Click "Publish deploy"
4. Site reverts instantly (< 10 seconds)

### GitHub Pages
1. Find last working commit: `git log`
2. Revert to that commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
3. Wait for GitHub Actions to redeploy (~2 minutes)

### Manual Rollback
1. Checkout previous working version:
   ```bash
   git checkout <commit-hash>
   npm run build
   ```
2. Deploy `dist/` folder using your deployment method

---

## Environment Configuration

Finsite is a **client-side only** application with no backend:

- **No environment variables needed**
- **No API keys required**
- **No server-side configuration**

All data stored locally in browser's IndexedDB.

### Future: Adding Backend

If adding server sync in the future:

1. **Create `.env` file:**
   ```
   VITE_API_URL=https://api.your-domain.com
   VITE_API_KEY=your-key-here
   ```

2. **Access in code:**
   ```javascript
   const apiUrl = import.meta.env.VITE_API_URL;
   ```

3. **Add to Netlify:**
   - Site settings → Environment variables
   - Add each variable

---

## Monitoring & Maintenance

### Analytics (Optional)

**Add Google Analytics:**
```html
<!-- In src/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Optional)

**Add Sentry:**
1. Install: `npm install @sentry/browser`
2. Initialize in `src/app.js`:
   ```javascript
   import * as Sentry from '@sentry/browser';
   Sentry.init({ dsn: 'your-dsn' });
   ```

### Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://pingdom.com)
- [StatusCake](https://statuscake.com)

Set up ping every 5 minutes with email alerts.

---

## Performance Optimization

### Bundle Size
- Run `npm run build` and check `dist/` size
- Target: < 500KB total (excluding Chart.js)
- Use bundle analyzer if size grows: `npm install -D rollup-plugin-visualizer`

### Caching
- Netlify/Vercel handle this automatically
- For nginx, add cache headers:
  ```nginx
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
  }
  ```

### CDN
- Chart.js already loaded from CDN
- Consider moving other large assets to CDN if bundle grows

---

## Security

### HTTPS
- **Required** - All platforms enable HTTPS automatically
- IndexedDB requires secure context (HTTPS or localhost)

### Content Security Policy (Optional)
Add to `src/index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';">
```

### Data Privacy
- All data stored locally in user's browser
- No data sent to external servers
- Clear browser storage clears all app data

---

## Continuous Integration/Deployment

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run unit tests
        run: npm test
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Troubleshooting

### Build Fails
- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf node_modules/.vite && npm ci`
- Check for syntax errors: `npm run lint`

### Assets Not Loading
- Verify build output in `dist/`
- Check browser console for 404 errors
- Ensure base URL is correct in deployment platform

### IndexedDB Not Working
- Verify HTTPS is enabled (required for IndexedDB)
- Check browser console for errors
- Try incognito mode (extensions can block IndexedDB)

### Deployment Takes Too Long
- Check if node_modules is being uploaded (add to `.gitignore`)
- Verify build command is correct
- Check platform status page

---

## Next Steps

- Set up deployment platform (Netlify recommended)
- Configure custom domain (optional)
- Enable analytics and monitoring
- Set up automated backups (if adding backend later)
- Review [Development Guide](DEVELOPMENT.md) for contribution workflow
