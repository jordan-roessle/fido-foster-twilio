variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the app"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}
