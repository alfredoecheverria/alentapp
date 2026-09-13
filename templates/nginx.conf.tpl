server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    error_log /var/log/nginx/error.log debug;
    access_log /var/log/nginx/access.log combined;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    add_header X-Frame-Options           "DENY"                              always;
    add_header X-Content-Type-Options    "nosniff"                           always;
    add_header X-XSS-Protection          "1; mode=block"                     always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin"   always;
    add_header Content-Security-Policy
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        always;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass https://${backend_host};
        proxy_ssl_server_name on;
        proxy_set_header Host ${backend_host};
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
