# Vercel Web App Infrastructure
# Official Vercel Terraform Provider v3.15
# Reference: https://vercel.com/guides/integrating-terraform-with-vercel
# Consulted: 2025-10-02

# Vercel Project
resource "vercel_project" "web" {
  name      = "brisa-cubana-clean-intelligence"
  framework = "nextjs"
  team_id   = var.vercel_team_id

  git_repository = {
    type              = "github"
    repo              = "albertodimas/brisa-cubana-clean-intelligence"
    production_branch = "main"
  }

  build_command    = "pnpm --filter=web build"
  install_command  = "pnpm install --frozen-lockfile"
  output_directory = "apps/web/.next"
  root_directory   = "apps/web"

  serverless_function_region = "iad1" # us-east-1 equivalent

  environment = [
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = "https://api.brisacubana.com"
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_APP_URL"
      value  = "https://brisacubana.com"
      target = ["production"]
    },
    {
      key    = "NEXTAUTH_URL"
      value  = "https://brisacubana.com"
      target = ["production"]
    },
    {
      key       = "NEXTAUTH_SECRET"
      value     = var.nextauth_secret
      target    = ["production", "preview"]
      sensitive = true
    },
    {
      key    = "NODE_ENV"
      value  = "production"
      target = ["production"]
    }
  ]
}

# Vercel Domain
resource "vercel_project_domain" "production" {
  project_id = vercel_project.web.id
  domain     = "brisacubana.com"
}

# Vercel Firewall (Edge Security)
resource "vercel_firewall_config" "web_security" {
  project_id = vercel_project.web.id
  team_id    = var.vercel_team_id

  ip_rules = [
    {
      # Allow CloudFlare IPs (if using CDN)
      action = "allow"
      notes  = "CloudFlare CDN network"
    }
  ]

  # Rate limiting
  managed_rulesets = [
    {
      action = "challenge"
      name   = "Rate Limiting"
    }
  ]
}

# Deployment Protection (require preview approvals)
resource "vercel_project_deployment_protection" "web_protection" {
  project_id = vercel_project.web.id
  team_id    = var.vercel_team_id

  settings = {
    protection_bypass_for_automation = true
    production_deployment_approval   = true
  }
}
