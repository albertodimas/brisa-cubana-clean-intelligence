# Railway API Infrastructure
# Community Terraform Provider (production-ready)
# Reference: https://registry.terraform.io/providers/terraform-community-providers/railway/latest
# Consulted: 2025-10-02

# Railway Project
resource "railway_project" "api" {
  name = "brisa-cubana-clean-intelligence"
}

# Railway Environment (Production)
resource "railway_environment" "production" {
  project_id = railway_project.api.id
  name       = "production"
}

# Railway Service (API)
resource "railway_service" "api" {
  project_id = railway_project.api.id
  name       = "@brisa/api"

  source = {
    type = "github"
    repo = "albertodimas/brisa-cubana-clean-intelligence"
    branch = "main"
  }
}

# Railway Variables (Environment)
resource "railway_variable" "database_url" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "DATABASE_URL"
  value = var.database_url
}

resource "railway_variable" "redis_url" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "REDIS_URL"
  value = var.redis_url
}

resource "railway_variable" "jwt_secret" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "JWT_SECRET"
  value = var.jwt_secret
}

resource "railway_variable" "stripe_secret_key" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "STRIPE_SECRET_KEY"
  value = var.stripe_secret_key
}

resource "railway_variable" "stripe_webhook_secret" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "STRIPE_WEBHOOK_SECRET"
  value = var.stripe_webhook_secret
}

resource "railway_variable" "resend_api_key" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "RESEND_API_KEY"
  value = var.resend_api_key
}

resource "railway_variable" "openai_api_key" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "OPENAI_API_KEY"
  value = var.openai_api_key
}

resource "railway_variable" "node_env" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "NODE_ENV"
  value = "production"
}

resource "railway_variable" "api_port" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  name  = "API_PORT"
  value = "3001"
}

# Railway Domain
resource "railway_custom_domain" "api" {
  project_id     = railway_project.api.id
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id

  domain = "api.brisacubana.com"
}
