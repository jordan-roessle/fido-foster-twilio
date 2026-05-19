variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name purchased in Route 53"
  type        = string
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "fido-foster-twilio"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "auth_password" {
  description = "Password for the app"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for signing JWTs"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio auth token"
  type        = string
  sensitive   = true
}

variable "twilio_from_number" {
  description = "Twilio phone number to send from"
  type        = string
}
