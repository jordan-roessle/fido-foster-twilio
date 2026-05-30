variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "handler" {
  description = "Lambda handler (filename.exportedFunction)"
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs22.x"
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "Lambda memory in MB"
  type        = number
  default     = 128
}

variable "environment_variables" {
  description = "Environment variables for the Lambda"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "artifact_path" {
  description = "Path to the zipped Lambda artifact"
  type        = string
}

variable "media_bucket_arn" {
  description = "ARN of the media bucket (optional, for upload Lambda only)"
  type        = string
  default     = ""
}
