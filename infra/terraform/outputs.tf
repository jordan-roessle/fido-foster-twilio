output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = module.frontend.cloudfront_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend.cloudfront_distribution_id
}

output "s3_bucket_name" {
  description = "S3 bucket for frontend assets"
  value       = module.frontend.s3_bucket_name
}

output "api_endpoint" {
  description = "API Gateway base URL"
  value       = module.api_gateway.api_endpoint
}

output "media_bucket_name" {
  description = "Media S3 bucket name"
  value       = module.media.media_bucket_name
}

output "media_bucket_url" {
  description = "Media bucket base URL"
  value       = module.media.media_bucket_url
}
