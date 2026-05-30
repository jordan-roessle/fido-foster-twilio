variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "domain_name" {
  description = "Domain name for CORS allowed origins"
  type        = string
}
