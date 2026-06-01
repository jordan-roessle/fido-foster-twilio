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

variable "twilio_messaging_service_sid" {
  description = "Twilio Messaging Service SID for bulk sending"
  type        = string
  sensitive   = true
}

variable "google_sheet_id" {
  description = "Google Sheet ID from the sheet URL"
  type        = string
}

variable "google_credentials" {
  description = "Google service account JSON"
  sensitive   = true
}

variable "send_twilio" {
  description = "Whether or not to send twilio"
  type        = string
  default     = "false"
}

variable "notification_phone_number" {
  description = "Phone number to forward inbound replies to"
  type        = string
}

variable "api_gateway_id" {
  description = "API Gateway ID for webhook URL construction"
  type        = string
}
