global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'alentapp-api'
    static_configs:
      - targets: ['${api_internal_fqdn}']
        labels:
          app: 'alentapp-api'
          service: 'api'

  - job_name: 'opentelemetry'
    static_configs:
      - targets: ['${api_internal_fqdn}']
        labels:
          app: 'alentapp'
          service: 'api-otel'
