##############################################################################
# Terraform
##############################################################################

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "azurerm" {
  features {}
}

##############################################################################
# Variables
##############################################################################

variable "location" {
  description = "Azure region"
  type        = string
  default     = "southafricanorth"
}

variable "environment" {
  description = "Environment tag/suffix"
  type        = string
  default     = "prod"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "ADR2026test"
}

variable "acr_name" {
  description = "Azure Container Registry name (globally unique, alphanumeric only)"
  type        = string
  default     = "adr2026acr"
}

variable "storage_account_name" {
  description = "Storage account name for config file shares (globally unique, lowercase alphanumeric, <=24 chars)"
  type        = string
  default     = "alentappstorage"
}

variable "postgres_server_name" {
  description = "PostgreSQL Flexible Server name (globally unique)"
  type        = string
  default     = "psql-alentapp"
}

variable "postgres_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "psqladmin"
}

variable "postgres_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "postgres_db_name" {
  description = "Application database name"
  type        = string
  default     = "alentapp_db"
}

variable "postgres_sku_name" {
  description = "SKU for the Postgres Flexible Server"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgres_storage_mb" {
  description = "Storage size in MB for Postgres"
  type        = number
  default     = 32768
}

variable "postgres_version" {
  description = "PostgreSQL major version"
  type        = string
  default     = "16"
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "frontend_source_path" {
  description = "Local path to the frontend build context (folder containing its Dockerfile)"
  type        = string
  default     = "./packages/web/"
}

variable "frontend_nginx_conf_output_path" {
  description = "Path to the rendered nginx config"
  type        = string
  default     = null
}

variable "backend_source_path" {
  description = "Local path to the backend build context (folder containing its Dockerfile)"
  type        = string
  default     = "./packages/api/Dockerfile.prod"
}

variable "grafana_datasource_config_path" {
  description = "Local path to Grafana datasource provisioning YAML"
  type        = string
  default     = "./observability/grafana/datasources.yml"
}

variable "grafana_dashboard_provider_path" {
  description = "Local path to Grafana dashboard provisioning YAML"
  type        = string
  default     = "./observability/grafana/dashboards.yml"
}

variable "grafana_dashboard_json_path" {
  description = "Local path to Grafana dashboards"
  type        = string
  default     = "./observability/grafana/dashboards/red-metrics.json"
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default = {
    project     = "alentapp"
    managed_by  = "terraform"
  }
}

##############################################################################
# Resource Group
##############################################################################

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

##############################################################################
# Azure Container Registry
##############################################################################

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = var.tags
}

# prometheus config template file, required by the prometheus service
resource "local_file" "prometheus_yml_rendered" {
    filename = "${path.module}/.generated/prometheus.yml"

    content = templatefile("${path.module}/templates/prometheus.yml.tpl", {
        api_internal_fqdn = "${azurerm_container_app.api.name}.internal.${azurerm_container_app_environment.main.default_domain}"
    })
}

# Nginx template file, required by the frontend build
resource "local_file" "nginx_conf" {
    filename = coalesce(
        var.frontend_nginx_conf_output_path,
        "${dirname(var.frontend_source_path)}/nginx.conf"
    )

    content = templatefile("${path.module}/templates/nginx.conf.tpl", {
        backend_host = azurerm_container_app.api.ingress[0].fqdn
    })
}

# Build images directly in ACR (ACR Tasks) so no local Docker daemon is
# required at apply time. Requires the Azure CLI to be logged in on the
# machine running `terraform apply`.
resource "null_resource" "build_frontend_image" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command = <<-EOT
        $ErrorActionPreference = "Stop"
        az acr login --name ${azurerm_container_registry.acr.name}
        docker build --no-cache -t ${azurerm_container_registry.acr.login_server}/frontend:latest -f ${var.frontend_source_path}/Dockerfile.prod --build-arg VITE_API_URL=/api .
        docker push ${azurerm_container_registry.acr.login_server}/frontend:latest
    EOT
  }

  depends_on = [azurerm_container_registry.acr, local_file.nginx_conf]
}

resource "null_resource" "build_backend_image" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command = <<-EOT
        $ErrorActionPreference = "Stop"
        az acr login --name ${azurerm_container_registry.acr.name}
        docker build -t ${azurerm_container_registry.acr.login_server}/backend:latest -f ${var.backend_source_path} .
        docker push ${azurerm_container_registry.acr.login_server}/backend:latest
    EOT
  }

  depends_on = [azurerm_container_registry.acr]
}

resource "null_resource" "build_backend_migrate_image" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    interpreter = ["PowerShell", "-Command"]
    command = <<-EOT
        $ErrorActionPreference = "Stop"
        az acr login --name ${azurerm_container_registry.acr.name}
        docker build --target migrator -t ${azurerm_container_registry.acr.login_server}/backend-migrate:latest -f ${var.backend_source_path} .
        docker push ${azurerm_container_registry.acr.login_server}/backend-migrate:latest
    EOT
  }

  depends_on = [azurerm_container_registry.acr]
}

##############################################################################
# Storage Account + File Shares for Prometheus/Grafana config
##############################################################################

resource "azurerm_storage_account" "config" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

resource "azurerm_storage_share" "prometheus_config" {
  name               = "prometheus-config"
  storage_account_id = azurerm_storage_account.config.id
  quota              = 1
}

resource "azurerm_storage_share_file" "prometheus_yml" {
  name             = "prometheus.yml"
  storage_share_url = azurerm_storage_share.prometheus_config.url
  source           = local_file.prometheus_yml_rendered.filename

  depends_on       = [local_file.prometheus_yml_rendered]
}

resource "azurerm_storage_share" "grafana_datasources" {
  name               = "grafana-datasources"
  storage_account_id = azurerm_storage_account.config.id
  quota              = 1
}

resource "azurerm_storage_share_file" "grafana_datasource_yml" {
  name             = "datasource.yml"
  storage_share_url = azurerm_storage_share.grafana_datasources.url
  source           = var.grafana_datasource_config_path
}

resource "azurerm_storage_share" "grafana_dashboards_provider" {
  name               = "grafana-dashboards-provider"
  storage_account_id = azurerm_storage_account.config.id
  quota              = 1
}

resource "azurerm_storage_share_file" "grafana_dashboard_provider_yml" {
  name             = "dashboards.yml"
  storage_share_url = azurerm_storage_share.grafana_dashboards_provider.url
  source           = var.grafana_dashboard_provider_path
}

resource "azurerm_storage_share" "grafana_dashboards" {
  name               = "grafana-dashboards"
  storage_account_id = azurerm_storage_account.config.id
  quota              = 1
}

resource "azurerm_storage_share_file" "grafana_dashboards_json" {
  name             = "red-metrics.json"
  storage_share_url = azurerm_storage_share.grafana_dashboards.url
  source           = var.grafana_dashboard_json_path
}

##############################################################################
# PostgreSQL Flexible Server
##############################################################################

resource "azurerm_postgresql_flexible_server" "main" {
  name                          = var.postgres_server_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = var.postgres_version
  administrator_login           = var.postgres_admin_username
  administrator_password        = var.postgres_admin_password
  storage_mb                    = var.postgres_storage_mb
  sku_name                      = var.postgres_sku_name
  zone                          = "1"
  public_network_access_enabled = true
  tags                          = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "app_db" {
  name      = var.postgres_db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Allows Azure-hosted resources (e.g. Container Apps) to reach the server.
# For production, prefer VNet integration/private endpoint instead.
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAllAzureServicesAndResourcesWithinAzureIps"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

##############################################################################
# Log Analytics + Container Apps Environment
##############################################################################

resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-alentapp-${var.environment}" # CHANGE ME
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-alentapp-${var.environment}" # CHANGE ME
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = var.tags
}

# Mount the storage shares into the Container Apps Environment so they can
# be referenced as volumes by the prometheus/grafana container apps.
resource "azurerm_container_app_environment_storage" "prometheus_config" {
  name                         = "prometheus-config"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.config.name
  access_key                   = azurerm_storage_account.config.primary_access_key
  share_name                   = azurerm_storage_share.prometheus_config.name
  access_mode                  = "ReadOnly"
}

resource "azurerm_container_app_environment_storage" "grafana_datasources" {
  name                         = "grafana-datasources"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.config.name
  access_key                   = azurerm_storage_account.config.primary_access_key
  share_name                   = azurerm_storage_share.grafana_datasources.name
  access_mode                  = "ReadOnly"
}

resource "azurerm_container_app_environment_storage" "grafana_dashboards_provider" {
  name                         = "grafana-dashboards-provider"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.config.name
  access_key                   = azurerm_storage_account.config.primary_access_key
  share_name                   = azurerm_storage_share.grafana_dashboards_provider.name
  access_mode                  = "ReadOnly"
}

resource "azurerm_container_app_environment_storage" "grafana_dashboards" {
  name                         = "grafana-dashboards"
  container_app_environment_id = azurerm_container_app_environment.main.id
  account_name                 = azurerm_storage_account.config.name
  access_key                   = azurerm_storage_account.config.primary_access_key
  share_name                   = azurerm_storage_share.grafana_dashboards.name
  access_mode                  = "ReadOnly"
}

##############################################################################
# Backend Container App (compiled TS -> Node)
##############################################################################

resource "azurerm_container_app" "api" {
  name                         = "api"
  resource_group_name         = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                          = var.tags

  registry {
    server               = azurerm_container_registry.acr.login_server
    username              = azurerm_container_registry.acr.admin_username
    password_secret_name  = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "postgres-password"
    value = var.postgres_admin_password
  }

  secret {
    name = "database-url"
    value = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.postgres_db_name}?sslmode=require"
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "api"
      image  = "${azurerm_container_registry.acr.login_server}/backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "DB_HOST"
        value = azurerm_postgresql_flexible_server.main.fqdn
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_NAME"
        value = var.postgres_db_name
      }
      env {
        name  = "DB_USER"
        value = var.postgres_admin_username
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "postgres-password"
      }
      env {
        name = "DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }

  ingress {
    external_enabled = false # internal only, reached via the environment's DNS
    target_port       = 3000
    transport          = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [null_resource.build_backend_image]
}

##############################################################################
# Frontend Container App (compiled TSX -> nginx)
##############################################################################

resource "azurerm_container_app" "web" {
  name                         = "web"
  resource_group_name         = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                          = var.tags

  registry {
    server               = azurerm_container_registry.acr.login_server
    username              = azurerm_container_registry.acr.admin_username
    password_secret_name  = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "web"
      image  = "${azurerm_container_registry.acr.login_server}/frontend:latest"
      cpu    = 0.5
      memory = "1Gi"
    }
  }

  ingress {
    external_enabled = true
    target_port       = 80
    transport          = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [null_resource.build_frontend_image]
}

##############################################################################
# Prometheus Container App
##############################################################################

resource "azurerm_container_app" "prometheus" {
  name                         = "prometheus" # CHANGE ME
  resource_group_name         = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                          = var.tags

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "prometheus"
      image  = "prom/prometheus:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      args = ["--config.file=/etc/prometheus/prometheus.yml"]

      volume_mounts {
        name = "prometheus-config"
        path = "/etc/prometheus"
      }
    }

    volume {
      name         = "prometheus-config"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.prometheus_config.name
    }
  }

  ingress {
    external_enabled = false
    target_port       = 9090
    transport          = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

##############################################################################
# Grafana Container App
##############################################################################

resource "azurerm_container_app" "grafana" {
  name                         = "grafana"
  resource_group_name         = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  tags                          = var.tags

  secret {
    name  = "grafana-admin-password"
    value = var.grafana_admin_password
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "grafana"
      image  = "grafana/grafana:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "GF_SECURITY_ADMIN_USER"
        value = "admin"
      }
      env {
        name        = "GF_SECURITY_ADMIN_PASSWORD"
        secret_name = "grafana-admin-password"
      }
      env {
        name  = "PROMETHEUS_URL"
        value = "https://${azurerm_container_app.prometheus.name}.internal.${azurerm_container_app_environment.main.default_domain}"
      }

      volume_mounts {
        name = "grafana-datasources"
        path = "/etc/grafana/provisioning/datasources"
      }
      volume_mounts {
        name = "grafana-dashboards-provider"
        path = "/etc/grafana/provisioning/dashboards"
      }
      volume_mounts {
        name = "grafana-dashboards"
        path = "/var/lib/grafana/dashboards"
      }
    }

    volume {
      name         = "grafana-datasources"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.grafana_datasources.name
    }
    volume {
      name         = "grafana-dashboards-provider"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.grafana_dashboards_provider.name
    }
    volume {
      name         = "grafana-dashboards"
      storage_type = "AzureFile"
      storage_name = azurerm_container_app_environment_storage.grafana_dashboards.name
    }
  }

  ingress {
    external_enabled = true
    target_port       = 3000
    transport          = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

##############################################################################
# Migration Job
##############################################################################

resource "azurerm_container_app_job" "migrate" {
  name                         = "migrate"
  resource_group_name         = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  container_app_environment_id = azurerm_container_app_environment.main.id

  replica_timeout_in_seconds = 300
  replica_retry_limit        = 1

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name    = "migrate"
      image  = "${azurerm_container_registry.acr.login_server}/backend-migrate:latest"
      cpu     = 0.5
      memory  = "1Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }

  secret {
    name  = "database-url"
    value = "postgresql://${var.postgres_admin_username}:${urlencode(var.postgres_admin_password)}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.postgres_db_name}?sslmode=require"
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username              = azurerm_container_registry.acr.admin_username
    password_secret_name  = "acr-registry-password"
  }

  secret {
    name  = "acr-registry-password"
    value = azurerm_container_registry.acr.admin_password
  }

  depends_on = [null_resource.build_backend_migrate_image]
}

##############################################################################
# Outputs
##############################################################################

output "frontend_url" {
  value = "https://${azurerm_container_app.web.latest_revision_fqdn}"
}

output "backend_host" {
    value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "grafana_url" {
  value = "https://${azurerm_container_app.grafana.latest_revision_fqdn}"
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
