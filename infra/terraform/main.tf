# Brisa Cubana Clean Intelligence - Infrastructure as Code
# Production environment with Railway (API) + Vercel (Web)
# References:
# - Vercel Terraform Provider: https://registry.terraform.io/providers/vercel/vercel/latest
# - Railway Community Provider: https://registry.terraform.io/providers/terraform-community-providers/railway/latest
# Consulted: 2025-10-02

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 3.15"
    }
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.7"
    }
  }

  # Backend for state management (uncomment when ready)
  # backend "s3" {
  #   bucket = "brisa-cubana-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# Vercel Provider (official)
provider "vercel" {
  # Set VERCEL_API_TOKEN environment variable
  # Scope: Full Access
  # Name: terraform
}

# Railway Provider (community-maintained, production-ready)
provider "railway" {
  # Set RAILWAY_TOKEN environment variable
}

# Variables
variable "environment" {
  description = "Environment name (production, staging, dev)"
  type        = string
  default     = "production"
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional)"
  type        = string
  default     = null
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection string"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth session secret"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend email API key"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for AI Concierge"
  type        = string
  sensitive   = true
}

# Outputs
output "vercel_project_url" {
  description = "Vercel project production URL"
  value       = vercel_project.web.production_deployment.url
}

output "railway_service_url" {
  description = "Railway API service URL"
  value       = "https://api.brisacubana.com"
}
