variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the app"
  type        = string
}

variable "auth_lambda_invoke_arn" {
  description = "Invoke ARN of the auth Lambda"
  type        = string
}

variable "auth_lambda_function_name" {
  description = "Function name of the auth Lambda"
  type        = string
}

variable "send_lambda_invoke_arn" {
  description = "Invoke ARN of the send Lambda"
  type        = string
}

variable "send_lambda_function_name" {
  description = "Function name of the send Lambda"
  type        = string
}
